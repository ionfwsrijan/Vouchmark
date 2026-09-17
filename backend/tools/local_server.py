# Run the full backend inside a tiny HTTP server, no SAM, no Docker, no AWS.
# This is the "Build It" track demo path: python3 only + the compiled frontend.
from __future__ import annotations

import json
import os
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT.parent / "frontend" / "dist"

if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src import analyze  # noqa: E402  (must run after sys.path is set)

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class Handler(BaseHTTPRequestHandler):
    def _json(self, body: dict, status: int = 200) -> None:
        raw = json.dumps(body, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def _headers_from_event(self, event: dict) -> dict:
        return event.get("headers", {})

    def _serve_static(self, path: str) -> None:
        if not DIST.exists():
            self._json(
                {
                    "ok": False,
                    "error": "frontend not built yet. Run scripts/run-local.ps1 which builds it first.",
                },
                500,
            )
            return
        rel = path.lstrip("/") or "index.html"
        candidate = (DIST / rel).resolve()
        if not candidate.is_file() or DIST not in candidate.parents:
            candidate = DIST / "index.html"
        try:
            data = candidate.read_bytes()
        except OSError:
            candidate = DIST / "index.html"
            data = candidate.read_bytes()
        ctype = {
            ".html": "text/html; charset=utf-8",
            ".js": "text/javascript",
            ".css": "text/css",
            ".json": "application/json",
            ".svg": "image/svg+xml",
            ".png": "image/png",
            ".ico": "image/x-icon",
        }.get(candidate.suffix.lower(), "application/octet-stream")
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _route_api(self) -> None:
        body_bytes = b""
        length = int(self.headers.get("Content-Length") or 0)
        if length:
            body_bytes = self.rfile.read(length)

        # Translate this HTTP request into an API Gateway-shaped event.
        path = self.path.split("?")[0]
        query = None
        if "?" in self.path:
            from urllib.parse import parse_qs

            q = parse_qs(self.path.split("?", 1)[1])
            query = {k: v[0] for k, v in q.items()}

        resource_map = {
            "/api/analyze": "/analyze",
            "/api/cases": "/cases",
            "/health": "/health",
        }
        resource = resource_map.get(path, path)
        path_params = None
        if path.startswith("/api/cases/"):
            case_id = path.split("/", 3)[-1]
            resource = "/cases/{caseId}"
            path_params = {"caseId": case_id}

        event = {
            "httpMethod": self.command,
            "resource": resource,
            "body": body_bytes.decode("utf-8") if body_bytes else None,
            "queryStringParameters": query,
            "pathParameters": path_params,
        }
        try:
            result = analyze.lambda_handler(event, None)
        except Exception as exc:  # noqa: BLE001
            self._json({"ok": False, "error": f"local handler crashed: {exc}"}, 500)
            return

        status = result.get("statusCode", 200)
        headers = result.get("headers", {})
        raw_body = result.get("body", "{}")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        for key, value in headers.items():
            if key.lower().startswith("access-control"):
                self.send_header(key, value)
        b = raw_body.encode("utf-8") if isinstance(raw_body, str) else raw_body
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def do_GET(self) -> None:  # noqa: N802
        if self.path.startswith(("/api/", "/health", "/cases")):
            self._route_api()
        else:
            self._serve_static(self.path)

    def do_POST(self) -> None:  # noqa: N802
        if self.path.startswith("/api/"):
            self._route_api()
        else:
            self.send_error(404)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, *args) -> None:  # silent but not deaf
        pass


def main() -> None:
    demo_on = os.environ.get("DEMO_MODE")
    os.environ["DEMO_MODE"] = (demo_on or "1").lower()
    server = ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Vouchmark local server → http://localhost:{PORT}")
    print("DEMO_MODE enabled (no Bedrock needed). Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()