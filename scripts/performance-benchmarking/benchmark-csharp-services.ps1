# =====================================================
# C# .NET Microservices Performance Benchmark
# =====================================================
# This script benchmarks the performance of C# .NET microservices

param(
    [int]$ConcurrentUsers = 100,
    [int]$DurationSeconds = 60,
    [int]$RampUpSeconds = 10,
    [string]$BaseUrl = "https://localhost:7000",
    [string]$OutputPath = ".\benchmark-results",
    [switch]$DetailedMetrics = $false
)

# Import required modules
Import-Module -Name "WebAdministration" -ErrorAction SilentlyContinue

# Configuration
$ErrorActionPreference = "Stop"
$services = @(
    @{ Name = "User Service"; Port = 7001; Endpoints = @("/api/users", "/api/auth/login", "/api/users/1") },
    @{ Name = "Content Service"; Port = 7002; Endpoints = @("/api/posts", "/api/posts/1", "/api/search") },
    @{ Name = "Chat Service"; Port = 7003; Endpoints = @("/api/chat/rooms", "/api/chat/messages") },
    @{ Name = "Notification Service"; Port = 7004; Endpoints = @("/api/notifications", "/api/notifications/1") },
    @{ Name = "API Gateway"; Port = 7000; Endpoints = @("/api/gateway/health", "/api/users", "/api/posts") }
)

# Test data
$testUsers = @(
    @{ username = "testuser1"; email = "test1@example.com"; password = "Test123!" },
    @{ username = "testuser2"; email = "test2@example.com"; password = "Test123!" },
    @{ username = "testuser3"; email = "test3@example.com"; password = "Test123!" }
)

$testPosts = @(
    @{ title = "Performance Test Post 1"; content = "This is a test post for performance benchmarking." },
    @{ title = "Performance Test Post 2"; content = "Another test post to measure response times." },
    @{ title = "Performance Test Post 3"; content = "Third test post for load testing purposes." }
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Test-ServiceHealth {
    param([string]$ServiceName, [int]$Port)
    
    try {
        $url = "http://localhost:$Port/health"
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        return $false
    }
}

function Start-Service {
    param([string]$ServiceName, [string]$ServicePath)
    
    try {
        Write-ColorOutput "Starting $ServiceName..." $Yellow
        
        # Check if service is already running
        $process = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$ServiceName*" }
        if ($process) {
            Write-ColorOutput "$ServiceName is already running" $Green
            return $true
        }
        
        # Start the service
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "dotnet"
        $startInfo.Arguments = "run --project `"$ServicePath`""
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $startInfo.CreateNoWindow = $true
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        
        # Wait for service to start
        Start-Sleep -Seconds 5
        
        return $true
    }
    catch {
        Write-ColorOutput "Failed to start $ServiceName`: $($_.Exception.Message)" $Red
        return $false
    }
}

function Stop-Service {
    param([string]$ServiceName)
    
    try {
        $processes = Get-Process -Name "dotnet" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*$ServiceName*" }
        foreach ($process in $processes) {
            $process.Kill()
            $process.WaitForExit(5000)
        }
        Write-ColorOutput "Stopped $ServiceName" $Green
    }
    catch {
        Write-ColorOutput "Error stopping $ServiceName`: $($_.Exception.Message)" $Red
    }
}

function Measure-ResponseTime {
    param([string]$Url, [string]$Method = "GET", [hashtable]$Body = $null, [hashtable]$Headers = $null)
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $params = @{
            Uri             = $Url
            Method          = $Method
            TimeoutSec      = 30
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            $params.ContentType = "application/json"
        }
        
        if ($Headers) {
            $params.Headers = $Headers
        }
        
        $response = Invoke-WebRequest @params
        $stopwatch.Stop()
        
        return @{
            StatusCode    = $response.StatusCode
            ResponseTime  = $stopwatch.ElapsedMilliseconds
            ContentLength = $response.Content.Length
            Success       = $true
        }
    }
    catch {
        $stopwatch.Stop()
        return @{
            StatusCode    = 0
            ResponseTime  = $stopwatch.ElapsedMilliseconds
            ContentLength = 0
            Success       = $false
            Error         = $_.Exception.Message
        }
    }
}

