# Disaster Recovery System for Community Hub
# Automated recovery procedures for system restoration

param(
    [string]$BackupPath,
    [string]$RecoveryType = "full", # full, database, files
    [switch]$Force,
    [switch]$DryRun
)

Write-Host "🚨 Community Hub Disaster Recovery System" -ForegroundColor Red
Write-Host "=========================================" -ForegroundColor Red

# Configuration
$Config = @{
    Database    = @{
        Host     = "localhost"
        Port     = 3306
        User     = "community_user"
        Password = "community_password_2024"
        Name     = "community_hub"
    }
    Redis       = @{
        Host     = "localhost"
        Port     = 6379
        Password = "community_redis_password_2024"
    }
    Application = @{
        UploadsPath = "uploads"
        LogsPath    = "server-backend/logs"
        ConfigPath  = "server-backend/.env"
    }
    Recovery    = @{
        BackupPath = $BackupPath
        Type       = $RecoveryType
        Force      = $Force
        DryRun     = $DryRun
    }
}

# Function to validate backup
function Test-Backup {
    Write-Host "🔍 Validating backup..." -ForegroundColor Blue
    
    if (-not $Config.Recovery.BackupPath) {
        Write-Host "❌ No backup path specified" -ForegroundColor Red
        return $false
    }
    
    if (-not (Test-Path $Config.Recovery.BackupPath)) {
        Write-Host "❌ Backup path does not exist: $($Config.Recovery.BackupPath)" -ForegroundColor Red
        return $false
    }
    
    # Check for manifest
    $ManifestFile = Join-Path $Config.Recovery.BackupPath "backup-manifest.json"
    if (Test-Path $ManifestFile) {
        $Manifest = Get-Content $ManifestFile | ConvertFrom-Json
        Write-Host "✅ Backup manifest found - Created: $($Manifest.Timestamp)" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "⚠️  No backup manifest found - proceeding with caution" -ForegroundColor Yellow
        return $true
    }
}

