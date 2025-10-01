# =====================================================
# Database Migration Script for Microservices
# =====================================================
# This PowerShell script automates the database migration process

param(
    [string]$MySQLHost = "localhost",
    [int]$MySQLPort = 3306,
    [string]$MySQLUser = "root",
    [string]$MySQLPassword = "password",
    [string]$OldDatabase = "community",
    [switch]$SkipDataMigration = $false,
    [switch]$SkipBackup = $false,
    [string]$BackupPath = ".\backups"
)

# Configuration
$ErrorActionPreference = "Stop"
$ScriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$MigrationScript = Join-Path $ScriptPath "migrate-to-microservices.sql"
$DataMigrationScript = Join-Path $ScriptPath "data-migration-script.sql"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-MySQLConnection {
    param([string]$Host, [int]$Port, [string]$User, [string]$Password)
    
    try {
        $connectionString = "Server=$Host;Port=$Port;Uid=$User;Pwd=$Password;"
        $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
        $connection.Open()
        $connection.Close()
        return $true
    }
    catch {
        return $false
    }
}

function Invoke-MySQLScript {
    param([string]$ScriptPath, [string]$Host, [int]$Port, [string]$User, [string]$Password)
    
    try {
        $connectionString = "Server=$Host;Port=$Port;Uid=$User;Pwd=$Password;"
        $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
        $connection.Open()
        
        $scriptContent = Get-Content $ScriptPath -Raw
        $command = New-Object MySql.Data.MySqlClient.MySqlCommand($scriptContent, $connection)
        $command.ExecuteNonQuery()
        
        $connection.Close()
        return $true
    }
    catch {
        Write-ColorOutput "Error executing script: $($_.Exception.Message)" $Red
        return $false
    }
}

function Backup-Database {
    param([string]$Database, [string]$BackupPath, [string]$Host, [int]$Port, [string]$User, [string]$Password)
    
    try {
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = Join-Path $BackupPath "$Database`_backup_$timestamp.sql"
        
        if (!(Test-Path $BackupPath)) {
            New-Item -ItemType Directory -Path $BackupPath -Force | Out-Null
        }
        
        $mysqldumpPath = "mysqldump"
        $arguments = @(
            "--host=$Host",
            "--port=$Port",
            "--user=$User",
            "--password=$Password",
            "--single-transaction",
            "--routines",
            "--triggers",
            $Database
        )
        
        Write-ColorOutput "Creating backup of database '$Database'..." $Yellow
        & $mysqldumpPath $arguments | Out-File -FilePath $backupFile -Encoding UTF8
        
        if (Test-Path $backupFile) {
            Write-ColorOutput "Backup created: $backupFile" $Green
            return $backupFile
        }
        else {
            Write-ColorOutput "Failed to create backup" $Red
            return $null
        }
    }
    catch {
        Write-ColorOutput "Error creating backup: $($_.Exception.Message)" $Red
        return $null
    }
}

function Restore-Database {
    param([string]$BackupFile, [string]$Host, [int]$Port, [string]$User, [string]$Password)
    
    try {
        $mysqlPath = "mysql"
        $arguments = @(
            "--host=$Host",
            "--port=$Port",
            "--user=$User",
            "--password=$Password"
        )
        
        Write-ColorOutput "Restoring database from backup..." $Yellow
        Get-Content $BackupFile | & $mysqlPath $arguments
        
        Write-ColorOutput "Database restored successfully" $Green
        return $true
    }
    catch {
        Write-ColorOutput "Error restoring database: $($_.Exception.Message)" $Red
        return $false
    }
}

# Main execution
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Community Hub Database Migration to Microservices" $Blue
Write-ColorOutput "================================================" $Blue
Write-ColorOutput ""

