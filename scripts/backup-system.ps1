# Automated Backup System for Community Hub
# Comprehensive backup and disaster recovery solution

param(
    [string]$BackupType = "full", # full, incremental, database, files
    [string]$Destination = "backups",
    [int]$RetentionDays = 30,
    [switch]$Compress,
    [switch]$Encrypt,
    [string]$EncryptionKey = "community_backup_key_2024"
)

Write-Host "🔄 Community Hub Backup System" -ForegroundColor Green
Write-Host "=============================" -ForegroundColor Green

# Configuration
$Config = @{
    Database = @{
        Host     = "localhost"
        Port     = 3306
        User     = "community_user"
        Password = "community_password_2024"
        Name     = "community_hub"
    }
    Redis    = @{
        Host     = "localhost"
        Port     = 6379
        Password = "community_redis_password_2024"
    }
    Files    = @{
        Uploads = "uploads"
        Logs    = "server-backend/logs"
        Config  = "server-backend/.env"
    }
    Backup   = @{
        Destination   = $Destination
        RetentionDays = $RetentionDays
        Compress      = $Compress
        Encrypt       = $Encrypt
        EncryptionKey = $EncryptionKey
    }
}

# Create backup directory
$BackupDir = Join-Path $Config.Backup.Destination (Get-Date -Format "yyyy-MM-dd_HH-mm-ss")
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

Write-Host "📁 Backup directory: $BackupDir" -ForegroundColor Yellow

