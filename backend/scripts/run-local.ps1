# Local end-to-end demo — no AWS account, no Docker, no credits.
# Builds the frontend, then serves it + the API on http://localhost:8000
# with the deterministic demo pipeline.
$ErrorActionPreference = "Stop"
$root = Join-Path $PSScriptRoot ".."
Push-Location (Join-Path $root "frontend")
try {
    if (-not (Test-Path "node_modules")) {
        Write-Host "==> npm ci" -ForegroundColor Cyan
        npm ci --no-audit --no-fund
    }
    Write-Host "==> npm run build" -ForegroundColor Cyan
    npm run build

    # Point the *local* bundle at the local server (no real API involved).
    Set-Content -Path "dist\config.js" -Value 'window.APP_CONFIG = { "apiUrl": "/api" };' -Encoding utf8
}
finally {
    Pop-Location
}

Write-Host "==> starting local server" -ForegroundColor Cyan
py (Join-Path $root "backend\tools\local_server.py") 8000