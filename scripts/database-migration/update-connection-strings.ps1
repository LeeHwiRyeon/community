# =====================================================
# Update Connection Strings for Microservices
# =====================================================
# This script updates connection strings in all service configuration files

param(
    [string]$MySQLHost = "localhost",
    [int]$MySQLPort = 3306,
    [string]$RedisHost = "localhost",
    [int]$RedisPort = 6379,
    [string]$ProjectRoot = "..\..\"
)

# Service configurations
$services = @(
    @{
        Name = "User Service"
        Path = "services\user-service\appsettings.json"
        ConnectionString = "Server=$MySQLHost;Port=$MySQLPort;Database=community_users;Uid=community_user_service;Pwd=user_service_password;"
        RedisConnection = "$RedisHost`:$RedisPort"
    },
    @{
        Name = "Content Service"
        Path = "services\content-service\appsettings.json"
        ConnectionString = "Server=$MySQLHost;Port=$MySQLPort;Database=community_content;Uid=community_content_service;Pwd=content_service_password;"
        RedisConnection = "$RedisHost`:$RedisPort"
    },
    @{
        Name = "Chat Service"
        Path = "services\chat-service\appsettings.json"
        ConnectionString = "Server=$MySQLHost;Port=$MySQLPort;Database=community_chat;Uid=community_chat_service;Pwd=chat_service_password;"
        RedisConnection = "$RedisHost`:$RedisPort"
    },
    @{
        Name = "Notification Service"
        Path = "services\notification-service\appsettings.json"
        ConnectionString = "Server=$MySQLHost;Port=$MySQLPort;Database=community_notifications;Uid=community_notification_service;Pwd=notification_service_password;"
        RedisConnection = "$RedisHost`:$RedisPort"
    },
    @{
        Name = "API Gateway"
        Path = "services\api-gateway\appsettings.json"
        ConnectionString = ""
        RedisConnection = "$RedisHost`:$RedisPort"
    }
)

function Update-ConnectionString {
    param(
        [string]$FilePath,
        [string]$ConnectionString,
        [string]$RedisConnection
    )
    
    try {
        if (Test-Path $FilePath) {
            $json = Get-Content $FilePath -Raw | ConvertFrom-Json
            
            if ($ConnectionString) {
                $json.ConnectionStrings.DefaultConnection = $ConnectionString
            }
            
            if ($RedisConnection) {
                $json.ConnectionStrings.Redis = $RedisConnection
            }
            
            $json | ConvertTo-Json -Depth 10 | Set-Content $FilePath -Encoding UTF8
            return $true
        } else {
            Write-Warning "File not found: $FilePath"
            return $false
        }
    }
    catch {
        Write-Error "Error updating $FilePath`: $($_.Exception.Message)"
        return $false
    }
}

# Main execution
Write-Host "================================================" -ForegroundColor Blue
Write-Host "Updating Connection Strings for Microservices" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

$successCount = 0
$totalCount = $services.Count

foreach ($service in $services) {
    $fullPath = Join-Path $ProjectRoot $service.Path
    Write-Host "Updating $($service.Name)..." -ForegroundColor Yellow
    
    if (Update-ConnectionString -FilePath $fullPath -ConnectionString $service.ConnectionString -RedisConnection $service.RedisConnection) {
        Write-Host "✓ $($service.Name) updated successfully" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "✗ Failed to update $($service.Name)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "Connection String Update Summary" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host "Updated: $successCount/$totalCount services" -ForegroundColor $(if ($successCount -eq $totalCount) { "Green" } else { "Yellow" })

if ($successCount -eq $totalCount) {
    Write-Host ""
    Write-Host "All connection strings updated successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start all microservices" -ForegroundColor White
    Write-Host "2. Test API Gateway routing" -ForegroundColor White
    Write-Host "3. Verify service health endpoints" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "Some services failed to update. Please check the errors above." -ForegroundColor Red
}
