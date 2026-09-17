# Build + deploy the backend (SAM). Requires: aws-sam-cli installed.
#   winget install AWS.SAM-CLI          (or) pip install aws-sam-cli
# Run BEFORE deploying the frontend — it prints the ApiUrl you need.
param(
    [string]$StackName = "vouchmark",
    [string]$Region = "",
    [string]$AllowedOrigin = "*",
    [string]$ModelId = "anthropic.claude-sonnet-4-20250514",
    [string]$GuardrailId = "",
    [string]$GuardrailVersion = "",
    [switch]$DemoMode
)
$ErrorActionPreference = "Stop"

if (-not $Region) {
    $Region = aws configure get region
}
if (-not $Region) {
    Write-Host "No region configured. Use: .\deploy-backend.ps1 -Region ap-south-1" -ForegroundColor Red
    exit 1
}

$demo = if ($DemoMode) { "true" } else { "false" }
$overrides = "BedrockModelId=$ModelId DemoMode=$demo AllowedOrigin=$AllowedOrigin GuardrailId=$GuardrailId GuardrailVersion=$GuardrailVersion"

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