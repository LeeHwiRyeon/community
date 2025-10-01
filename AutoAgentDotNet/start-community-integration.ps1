Write-Host "Starting AutoAgent with Community Platform Integration..." -ForegroundColor Green

Set-Location "C:\Users\hwi\Desktop\Projects\community\AutoAgentDotNet\AutoAgent.Worker"

Write-Host ""
Write-Host "Setting environment to Community integration..." -ForegroundColor Yellow
$env:ASPNETCORE_ENVIRONMENT = "Community"

Write-Host ""
Write-Host "Starting AutoAgent..." -ForegroundColor Green
dotnet run --environment Community