# Function to create database backup
function Backup-Database {
    Write-Host "🗄️  Backing up database..." -ForegroundColor Blue
    
    $DbBackupFile = Join-Path $BackupDir "database.sql"
    
    try {
        # Create MySQL dump
        $DumpCommand = "mysqldump -h $($Config.Database.Host) -P $($Config.Database.Port) -u $($Config.Database.User) -p$($Config.Database.Password) $($Config.Database.Name)"
        
        Invoke-Expression $DumpCommand | Out-File -FilePath $DbBackupFile -Encoding UTF8
        
        if (Test-Path $DbBackupFile) {
            $FileSize = (Get-Item $DbBackupFile).Length
            Write-Host "✅ Database backup created: $FileSize bytes" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Database backup failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Database backup error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to backup Redis data
function Backup-Redis {
    Write-Host "🔴 Backing up Redis data..." -ForegroundColor Blue
    
    $RedisBackupFile = Join-Path $BackupDir "redis.rdb"
    
    try {
        # Connect to Redis and save
        $RedisCommand = "redis-cli -h $($Config.Redis.Host) -p $($Config.Redis.Port) -a $($Config.Redis.Password) BGSAVE"
        Invoke-Expression $RedisCommand | Out-Null
        
        # Wait for save to complete
        Start-Sleep -Seconds 5
        
        # Copy RDB file
        $RedisRdbPath = "redis-temp/redis.rdb"
        if (Test-Path $RedisRdbPath) {
            Copy-Item $RedisRdbPath $RedisBackupFile
            Write-Host "✅ Redis backup created" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ Redis backup failed - RDB file not found" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Redis backup error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to backup application files
function Backup-Files {
    Write-Host "📁 Backing up application files..." -ForegroundColor Blue
    
    $FilesBackupDir = Join-Path $BackupDir "files"
    New-Item -ItemType Directory -Path $FilesBackupDir -Force | Out-Null
    
    $FilesBackedUp = 0
    
    # Backup uploads
    if (Test-Path $Config.Files.Uploads) {
        $UploadsBackup = Join-Path $FilesBackupDir "uploads"
        Copy-Item -Path $Config.Files.Uploads -Destination $UploadsBackup -Recurse -Force
        $FilesBackedUp++
        Write-Host "✅ Uploads backed up" -ForegroundColor Green
    }
    
    # Backup logs
    if (Test-Path $Config.Files.Logs) {
        $LogsBackup = Join-Path $FilesBackupDir "logs"
        Copy-Item -Path $Config.Files.Logs -Destination $LogsBackup -Recurse -Force
        $FilesBackedUp++
        Write-Host "✅ Logs backed up" -ForegroundColor Green
    }
    
    # Backup configuration
    if (Test-Path $Config.Files.Config) {
        $ConfigBackup = Join-Path $FilesBackupDir "config"
        Copy-Item -Path $Config.Files.Config -Destination $ConfigBackup -Force
        $FilesBackedUp++
        Write-Host "✅ Configuration backed up" -ForegroundColor Green
    }
    
    if ($FilesBackedUp -gt 0) {
        Write-Host "✅ Files backup completed: $FilesBackedUp items" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "❌ No files to backup" -ForegroundColor Red
        return $false
    }
}

# Function to compress backup
function Compress-Backup {
    if (-not $Config.Backup.Compress) {
        return $true
    }
    
    Write-Host "🗜️  Compressing backup..." -ForegroundColor Blue
    
    try {
        $CompressedFile = "$BackupDir.zip"
        Compress-Archive -Path $BackupDir -DestinationPath $CompressedFile -Force
        
        if (Test-Path $CompressedFile) {
            $OriginalSize = (Get-ChildItem $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum
            $CompressedSize = (Get-Item $CompressedFile).Length
            $CompressionRatio = [math]::Round((1 - $CompressedSize / $OriginalSize) * 100, 2)
            
            Write-Host "✅ Backup compressed: $CompressionRatio% reduction" -ForegroundColor Green
            
            # Remove original directory
            Remove-Item $BackupDir -Recurse -Force
            return $true
        }
        else {
            Write-Host "❌ Compression failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Compression error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to encrypt backup
function Encrypt-Backup {
    if (-not $Config.Backup.Encrypt) {
        return $true
    }
    
    Write-Host "🔐 Encrypting backup..." -ForegroundColor Blue
    
    try {
        $BackupFile = if ($Config.Backup.Compress) { "$BackupDir.zip" } else { $BackupDir }
        $EncryptedFile = "$BackupFile.encrypted"
        
        # Simple encryption using PowerShell (in production, use proper encryption)
        $Key = [System.Text.Encoding]::UTF8.GetBytes($Config.Backup.EncryptionKey.PadRight(32))
        $Content = [System.IO.File]::ReadAllBytes($BackupFile)
        
        # XOR encryption (simple example - use proper encryption in production)
        $EncryptedContent = for ($i = 0; $i -lt $Content.Length; $i++) {
            $Content[$i] -bxor $Key[$i % $Key.Length]
        }
        
        [System.IO.File]::WriteAllBytes($EncryptedFile, $EncryptedContent)
        
        if (Test-Path $EncryptedFile) {
            Write-Host "✅ Backup encrypted" -ForegroundColor Green
            
            # Remove unencrypted file
            Remove-Item $BackupFile -Force
            return $true
        }
        else {
            Write-Host "❌ Encryption failed" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Encryption error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to clean old backups
function Clean-OldBackups {
    Write-Host "🧹 Cleaning old backups..." -ForegroundColor Blue
    
    try {
        $CutoffDate = (Get-Date).AddDays(-$Config.Backup.RetentionDays)
        $OldBackups = Get-ChildItem $Config.Backup.Destination -Directory | Where-Object { $_.CreationTime -lt $CutoffDate }
        
        $RemovedCount = 0
        foreach ($Backup in $OldBackups) {
            Remove-Item $Backup.FullName -Recurse -Force
            $RemovedCount++
        }
        
        if ($RemovedCount -gt 0) {
            Write-Host "✅ Removed $RemovedCount old backups" -ForegroundColor Green
        }
        else {
            Write-Host "✅ No old backups to remove" -ForegroundColor Green
        }
        
        return $true
    }
    catch {
        Write-Host "❌ Cleanup error: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to create backup manifest
function Create-BackupManifest {
    $ManifestFile = Join-Path $BackupDir "backup-manifest.json"
    
    $Manifest = @{
        Timestamp  = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
        Type       = $BackupType
        Version    = "1.0"
        Components = @{
            Database = Test-Path (Join-Path $BackupDir "database.sql")
            Redis    = Test-Path (Join-Path $BackupDir "redis.rdb")
            Files    = Test-Path (Join-Path $BackupDir "files")
        }
        Size       = if (Test-Path $BackupDir) { (Get-ChildItem $BackupDir -Recurse | Measure-Object -Property Length -Sum).Sum } else { 0 }
        Compressed = $Config.Backup.Compress
        Encrypted  = $Config.Backup.Encrypt
    }
    
    $Manifest | ConvertTo-Json -Depth 3 | Out-File -FilePath $ManifestFile -Encoding UTF8
    Write-Host "📋 Backup manifest created" -ForegroundColor Green
}

# Main backup execution
function Start-Backup {
    $StartTime = Get-Date
    $SuccessCount = 0
    $TotalSteps = 0
    
    Write-Host "🚀 Starting $BackupType backup..." -ForegroundColor Cyan
    
    # Database backup
    if ($BackupType -eq "full" -or $BackupType -eq "database") {
        $TotalSteps++
        if (Backup-Database) { $SuccessCount++ }
    }
    
    # Redis backup
    if ($BackupType -eq "full" -or $BackupType -eq "database") {
        $TotalSteps++
        if (Backup-Redis) { $SuccessCount++ }
    }
    
    # Files backup
    if ($BackupType -eq "full" -or $BackupType -eq "files") {
        $TotalSteps++
        if (Backup-Files) { $SuccessCount++ }
    }
    
    # Compress backup
    if ($Config.Backup.Compress) {
        $TotalSteps++
        if (Compress-Backup) { $SuccessCount++ }
    }
    
    # Encrypt backup
    if ($Config.Backup.Encrypt) {
        $TotalSteps++
        if (Encrypt-Backup) { $SuccessCount++ }
    }
    
    # Create manifest
    Create-BackupManifest
    
    # Clean old backups
    Clean-OldBackups
    
    $EndTime = Get-Date
    $Duration = $EndTime - $StartTime
    
    Write-Host "`n📊 Backup Summary" -ForegroundColor Green
    Write-Host "=================" -ForegroundColor Green
    Write-Host "Type: $BackupType" -ForegroundColor White
    Write-Host "Duration: $($Duration.TotalSeconds.ToString('F2')) seconds" -ForegroundColor White
    Write-Host "Success Rate: $($SuccessCount)/$TotalSteps ($([math]::Round($SuccessCount/$TotalSteps*100, 1))%)" -ForegroundColor White
    Write-Host "Location: $BackupDir" -ForegroundColor White
    
    if ($SuccessCount -eq $TotalSteps) {
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        return $true
    }
    else {
        Write-Host "⚠️  Backup completed with warnings" -ForegroundColor Yellow
        return $false
    }
}

# Execute backup
Start-Backup