function Run-LoadTest {
    param([string]$ServiceName, [int]$Port, [array]$Endpoints, [int]$ConcurrentUsers, [int]$DurationSeconds)
    
    Write-ColorOutput "Running load test for $ServiceName..." $Yellow
    
    $results = @{
        ServiceName        = $ServiceName
        Port               = $Port
        TotalRequests      = 0
        SuccessfulRequests = 0
        FailedRequests     = 0
        ResponseTimes      = @()
        Errors             = @()
        StartTime          = Get-Date
    }
    
    $endTime = (Get-Date).AddSeconds($DurationSeconds)
    $rampUpEndTime = (Get-Date).AddSeconds($RampUpSeconds)
    
    # Create concurrent users
    $jobs = @()
    for ($i = 1; $i -le $ConcurrentUsers; $i++) {
        $job = Start-Job -ScriptBlock {
            param($ServiceName, $Port, $Endpoints, $DurationSeconds, $RampUpSeconds, $TestUsers, $TestPosts)
            
            $results = @{
                TotalRequests      = 0
                SuccessfulRequests = 0
                FailedRequests     = 0
                ResponseTimes      = @()
                Errors             = @()
            }
            
            $endTime = (Get-Date).AddSeconds($DurationSeconds)
            $rampUpEndTime = (Get-Date).AddSeconds($RampUpSeconds)
            
            while ((Get-Date) -lt $endTime) {
                $endpoint = $Endpoints | Get-Random
                $url = "http://localhost:$Port$endpoint"
                
                # Ramp up phase - gradually increase load
                if ((Get-Date) -lt $rampUpEndTime) {
                    $rampUpDelay = [Math]::Max(100, (1000 - (($RampUpSeconds * 1000) / $ConcurrentUsers)))
                    Start-Sleep -Milliseconds $rampUpDelay
                }
                
                # Add random delay between requests
                Start-Sleep -Milliseconds (Get-Random -Minimum 10 -Maximum 100)
                
                try {
                    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                    $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
                    $stopwatch.Stop()
                    
                    $results.TotalRequests++
                    if ($response.StatusCode -eq 200) {
                        $results.SuccessfulRequests++
                    }
                    else {
                        $results.FailedRequests++
                    }
                    $results.ResponseTimes += $stopwatch.ElapsedMilliseconds
                }
                catch {
                    $results.TotalRequests++
                    $results.FailedRequests++
                    $results.Errors += $_.Exception.Message
                }
            }
            
            return $results
        } -ArgumentList $ServiceName, $Port, $Endpoints, $DurationSeconds, $RampUpSeconds, $testUsers, $testPosts
        
        $jobs += $job
    }
    
    # Wait for all jobs to complete
    $jobResults = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    # Aggregate results
    foreach ($jobResult in $jobResults) {
        $results.TotalRequests += $jobResult.TotalRequests
        $results.SuccessfulRequests += $jobResult.SuccessfulRequests
        $results.FailedRequests += $jobResult.FailedRequests
        $results.ResponseTimes += $jobResult.ResponseTimes
        $results.Errors += $jobResult.Errors
    }
    
    $results.EndTime = Get-Date
    $results.Duration = ($results.EndTime - $results.StartTime).TotalSeconds
    
    return $results
}