# Check if MySQL connection is available
Write-ColorOutput "Testing MySQL connection..." $Yellow
if (!(Test-MySQLConnection -Host $MySQLHost -Port $MySQLPort -User $MySQLUser -Password $MySQLPassword)) {
    Write-ColorOutput "Failed to connect to MySQL server. Please check your credentials." $Red
    exit 1
}
Write-ColorOutput "MySQL connection successful" $Green

# Create backup if requested
if (!$SkipBackup) {
    Write-ColorOutput ""
    Write-ColorOutput "Creating backup of existing database..." $Yellow
    $backupFile = Backup-Database -Database $OldDatabase -BackupPath $BackupPath -Host $MySQLHost -Port $MySQLPort -User $MySQLUser -Password $MySQLPassword
    if (!$backupFile) {
        Write-ColorOutput "Backup failed. Aborting migration." $Red
        exit 1
    }
}

# Execute schema migration
Write-ColorOutput ""
Write-ColorOutput "Executing schema migration..." $Yellow
if (!(Invoke-MySQLScript -ScriptPath $MigrationScript -Host $MySQLHost -Port $MySQLPort -User $MySQLUser -Password $MySQLPassword)) {
    Write-ColorOutput "Schema migration failed. Aborting." $Red
    exit 1
}
Write-ColorOutput "Schema migration completed successfully" $Green

# Execute data migration if requested
if (!$SkipDataMigration) {
    Write-ColorOutput ""
    Write-ColorOutput "Executing data migration..." $Yellow
    if (!(Invoke-MySQLScript -ScriptPath $DataMigrationScript -Host $MySQLHost -Port $MySQLPort -User $MySQLUser -Password $MySQLPassword)) {
        Write-ColorOutput "Data migration failed. You may need to restore from backup." $Red
        Write-ColorOutput "To restore: .\run-migration.ps1 -RestoreFromBackup `"$backupFile`"" $Yellow
        exit 1
    }
    Write-ColorOutput "Data migration completed successfully" $Green
}

# Verify migration
Write-ColorOutput ""
Write-ColorOutput "Verifying migration..." $Yellow

$verificationQueries = @(
    "SELECT 'User Service' as service, COUNT(*) as total_users FROM community_users.users;",
    "SELECT 'Content Service' as service, COUNT(*) as total_posts FROM community_content.posts;",
    "SELECT 'Chat Service' as service, COUNT(*) as total_rooms FROM community_chat.chat_rooms;",
    "SELECT 'Notification Service' as service, COUNT(*) as total_notifications FROM community_notifications.notifications;"
)

try {
    $connectionString = "Server=$MySQLHost;Port=$MySQLPort;Uid=$MySQLUser;Pwd=$MySQLPassword;"
    $connection = New-Object MySql.Data.MySqlClient.MySqlConnection($connectionString)
    $connection.Open()
    
    foreach ($query in $verificationQueries) {
        $command = New-Object MySql.Data.MySqlClient.MySqlCommand($query, $connection)
        $reader = $command.ExecuteReader()
        while ($reader.Read()) {
            Write-ColorOutput "$($reader['service']): $($reader[1]) records" $Green
        }
        $reader.Close()
    }
    
    $connection.Close()
}
catch {
    Write-ColorOutput "Error during verification: $($_.Exception.Message)" $Red
}

Write-ColorOutput ""
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Migration completed successfully!" $Green
Write-ColorOutput "================================================" $Blue
Write-ColorOutput ""
Write-ColorOutput "Next steps:" $Yellow
Write-ColorOutput "1. Update service connection strings in appsettings.json files" $White
Write-ColorOutput "2. Test each microservice individually" $White
Write-ColorOutput "3. Test API Gateway integration" $White
Write-ColorOutput "4. Monitor service health and performance" $White
Write-ColorOutput ""
Write-ColorOutput "Service databases created:" $Yellow
Write-ColorOutput "- community_users (User Service)" $White
Write-ColorOutput "- community_content (Content Service)" $White
Write-ColorOutput "- community_chat (Chat Service)" $White
Write-ColorOutput "- community_notifications (Notification Service)" $White
