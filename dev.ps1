# One-command developer harness for Vouchmark.
#
#   .\dev.ps1 setup          install backend + frontend dependencies
#   .\dev.ps1 test           backend pytest + frontend vitest
#   .\dev.ps1 build          frontend typecheck + production build
#   .\dev.ps1 serve          full offline demo on http://localhost:8000  (default)
#   .\dev.ps1 deploy         backend then frontend (requires AWS + SAM CLI)
param(
    [Parameter(Position = 0)]
    [ValidateSet("setup", "test", "build", "serve", "deploy")]
    [string]$Task = "serve"
)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

function Invoke-Task([string]$Name, [scriptblock]$Body) {
    Write-Host "`n=== $Name ===" -ForegroundColor Cyan
    & $Body
}

switch ($Task) {
    "setup" {
        Invoke-Task "frontend deps (npm ci)" {
            Push-Location $frontend
            try { npm ci --no-audit --no-fund } finally { Pop-Location }
        }
        Invoke-Task "backend deps (pip)" {
            py -m pip install --quiet -r (Join-Path $backend "requirements.txt")
        }
    }
    "test" {
        Invoke-Task "backend pytest"   { py -m pytest (Join-Path $backend "tests") -q }
        Invoke-Task "frontend vitest"  {
            Push-Location $frontend
            try { npm test } finally { Pop-Location }
        }
    }
    "build" {
        Invoke-Task "frontend typecheck + build" {
            Push-Location $frontend
            try { npm run build } finally { Pop-Location }
        }
    }
    "deploy" {
        Invoke-Task "deploy backend (SAM)" {
            & (Join-Path $backend "scripts\deploy-backend.ps1")
        }
        Invoke-Task "deploy frontend (S3 + CloudFront)" {
            & (Join-Path $backend "scripts\deploy-frontend.ps1")
        }
    }
    default {
        Invoke-Task "local demo server" {
            & (Join-Path $backend "scripts\run-local.ps1")
        }
    }
}