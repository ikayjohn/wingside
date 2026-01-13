# PowerShell Script to Test Nomba Webhook
# Run this in PowerShell (not Command Prompt)

# Test webhook endpoint
$body = @{
    event_type = "payment_success"
    requestId = "test_$(Get-Date -Format 'yyyyMMddHHmmss')"
    data = @{
        transaction = @{
            transactionId = "txn_$(Get-Date -Format 'yyyyMMddHHmmss')"
            type = "PAYMENT"
            transactionAmount = 2500
            fee = 75
            time = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ssZ")
        }
        order = @{
            orderReference = "WS-TEST-$(Get-Date -Format 'yyyyMMddHHmmss')"
            customerEmail = "test@example.com"
            amount = 2500
            currency = "NGN"
            customerId = "test_123"
            callbackUrl = "https://www.wingside.ng/payment/nomba/callback"
        }
        merchant = @{
            userId = "merchant_123"
            walletId = "wallet_123"
            walletBalance = 50000
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "Testing Nomba Webhook..." -ForegroundColor Yellow
Write-Host "Sending to: https://www.wingside.ng/api/payment/nomba/webhook" -ForegroundColor Cyan
Write-Host ""

try {
    $response = Invoke-RestMethod `
        -Uri "https://www.wingside.ng/api/payment/nomba/webhook" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ Webhook Success!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Webhook Failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press Enter to exit..."
Read-Host
