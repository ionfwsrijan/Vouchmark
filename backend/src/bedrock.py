"""Minimal, lazy Boto3 wrapper around the Amazon Bedrock Converse API.

Instantiating a boto3 client is deliberately deferred until the actual call,
so pure-logic modules and local tests never need an account or credentials.
"""
from __future__ import annotations

import base64
import json
import os
from typing import Any, Optional


def _bedrock_client():
    import boto3  # lazy import: keeps laptop-only tests free of the SDK
    return boto3.client(
        "bedrock-runtime",
        region_name=(os.environ.get("AWS_REGION") or "ap-south-1"),
    )


def default_model_id() -> str:
    return os.environ.get(
        "BEDROCK_MODEL_ID", "anthropic.claude-sonnet-4-20250514"
    )


def guardrails_config() -> Optional[dict]:
    gid = os.environ.get("GUARDRAIL_ID")
    gver = os.environ.get("GUARDRAIL_VERSION")
    if gid and gver:
        return {
            "guardrailIdentifier": gid,
            "guardrailVersion": gver,
        }
    return None


def _content_blocks(*, document_b64: Optional[str], mime: str, text: str) -> list:
    blocks: list[dict] = []
    if document_b64:
        raw = base64.b64decode(document_b64)
        mime = (mime or "").lower()
        if mime == "application/pdf":
            blocks.append({
                "document": {
                    "format": "pdf",
                    "name": "rejection-letter.pdf",
                    "source": {"bytes": raw},
                }
            })
        else:
            fmt = {"image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp"}.get(
                mime, "jpeg"
            )
            blocks.append({
                "image": {
                    "format": fmt,
                    "source": {"bytes": raw},
                }
            })
    if text.strip():
        blocks.append({"text": text})
    return blocks


def invoke_converse(
    *,
    system: str,
    user_text: str,
    document_b64: Optional[str] = None,
    mime: str = "",
    model_id: Optional[str] = None,
    max_tokens: int = 2400,
) -> str:
    """One Converse round-trip. Returns the assistant text."""
    client = _bedrock_client()
    body: dict[str, Any] = {
        "modelId": model_id or default_model_id(),
        "messages": [
            {
                "role": "user",
                "content": [
                    {"text": system},
                    *_content_blocks(document_b64=document_b64, mime=mime, text=user_text),
                ],
            }
        ],
        "inferenceConfig": {"maxTokens": max_tokens, "temperature": 0.1},
    }
    g = guardrails_config()
    if g:
        body["guardrailConfig"] = g

    resp = client.converse(**body)
    try:
        out = resp["output"]["message"]["content"]
        return " ".join(b.get("text", "") for b in out if b.get("text"))
    except (KeyError, TypeError) as exc:  # pragma: no cover
        raise RuntimeError("Unexpected Bedrock response shape") from exc


def guardrail_blocked(exc: Exception) -> bool:
    """Heuristic: did Bedrock refuse due to our own guardrail? Return True."""
    message = str(exc).lower()
    return "guardrail" in message and ("blocked" in message or "traversal" in message)


def compose_language_fallback(error: Exception) -> dict:
    """A friendly shape when Bedrock fails, so the UI never white-screens."""
    return {
        "kind": "model_error",
        "detail": f"Model unavailable: {type(error).__name__}",
        "message": (
            "The analysis model could not be reached. This usually means Bedrock "
            "model access has not been granted yet (see README, Day 1) or the "
            "model id is unavailable in your region. Demo mode works without it."
        ),
    }