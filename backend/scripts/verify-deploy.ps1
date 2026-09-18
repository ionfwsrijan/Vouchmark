# Smoke-test a deployed Vouchmark backend without a browser.
#   scripts\verify-deploy.ps1 -ApiUrl https://<your-api-gateway-url> -Region ap-south-1
# ASCII-only so it is safe from a clean PowerShell.
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiUrl,
    [string]$Region = ""
)
$ErrorActionPreference = "Stop"

$base = $ApiUrl.TrimEnd("/")

function Get-UsePrefix {
    # Local demo server routes /api/* ; the deployed API Gateway routes bare /path.
    # GET /api/cases returns 200 only on the local server, so it is a clean probe.
    try {
        Invoke-RestMethod -Method Get -Uri "$base/api/cases" -TimeoutSec 10 | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

Write-Host "==> 1/3 health" -ForegroundColor Cyan
$health = Invoke-RestMethod -Method Get -Uri "$base/health"
Write-Host ("  service={0} demoMode={1}" -f $health.service, $health.demoMode)
if (-not $health.ok) { throw "Health check failed." }

Write-Host "==> 2/3 analyze (demo pipeline, pasted text)" -ForegroundColor Cyan
$prefix = if (Get-UsePrefix) { "/api" } else { "" }
$analyzePath = "$prefix/analyze"
$body = @{
    deviceId = "smoke-test-device"
    language = "English"
    text     = "Claim rejected because intimation was not given within 24 hours."
} | ConvertTo-Json
$result = Invoke-RestMethod -Method Post -Uri "$base$analyzePath" -ContentType "application/json" -Body $body
$analysis = $result.analysis
if ($analysis.verdict.label -eq "NEEDS_INPUT" -and -not $analysis.letter) {
    throw "Analysis returned no verdict or letter."
}
Write-Host ("  verdict={0} grounds={1} letterChars={2}" -f `
    $analysis.verdict.label, $analysis.assessments.Count, $analysis.letter.Length)
if ($null -eq $analysis.numbers) { throw "numbers block missing." }
if ($null -eq $analysis.preparation) { throw "preparation block missing." }

Write-Host "==> 3/3 case persisted + reopenable" -ForegroundColor Cyan
$caseId = $result.caseId
$detailPath = "$prefix/cases/$($caseId)?deviceId=smoke-test-device"
$reopened = Invoke-RestMethod -Method Get -Uri "$base$detailPath"
if (-not $reopened.case.analysis) { throw "Case detail did not return analysis." }
Write-Host ("  caseId={0} reopenable=yes" -f $caseId)

Write-Host ""
Write-Host "Smoke test OK. Open the CloudFront URL for the live demo." -ForegroundColor Green