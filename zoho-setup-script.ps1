# Quick Zoho Setup Commands

# Step 4: PowerShell command to get refresh token
$body = @{
    grant_type = "authorization_code"
    client_id = "YOUR_CLIENT_ID"
    client_secret = "YOUR_CLIENT_SECRET"
    code = "YOUR_AUTHORIZATION_CODE"
    redirect_uri = "http://localhost:3000/api/auth/callback"
}

$response = Invoke-RestMethod -Uri "https://accounts.zoho.com/oauth/v2/token" -Method POST -Body $body -ContentType "application/x-www-form-urlencoded"

Write-Host "Access Token: $($response.access_token)"
Write-Host "Refresh Token: $($response.refresh_token)"
Write-Host "Expires In: $($response.expires_in) seconds"

