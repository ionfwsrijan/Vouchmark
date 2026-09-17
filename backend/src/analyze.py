"""Lambda handler: the public API surface.

Routes:
  POST /analyze   -> analyze a rejection letter (image/PDF base64 or pasted text)
  GET  /cases     -> recent cases for an anonymous deviceId
  GET  /health    -> liveness

Environment:
  DEMO_MODE           "1" -> skip Bedrock, use the deterministic demo pipeline
  BEDROCK_MODEL_ID    e.g. anthropic.claude-sonnet-4-20250514
  GUARDRAIL_ID        / GUARDRAIL_VERSION  (both set -> guardrail applied)
  CASES_TABLE         DynamoDB table name
  ALLOWED_ORIGIN      CORS origin ("*" default; set the hosted URL in prod)
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
import uuid
from typing import Any, Optional

from . import ddb
from .demo import demo_analysis
from .extract import AnalysisError, run_analysis
from .models import AnalysisContext

logging.basicConfig(level=logging.INFO)
LOGGER = logging.getLogger("vouchmark")

MAX_DOC_BYTES = 5 * 1024 * 1024          # after client-side downscale, more than enough
MAX_TEXT_CHARS = 20_000
VALID_MIMES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
SYSTEM_USER_AGENT_RE = re.compile(r"^[a-zA-Z0-9-]{1,64}$")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": os.environ.get("ALLOWED_ORIGIN", "*"),
    "Access-Control-Allow-Headers": "Content-Type,X-Requested-With",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
}

DEFAULT_DEVICE = "anonymous"


def _api(status: int, body: dict) -> dict:
    return {
        "statusCode": status,
        "headers": CORS_HEADERS,
        "body": json.dumps(body, ensure_ascii=False),
        "isBase64Encoded": False,
    }


def _ok(body: dict) -> dict:
    return _api(200, body)


def _bad(message: str) -> dict:
    return _api(400, {"ok": False, "error": message})


def _fail(status: int, message: str) -> dict:
    return _api(status, {"ok": False, "error": message})


def _read_body(event: dict) -> dict:
    raw = event.get("body")
    if not raw:
        return {}
    try:
        parsed = json.loads(raw) if isinstance(raw, str) else raw
    except json.JSONDecodeError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


def _validate_mime(mime: Optional[str]) -> str:
    m = (mime or "").lower()
    if m not in VALID_MIMES:
        raise ValueError("Unsupported file type. Use JPEG, PNG, WebP or PDF.")
    return m


def _clean_device(raw: Optional[str]) -> str:
    if not raw:
        return DEFAULT_DEVICE
    cleaned = re.sub(r"[^a-zA-Z0-9_-]", "", raw)[:64]
    return cleaned or DEFAULT_DEVICE


def handle_analyze(event: dict) -> dict:
    body = _read_body(event)
    document_b64 = body.get("document") or None
    text = (body.get("text") or "").strip()

    if not document_b64 and not text:
        return _bad(
            "Nothing to analyze. Attach a photo/PDF of the rejection letter or "
            "paste its exact wording."
        )

    if document_b64:
        if len(document_b64) > 8 * 1024 * 1024:
            return _bad(
                "The attached file is too large. Try a smaller photo (the app "
                "already downsizes images before upload)."
            )
        try:
            payload_bytes = base64.b64decode(document_b64, validate=True)
        except Exception:  # noqa: BLE001
            return _bad("The attached document is not valid base64 data.")
        if len(payload_bytes) > MAX_DOC_BYTES:
            return _bad(
                "The attached file exceeds 5 MB after decoding. Please use a "
                "smaller photo."
            )
        try:
            mime = _validate_mime(body.get("mimeType"))
        except ValueError as exc:
            return _bad(str(exc))
    else:
        payload_bytes = None
        mime = ""
        if len(text) > MAX_TEXT_CHARS:
            return _bad("The pasted text is too long. Keep it under 20,000 characters.")

    if len(text) > MAX_TEXT_CHARS:
        text = text[:MAX_TEXT_CHARS]

    language = str(body.get("language") or "English")[:40]
    context = AnalysisContext.from_dict(body.get("context") or {})

    try:
        if os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes"):
            payload = demo_analysis(language=language, context=context, pasted_text=text)
            if document_b64:
                payload["analysis"]["meta"]["usedDocument"] = True
        else:
            payload = run_analysis(
                language=language,
                context=context,
                document_b64=document_b64,
                mime=mime,
                text=text,
            )
    except AnalysisError as exc:
        return _fail(502, str(exc))
    except Exception:  # noqa: BLE001
        LOGGER.exception("Unexpected analysis failure")
        return _fail(
            500,
            "Something went wrong while analyzing the letter. Please try again; "
            "if it keeps failing, run with DEMO_MODE=1 to unblock the demo.",
        )

    device_id = _clean_device(body.get("deviceId"))
    case_id = str(uuid.uuid4())
    ddb.save_case(device_id, case_id, payload)

    payload["caseId"] = case_id
    return _ok(payload)


def handle_cases(event: dict) -> dict:
    params = event.get("queryStringParameters") or {}
    device_id = _clean_device(params.get("deviceId"))
    try:
        limit = max(1, min(int(params.get("limit") or 10), 50))
    except ValueError:
        limit = 10
    return _ok({"ok": True, "cases": ddb.list_cases(device_id, limit)})


def handle_health() -> dict:
    return _ok({
        "ok": True,
        "service": "vouchmark",
        "demoMode": os.environ.get("DEMO_MODE", "").lower() in ("1", "true", "yes"),
        "regionsHint": "works over the open Internet",
    })


def lambda_handler(event: dict, context: Any) -> dict:
    http_method = event.get("httpMethod", "GET").upper()
    resource = event.get("resource", event.get("routeKey", ""))

    if http_method == "OPTIONS":
        return _api(200, {"ok": True})

    try:
        if resource.endswith("/analyze") and http_method == "POST":
            return handle_analyze(event)
        if resource.endswith("/cases") and http_method == "GET":
            return handle_cases(event)
        if resource.endswith("/health") or resource == "/":
            return handle_health()
    except Exception:  # noqa: BLE001
        LOGGER.exception("Unhandled route error")
        return _fail(500, "Internal error.")

    return _fail(404, "Not found.")