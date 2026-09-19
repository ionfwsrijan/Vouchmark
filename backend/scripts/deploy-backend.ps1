# Build + deploy the backend (SAM). Requires: aws-sam-cli installed.
#   winget install AWS.SAM-CLI          (or) pip install aws-sam-cli
# Run BEFORE deploying the frontend — it prints the ApiUrl you need.
param(
    [string]$StackName = "vouchmark",
    [string]$Region = "",
    [string]$AllowedOrigin = "*",
    [string]$ModelId = "anthropic.claude-sonnet-4-20250514-v1:0",
    [string]$GuardrailId = "",
    [string]$GuardrailVersion = "",
    [switch]$DemoMode,
    [switch]$UseCloudFront
)
$ErrorActionPreference = "Stop"

# sam is often pip-installed (not on PATH). Give a hint instead of a cryptic error.
if (-not (Get-Command sam -ErrorAction SilentlyContinue)) {
    Write-Host "The SAM CLI was not found on PATH." -ForegroundColor Red
    Write-Host "  winget -> winget install AWS.SAM-CLI   |   pip -> pip install aws-sam-cli"
    Write-Host "If installed via pip only, prepend its Scripts dir to PATH, e.g.:"
    Write-Host '  $env:Path = "$env:LOCALAPPDATA\Programs\Python\Python313\Scripts;$env:Path"'
    exit 1
}

if (-not $Region) {
    $Region = aws configure get region
}
if (-not $Region) {
    Write-Host "No region configured. Use: .\deploy-backend.ps1 -Region ap-south-1" -ForegroundColor Red
    exit 1
}

$demo = if ($DemoMode) { "true" } else { "false" }
$cff = if ($UseCloudFront) { "true" } else { "false" }
$overrides = "BedrockModelId=$ModelId DemoMode=$demo AllowedOrigin=$AllowedOrigin GuardrailId=$GuardrailId GuardrailVersion=$GuardrailVersion UseCloudFront=$cff"

Write-Host "==> sam build" -ForegroundColor Cyan
sam build
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host "==> sam deploy" -ForegroundColor Cyan
sam deploy `
    --stack-name $StackName `
    --region $Region `
    --capabilities CAPABILITY_IAM `
    --parameter-overrides $overrides `
    --no-fail-on-empty-changeset

if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "Deployed. Fetching URLs..." -ForegroundColor Cyan
$stack = aws cloudformation describe-stacks --stack-name $StackName --region $Region --query "Stacks[0].Outputs" --output json | ConvertFrom-Json
foreach ($o in $stack) {
    Write-Host ("  {0} = {1}" -f $o.OutputKey, $o.OutputValue)
}
Write-Host ""
Write-Host "Next:  .\deploy-frontend.ps1 -ApiUrl <the ApiUrl above>" -ForegroundColor Green