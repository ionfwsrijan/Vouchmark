# Creates a Bedrock Guardrail that keeps Vouchmark informational.
# Prints {guardrailId}/{version} — paste into deploy parameters GUARDRAIL_ID / VERSION.
$ErrorActionPreference = "Stop"

$name = "vouchmark"
$desc = "Keeps the claim-assistant informational: blocks guaranteed outcomes and legal/financial advice."
$blockedMsg = "The request was blocked. This tool provides information, never a promise or advice."

$guardrail = @{
    name                      = $name
    description               = $desc
    blockedInputMessaging     = $blockedMsg
    blockedOutputMessaging    = $blockedMsg
    topicPolicyConfig         = @{
        topicsConfig = @(
            @{
                name        = "ClaimOutcomeGuarantee"
                definition  = "Guaranteeing, promising or stating that an insurance claim will or will not be accepted, paid, rejected or overturned."
                examples    = @(
                    "Your claim will be paid.",
                    "This rejection will be overturned for sure.",
                    "They will definitely refund the money."
                )
                type        = "DENY"
                action      = "BLOCK"
                inputModalities  = @("TEXT")
                outputModalities = @("TEXT")
            },
            @{
                name        = "LegalOrFinancialAdvice"
                definition  = "Providing personalized legal or financial advice, recommending specific lawyers, or drafting documents for filing a formal legal case."
                examples    = @(
                    "You should sue the insurer.",
                    "Hire this specific lawyer.",
                    "I recommend you file a complaint in this court."
                )
                type        = "DENY"
                action      = "BLOCK"
                inputModalities  = @("TEXT")
                outputModalities = @("TEXT")
            }
        )
    }
    contentPolicyConfig       = @{
        filtersConfig = @(
            @{
                type           = "PROMPT_INSECURITY"
                inputStrength  = "HIGH"
                outputStrength = "HIGH"
            }
        )
    }
}

$tmp = Join-Path $env:TEMP "vouchmark-guardrail.json"
$guardrail | ConvertTo-Json -Depth 8 | Set-Content -Path $tmp -Encoding utf8

Write-Host "Creating Bedrock Guardrail '$name'..."
$out = aws bedrock put-guardrail --cli-input-json "file://$tmp"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Guardrail creation failed. Check 'aws bedrock list-guardrails' and confirm Bedrock is enabled in your region."
}
$out | Write-Host
Write-Host ""
Write-Host "Next: pass the values above into your deploy as GUARDRAIL_ID / GUARDRAIL_VERSION."