function Generate-Report {
    param([array]$Results, [string]$OutputPath)
    
    if (!(Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = Join-Path $OutputPath "csharp-benchmark-report-$timestamp.html"
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>C# .NET Microservices Performance Benchmark Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .service { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
        .metric { background-color: #f9f9f9; padding: 10px; border-radius: 3px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 14px; color: #7f8c8d; }
        .success { color: #27ae60; }
        .error { color: #e74c3c; }
        .warning { color: #f39c12; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>C# .NET Microservices Performance Benchmark Report</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Test Duration: $DurationSeconds seconds | Concurrent Users: $ConcurrentUsers</p>
    </div>
"@

    foreach ($result in $Results) {
        $avgResponseTime = if ($result.ResponseTimes.Count -gt 0) { 
            [Math]::Round(($result.ResponseTimes | Measure-Object -Average).Average, 2) 
        }
        else { 0 }
        
        $minResponseTime = if ($result.ResponseTimes.Count -gt 0) { 
            ($result.ResponseTimes | Measure-Object -Minimum).Minimum 
        }
        else { 0 }
        
        $maxResponseTime = if ($result.ResponseTimes.Count -gt 0) { 
            ($result.ResponseTimes | Measure-Object -Maximum).Maximum 
        }
        else { 0 }
        
        $requestsPerSecond = if ($result.Duration -gt 0) { 
            [Math]::Round($result.TotalRequests / $result.Duration, 2) 
        }
        else { 0 }
        
        $successRate = if ($result.TotalRequests -gt 0) { 
            [Math]::Round(($result.SuccessfulRequests / $result.TotalRequests) * 100, 2) 
        }
        else { 0 }
        
        $html += @"
    <div class="service">
        <h2>$($result.ServiceName) (Port $($result.Port))</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">$($result.TotalRequests)</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">$($result.SuccessfulRequests)</div>
                <div class="metric-label">Successful Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value error">$($result.FailedRequests)</div>
                <div class="metric-label">Failed Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value">$requestsPerSecond</div>
                <div class="metric-label">Requests/Second</div>
            </div>
            <div class="metric">
                <div class="metric-value">$successRate%</div>
                <div class="metric-label">Success Rate</div>
            </div>
            <div class="metric">
                <div class="metric-value">$avgResponseTime ms</div>
                <div class="metric-label">Avg Response Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">$minResponseTime ms</div>
                <div class="metric-label">Min Response Time</div>
            </div>
            <div class="metric">
                <div class="metric-value">$maxResponseTime ms</div>
                <div class="metric-label">Max Response Time</div>
            </div>
        </div>
    </div>
"@
    }
    
    $html += @"
    <h2>Summary</h2>
    <table>
        <tr>
            <th>Service</th>
            <th>Port</th>
            <th>Total Requests</th>
            <th>Success Rate</th>
            <th>Avg Response Time (ms)</th>
            <th>Requests/Second</th>
        </tr>
"@
    
    foreach ($result in $Results) {
        $avgResponseTime = if ($result.ResponseTimes.Count -gt 0) { 
            [Math]::Round(($result.ResponseTimes | Measure-Object -Average).Average, 2) 
        }
        else { 0 }
        
        $requestsPerSecond = if ($result.Duration -gt 0) { 
            [Math]::Round($result.TotalRequests / $result.Duration, 2) 
        }
        else { 0 }
        
        $successRate = if ($result.TotalRequests -gt 0) { 
            [Math]::Round(($result.SuccessfulRequests / $result.TotalRequests) * 100, 2) 
        }
        else { 0 }
        
        $html += @"
        <tr>
            <td>$($result.ServiceName)</td>
            <td>$($result.Port)</td>
            <td>$($result.TotalRequests)</td>
            <td>$successRate%</td>
            <td>$avgResponseTime</td>
            <td>$requestsPerSecond</td>
        </tr>
"@
    }
    
    $html += @"
    </table>
</body>
</html>
"@
    
    $html | Out-File -FilePath $reportFile -Encoding UTF8
    Write-ColorOutput "Benchmark report generated: $reportFile" $Green
    
    return $reportFile
}

# Main execution
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "C# .NET Microservices Performance Benchmark" $Blue
Write-ColorOutput "================================================" $Blue
Write-ColorOutput ""

# Check if services are running
Write-ColorOutput "Checking service health..." $Yellow
$healthyServices = @()
foreach ($service in $services) {
    if (Test-ServiceHealth -ServiceName $service.Name -Port $service.Port) {
        Write-ColorOutput "✓ $($service.Name) is healthy" $Green
        $healthyServices += $service
    }
    else {
        Write-ColorOutput "✗ $($service.Name) is not responding" $Red
    }
}

if ($healthyServices.Count -eq 0) {
    Write-ColorOutput "No healthy services found. Please start the services first." $Red
    exit 1
}

# Run load tests
Write-ColorOutput ""
Write-ColorOutput "Starting load tests..." $Yellow
$allResults = @()

foreach ($service in $healthyServices) {
    $result = Run-LoadTest -ServiceName $service.Name -Port $service.Port -Endpoints $service.Endpoints -ConcurrentUsers $ConcurrentUsers -DurationSeconds $DurationSeconds
    $allResults += $result
}

# Generate report
Write-ColorOutput ""
Write-ColorOutput "Generating benchmark report..." $Yellow
$reportFile = Generate-Report -Results $allResults -OutputPath $OutputPath

# Display summary
Write-ColorOutput ""
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Benchmark Summary" $Blue
Write-ColorOutput "================================================" $Blue

foreach ($result in $allResults) {
    $avgResponseTime = if ($result.ResponseTimes.Count -gt 0) { 
        [Math]::Round(($result.ResponseTimes | Measure-Object -Average).Average, 2) 
    }
    else { 0 }
    
    $requestsPerSecond = if ($result.Duration -gt 0) { 
        [Math]::Round($result.TotalRequests / $result.Duration, 2) 
    }
    else { 0 }
    
    $successRate = if ($result.TotalRequests -gt 0) { 
        [Math]::Round(($result.SuccessfulRequests / $result.TotalRequests) * 100, 2) 
    }
    else { 0 }
    
    Write-ColorOutput "$($result.ServiceName):" $Yellow
    Write-ColorOutput "  Total Requests: $($result.TotalRequests)" $White
    Write-ColorOutput "  Success Rate: $successRate%" $White
    Write-ColorOutput "  Avg Response Time: $avgResponseTime ms" $White
    Write-ColorOutput "  Requests/Second: $requestsPerSecond" $White
    Write-ColorOutput ""
}

Write-ColorOutput "Detailed report: $reportFile" $Green
Write-ColorOutput "Benchmark completed successfully!" $Green
