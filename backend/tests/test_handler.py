from __future__ import annotations

import json

from src.analyze import lambda_handler


def _req(method: str, resource: str, body: dict | None = None, query: dict | None = None) -> dict:
    event = {"httpMethod": method, "resource": resource}
    if body is not None:
        event["body"] = json.dumps(body)
    if query is not None:
        event["queryStringParameters"] = query
    return lambda_handler(event, None)


def test_health():
    out = _req("GET", "/health")
    assert out["statusCode"] == 200
    assert json.loads(out["body"])["ok"] is True


def test_options_cors(monkeypatch):
    monkeypatch.setenv("ALLOWED_ORIGIN", "https://x.example")
    out = _req("OPTIONS", "/analyze")
    assert out["statusCode"] == 200
    assert "Access-Control-Allow-Origin" in out["headers"]


def test_analyze_requires_input():
    out = _req("POST", "/analyze", body={})
    assert out["statusCode"] == 400


def test_analyze_rejects_bad_base64(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    out = _req(
        "POST",
        "/analyze",
        body={"document": "!!!not-base64!!!", "mimeType": "image/png"},
    )
    assert out["statusCode"] == 400


def test_analyze_demo_mode_via_text(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    out = _req(
        "POST",
        "/analyze",
        body={
            "text": "Claim rejected: pre-existing disease, no intimation.",
            "language": "English",
            "deviceId": "abc-123",
        },
    )
    assert out["statusCode"] == 200
    payload = json.loads(out["body"])
    assert payload["ok"] is True
    assert payload["analysis"]["generatedVia"] == "demo"
    assert payload["caseId"]


def test_analyze_demo_mode_via_document(monkeypatch):
    import base64

    monkeypatch.setenv("DEMO_MODE", "1")
    # 1x1 px png — never decoded in demo mode, just validated
    png = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100).decode()
    out = _req(
        "POST",
        "/analyze",
        body={"document": png, "mimeType": "image/png", "deviceId": "abc-123"},
    )
    assert out["statusCode"] == 200
    payload = json.loads(out["body"])
    assert payload["analysis"]["meta"].get("usedDocument") is True


def test_analyze_rejects_unknown_mime(monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "1")
    import base64

    out = _req(
        "POST",
        "/analyze",
        body={
            "document": base64.b64encode(b"hello").decode(),
            "mimeType": "application/x-msdownload",
        },
    )
    assert out["statusCode"] == 400


def test_cases_without_device_returns_empty(monkeypatch):
    out = _req("GET", "/cases")
    assert out["statusCode"] == 200
    assert json.loads(out["body"])["cases"] == []


def test_cases_exposes_cursor(monkeypatch):
    import ddb as ddb_mod

    monkeypatch.setattr(ddb_mod, "list_cases", lambda d, l, c=None: ([], "ck-1"))
    out = _req(
        "GET",
        "/cases",
        query={"deviceId": "dev", "cursor": "ck-0", "limit": "3"},
    )
    body = json.loads(out["body"])
    assert body["nextCursor"] == "ck-1"


def test_case_detail_returns_stored_analysis(monkeypatch):
    import ddb as ddb_mod

    monkeypatch.setattr(
        ddb_mod,
        "get_case",
        lambda d, c: {"caseId": c, "analysis": {"verdict": {"label": "NEEDS_INPUT"}}},
    )
    out = lambda_handler(
        {
            "httpMethod": "GET",
            "resource": "/cases/{caseId}",
            "pathParameters": {"caseId": "abc"},
            "queryStringParameters": {"deviceId": "dev"},
        },
        None,
    )
    assert out["statusCode"] == 200
    body = json.loads(out["body"])
    assert body["case"]["analysis"]["verdict"]["label"] == "NEEDS_INPUT"


def test_case_detail_404_when_missing(monkeypatch):
    import ddb as ddb_mod

    monkeypatch.setattr(ddb_mod, "get_case", lambda d, c: None)
    out = lambda_handler(
        {
            "httpMethod": "GET",
            "resource": "/cases/{caseId}",
            "pathParameters": {"caseId": "nope"},
            "queryStringParameters": {"deviceId": "dev"},
        },
        None,
    )
    assert out["statusCode"] == 404
    assert json.loads(out["body"])["code"] == "case_not_found"


def test_unknown_route_404():
    out = _req("GET", "/nothing")
    assert out["statusCode"] == 404