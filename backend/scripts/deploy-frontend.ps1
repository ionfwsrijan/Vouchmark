# Build the Vite frontend and push it to the S3 bucket behind CloudFront.
param(
    [string]$StackName = "vouchmark",
    [string]$Region = "",
    [string]$ApiUrl = ""
)
$ErrorActionPreference = "Stop"

if (-not $Region) { $Region = aws configure get region }

function Get-StackOutput($key) {
    aws cloudformation describe-stacks `
        --stack-name $StackName --region $Region `
        --query "Stacks[0].Outputs[?OutputKey=='$key'].OutputValue" --output text
}

if (-not $ApiUrl) { $ApiUrl = Get-StackOutput "ApiUrl" }
$bucket = Get-StackOutput "FrontendBucketName"
$domain = Get-StackOutput "CloudFrontUrl"
if (-not $ApiUrl -or -not $bucket) {
    Write-Host "Could not read stack outputs. Deploy the backend first, or pass -ApiUrl / -Bucket." -ForegroundColor Red
    exit 1
}

$front = Join-Path $PSScriptRoot "..\..\frontend"
Push-Location $front
try {
    Write-Host "==> npm ci" -ForegroundColor Cyan
    npm ci --no-audit --no-fund
    Write-Host "==> npm run build" -ForegroundColor Cyan
    npm run build
    if ($LASTEXITCODE -ne 0) { exit 1 }

    # Runtime config: injected after build so the same bundle works in any env.
    $cfg = 'window.APP_CONFIG = { "apiUrl": "' + $ApiUrl.Trim() + '" };'
    Set-Content -Path "dist\config.js" -Value $cfg -Encoding utf8

    Write-Host "==> s3 sync (Bucket=$bucket)" -ForegroundColor Cyan
    aws s3 sync dist "s3://$bucket" --delete
    if ($LASTEXITCODE -ne 0) { exit 1 }
}
finally {
    Pop-Location
}

if ($domain) {
    $distId = aws cloudfront list-distributions `
        --query "DistributionList.Items[?DomainName=='$domain'].Id" --output text
    if ($distId -and $distId -notmatch "None") {
        Write-Host "==> invalidating CloudFront" -ForegroundColor Cyan
        aws cloudfront create-invalidation --distribution-id $distId --paths "/*" --output text | Out-Null
    }
}

Write-Host ""
Write-Host "Live at: https://$domain (cache may take a minute to refresh)" -ForegroundColor Green