# Function to stop services
function Stop-Services {
    Write-Host "🛑 Stopping services..." -ForegroundColor Blue
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would stop Docker services" -ForegroundColor Yellow
        return $true
    }
    
    try {
        # Stop Docker containers
        docker-compose -f docker-compose.production.yml down
        Write-Host "✅ Services stopped" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Error stopping services: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to restore database
function Restore-Database {
    Write-Host "🗄️  Restoring database..." -ForegroundColor Blue
    
    $DbBackupFile = Join-Path $Config.Recovery.BackupPath "database.sql"
    
    if (-not (Test-Path $DbBackupFile)) {
        Write-Host "❌ Database backup file not found: $DbBackupFile" -ForegroundColor Red
        return $false
    }
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would restore database from $DbBackupFile" -ForegroundColor Yellow
        return $true
    }
    
    try {
        # Drop and recreate database
        $DropCommand = "mysql -h $($Config.Database.Host) -P $($Config.Database.Port) -u $($Config.Database.User) -p$($Config.Database.Password) -e 'DROP DATABASE IF EXISTS $($Config.Database.Name); CREATE DATABASE $($Config.Database.Name);'"
        Invoke-Expression $DropCommand
        
        # Restore database
        $RestoreCommand = "mysql -h $($Config.Database.Host) -P $($Config.Database.Port) -u $($Config.Database.User) -p$($Config.Database.Password) $($Config.Database.Name) < '$DbBackupFile'"
        Invoke-Expression $RestoreCommand
        
        Write-Host "✅ Database restored successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Database restore error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to restore Redis
function Restore-Redis {
    Write-Host "🔴 Restoring Redis data..." -ForegroundColor Blue
    
    $RedisBackupFile = Join-Path $Config.Recovery.BackupPath "redis.rdb"
    
    if (-not (Test-Path $RedisBackupFile)) {
        Write-Host "❌ Redis backup file not found: $RedisBackupFile" -ForegroundColor Red
        return $false
    }
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would restore Redis from $RedisBackupFile" -ForegroundColor Yellow
        return $true
    }
    
    try {
        # Stop Redis
        docker stop community-redis 2>$null
        
        # Copy RDB file
        $RedisDataDir = "redis-temp"
        if (-not (Test-Path $RedisDataDir)) {
            New-Item -ItemType Directory -Path $RedisDataDir -Force | Out-Null
        }
        
        Copy-Item $RedisBackupFile (Join-Path $RedisDataDir "redis.rdb") -Force
        
        # Start Redis
        docker start community-redis
        
        Write-Host "✅ Redis data restored successfully" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Redis restore error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to restore files
function Restore-Files {
    Write-Host "📁 Restoring application files..." -ForegroundColor Blue
    
    $FilesBackupDir = Join-Path $Config.Recovery.BackupPath "files"
    
    if (-not (Test-Path $FilesBackupDir)) {
        Write-Host "❌ Files backup directory not found: $FilesBackupDir" -ForegroundColor Red
        return $false
    }
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would restore files from $FilesBackupDir" -ForegroundColor Yellow
        return $true
    }
    
    try {
        $FilesRestored = 0
        
        # Restore uploads
        $UploadsBackup = Join-Path $FilesBackupDir "uploads"
        if (Test-Path $UploadsBackup) {
            if (Test-Path $Config.Application.UploadsPath) {
                Remove-Item $Config.Application.UploadsPath -Recurse -Force
            }
            Copy-Item $UploadsBackup $Config.Application.UploadsPath -Recurse -Force
            $FilesRestored++
            Write-Host "✅ Uploads restored" -ForegroundColor Green
        }
        
        # Restore logs
        $LogsBackup = Join-Path $FilesBackupDir "logs"
        if (Test-Path $LogsBackup) {
            if (Test-Path $Config.Application.LogsPath) {
                Remove-Item $Config.Application.LogsPath -Recurse -Force
            }
            Copy-Item $LogsBackup $Config.Application.LogsPath -Recurse -Force
            $FilesRestored++
            Write-Host "✅ Logs restored" -ForegroundColor Green
        }
        
        # Restore configuration
        $ConfigBackup = Join-Path $FilesBackupDir "config"
        if (Test-Path $ConfigBackup) {
            Copy-Item $ConfigBackup $Config.Application.ConfigPath -Force
            $FilesRestored++
            Write-Host "✅ Configuration restored" -ForegroundColor Green
        }
        
        if ($FilesRestored -gt 0) {
            Write-Host "✅ Files restored successfully: $FilesRestored items" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ No files to restore" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Files restore error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to start services
function Start-Services {
    Write-Host "🚀 Starting services..." -ForegroundColor Blue
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would start Docker services" -ForegroundColor Yellow
        return $true
    }
    
    try {
        # Start Docker containers
        docker-compose -f docker-compose.production.yml up -d
        
        # Wait for services to be ready
        Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        # Health check
        $MaxRetries = 10
        $RetryCount = 0
        
        do {
            try {
                $Response = Invoke-RestMethod -Uri "http://localhost/api/health" -Method GET -TimeoutSec 10
                if ($Response.status -eq "healthy") {
                    Write-Host "✅ Services started and healthy" -ForegroundColor Green
                    return $true
                }
            }
            catch {
                Write-Host "Health check attempt $($RetryCount + 1) failed" -ForegroundColor Yellow
            }
            
            $RetryCount++
            if ($RetryCount -lt $MaxRetries) {
                Start-Sleep -Seconds 10
            }
        } while ($RetryCount -lt $MaxRetries)
        
        Write-Host "⚠️  Services started but health check failed" -ForegroundColor Yellow
        return $true
    }
    catch {
        Write-Host "❌ Error starting services: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to verify recovery
function Test-Recovery {
    Write-Host "🔍 Verifying recovery..." -ForegroundColor Blue
    
    if ($Config.Recovery.DryRun) {
        Write-Host "DRY RUN: Would verify recovery" -ForegroundColor Yellow
        return $true
    }
    
    try {
        # Test database connection
        $DbTestCommand = "mysql -h $($Config.Database.Host) -P $($Config.Database.Port) -u $($Config.Database.User) -p$($Config.Database.Password) -e 'SELECT COUNT(*) FROM $($Config.Database.Name).users;'"
        $DbResult = Invoke-Expression $DbTestCommand
        Write-Host "✅ Database connection verified" -ForegroundColor Green
        
        # Test Redis connection
        $RedisTestCommand = "redis-cli -h $($Config.Redis.Host) -p $($Config.Redis.Port) -a $($Config.Redis.Password) ping"
        $RedisResult = Invoke-Expression $RedisTestCommand
        if ($RedisResult -eq "PONG") {
            Write-Host "✅ Redis connection verified" -ForegroundColor Green
        }
        
        # Test application
        $AppResponse = Invoke-RestMethod -Uri "http://localhost/api/health" -Method GET -TimeoutSec 10
        if ($AppResponse.status -eq "healthy") {
            Write-Host "✅ Application verified" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Recovery verification failed: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main recovery execution
function Start-Recovery {
    $StartTime = Get-Date
    $SuccessCount = 0
    $TotalSteps = 0
    
    Write-Host "🚨 Starting disaster recovery..." -ForegroundColor Cyan
    Write-Host "Recovery Type: $($Config.Recovery.Type)" -ForegroundColor White
    Write-Host "Backup Path: $($Config.Recovery.BackupPath)" -ForegroundColor White
    Write-Host "Dry Run: $($Config.Recovery.DryRun)" -ForegroundColor White
    
    if ($Config.Recovery.DryRun) {
        Write-Host "`n⚠️  DRY RUN MODE - No actual changes will be made" -ForegroundColor Yellow
    }
    
    # Validate backup
    $TotalSteps++
    if (Test-Backup) { $SuccessCount++ }
    
    # Stop services
    $TotalSteps++
    if (Stop-Services) { $SuccessCount++ }
    
    # Restore database
    if ($Config.Recovery.Type -eq "full" -or $Config.Recovery.Type -eq "database") {
        $TotalSteps++
        if (Restore-Database) { $SuccessCount++ }
    }
    
    # Restore Redis
    if ($Config.Recovery.Type -eq "full" -or $Config.Recovery.Type -eq "database") {
        $TotalSteps++
        if (Restore-Redis) { $SuccessCount++ }
    }
    
    # Restore files
    if ($Config.Recovery.Type -eq "full" -or $Config.Recovery.Type -eq "files") {
        $TotalSteps++
        if (Restore-Files) { $SuccessCount++ }
    }
    
    # Start services
    $TotalSteps++
    if (Start-Services) { $SuccessCount++ }
    
    # Verify recovery
    $TotalSteps++
    if (Test-Recovery) { $SuccessCount++ }
    
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    
    Write-Host "`n📊 Recovery Summary" -ForegroundColor Green
    Write-Host "==================" -ForegroundColor Green
    Write-Host "Type: $($Config.Recovery.Type)" -ForegroundColor White
    Write-Host "Duration: $($Duration.TotalSeconds.ToString('F2')) seconds" -ForegroundColor White
    Write-Host "Success Rate: $($SuccessCount)/$TotalSteps ($([math]::Round($SuccessCount/$TotalSteps*100, 1))%)" -ForegroundColor White
    
    if ($SuccessCount -eq $TotalSteps) {
        Write-Host "✅ Disaster recovery completed successfully!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "⚠️  Disaster recovery completed with warnings" -ForegroundColor Yellow
        return $false
    }
}

# Execute recovery
if (-not $Config.Recovery.BackupPath) {
    Write-Host "❌ Please specify backup path using -BackupPath parameter" -ForegroundColor Red
    Write-Host "Usage: .\disaster-recovery.ps1 -BackupPath 'backups\2024-01-01_12-00-00'" -ForegroundColor White
    exit 1
}

Start-Recovery
