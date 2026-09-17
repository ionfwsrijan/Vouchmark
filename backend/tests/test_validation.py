from __future__ import annotations

import base64
import json

from src.analyze import lambda_handler


def _req(body: dict) -> dict:
    return lambda_handler(
        {"httpMethod": "POST", "resource": "/analyze", "body": json.dumps(body)},
        None,
    )


def test_oversized_pasted_text_rejected():
    out = _req({"text": "x" * 20001})
    assert out["statusCode"] == 400
    body = json.loads(out["body"])
    assert body["ok"] is False


def test_oversized_document_payload_rejected():
    doc = base64.b64encode(b"a" * (5 * 1024 * 1024 + 1)).decode()
    out = _req({"document": doc, "mimeType": "image/jpeg"})
    assert out["statusCode"] == 400


def test_unknown_mime_rejected():
    doc = base64.b64encode(b"hello").decode()
    out = _req({"document": doc, "mimeType": "text/plain"})
    assert out["statusCode"] == 400


def test_garbage_context_is_tolerated(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    out = _req({"text": "claim rejected", "context": "just a string"})
    assert out["statusCode"] == 200


def test_long_language_is_truncated_not_rejected(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    out = _req({"text": "claim rejected", "language": "E" * 500})
    assert out["statusCode"] == 200