# =====================================================
# Node.js Server Performance Benchmark
# =====================================================
# This script benchmarks the performance of the existing Node.js server

param(
    [int]$ConcurrentUsers = 100,
    [int]$DurationSeconds = 60,
    [int]$RampUpSeconds = 10,
    [string]$BaseUrl = "http://localhost:50000",
    [string]$OutputPath = ".\benchmark-results",
    [switch]$DetailedMetrics = $false
)

# Configuration
$ErrorActionPreference = "Stop"
$endpoints = @(
    @{ Path = "/api/users"; Method = "GET" },
    @{ Path = "/api/posts"; Method = "GET" },
    @{ Path = "/api/posts/1"; Method = "GET" },
    @{ Path = "/api/search"; Method = "GET" },
    @{ Path = "/api/trending"; Method = "GET" },
    @{ Path = "/api/chat/rooms"; Method = "GET" },
    @{ Path = "/api/notifications"; Method = "GET" },
    @{ Path = "/metrics"; Method = "GET" }
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

function Test-ServerHealth {
    param([string]$BaseUrl)
    
    try {
        $url = "$BaseUrl/health"
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
        return $response.StatusCode -eq 200
    }
    catch {
        # Try alternative health check endpoints
        try {
            $url = "$BaseUrl/metrics"
            $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 10 -UseBasicParsing
            return $response.StatusCode -eq 200
        }
        catch {
            return $false
        }
    }
}

function Start-NodeJSServer {
    try {
        Write-ColorOutput "Starting Node.js server..." $Yellow
        
        # Check if server is already running
        $process = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server-backend*" }
        if ($process) {
            Write-ColorOutput "Node.js server is already running" $Green
            return $true
        }
        
        # Navigate to server-backend directory
        $serverPath = "..\..\server-backend"
        if (!(Test-Path $serverPath)) {
            Write-ColorOutput "Server backend directory not found: $serverPath" $Red
            return $false
        }
        
        # Start the server
        $startInfo = New-Object System.Diagnostics.ProcessStartInfo
        $startInfo.FileName = "node"
        $startInfo.Arguments = "src/server.js"
        $startInfo.WorkingDirectory = (Resolve-Path $serverPath).Path
        $startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
        $startInfo.CreateNoWindow = $true
        $startInfo.UseShellExecute = $false
        $startInfo.RedirectStandardOutput = $true
        $startInfo.RedirectStandardError = $true
        
        $process = [System.Diagnostics.Process]::Start($startInfo)
        
        # Wait for server to start
        Start-Sleep -Seconds 5
        
        # Test if server is responding
        $maxRetries = 10
        $retryCount = 0
        while ($retryCount -lt $maxRetries) {
            if (Test-ServerHealth -BaseUrl $BaseUrl) {
                Write-ColorOutput "Node.js server started successfully" $Green
                return $true
            }
            Start-Sleep -Seconds 2
            $retryCount++
        }
        
        Write-ColorOutput "Node.js server failed to start or respond" $Red
        return $false
    }
    catch {
        Write-ColorOutput "Failed to start Node.js server: $($_.Exception.Message)" $Red
        return $false
    }
}

function Stop-NodeJSServer {
    try {
        $processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*server-backend*" }
        foreach ($process in $processes) {
            $process.Kill()
            $process.WaitForExit(5000)
        }
        Write-ColorOutput "Stopped Node.js server" $Green
    }
    catch {
        Write-ColorOutput "Error stopping Node.js server: $($_.Exception.Message)" $Red
    }
}

function Measure-ResponseTime {
    param([string]$Url, [string]$Method = "GET", [hashtable]$Body = $null, [hashtable]$Headers = $null)
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $params = @{
            Uri = $Url
            Method = $Method
            TimeoutSec = 30
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
            StatusCode = $response.StatusCode
            ResponseTime = $stopwatch.ElapsedMilliseconds
            ContentLength = $response.Content.Length
            Success = $true
        }
    }
    catch {
        $stopwatch.Stop()
        return @{
            StatusCode = 0
            ResponseTime = $stopwatch.ElapsedMilliseconds
            ContentLength = 0
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

function Run-LoadTest {
    param([string]$BaseUrl, [array]$Endpoints, [int]$ConcurrentUsers, [int]$DurationSeconds)
    
    Write-ColorOutput "Running load test for Node.js server..." $Yellow
    
    $results = @{
        ServerName = "Node.js Server"
        BaseUrl = $BaseUrl
        TotalRequests = 0
        SuccessfulRequests = 0
        FailedRequests = 0
        ResponseTimes = @()
        Errors = @()
        StartTime = Get-Date
        EndpointResults = @{}
    }
    
    $endTime = (Get-Date).AddSeconds($DurationSeconds)
    $rampUpEndTime = (Get-Date).AddSeconds($RampUpSeconds)
    
    # Initialize endpoint results
    foreach ($endpoint in $Endpoints) {
        $results.EndpointResults[$endpoint.Path] = @{
            TotalRequests = 0
            SuccessfulRequests = 0
            FailedRequests = 0
            ResponseTimes = @()
            Errors = @()
        }
    }
    
    # Create concurrent users
    $jobs = @()
    for ($i = 1; $i -le $ConcurrentUsers; $i++) {
        $job = Start-Job -ScriptBlock {
            param($BaseUrl, $Endpoints, $DurationSeconds, $RampUpSeconds, $TestUsers, $TestPosts)
            
            $results = @{
                TotalRequests = 0
                SuccessfulRequests = 0
                FailedRequests = 0
                ResponseTimes = @()
                Errors = @()
                EndpointResults = @{}
            }
            
            # Initialize endpoint results
            foreach ($endpoint in $Endpoints) {
                $results.EndpointResults[$endpoint.Path] = @{
                    TotalRequests = 0
                    SuccessfulRequests = 0
                    FailedRequests = 0
                    ResponseTimes = @()
                    Errors = @()
                }
            }
            
            $endTime = (Get-Date).AddSeconds($DurationSeconds)
            $rampUpEndTime = (Get-Date).AddSeconds($RampUpSeconds)
            
            while ((Get-Date) -lt $endTime) {
                $endpoint = $Endpoints | Get-Random
                $url = "$BaseUrl$($endpoint.Path)"
                
                # Ramp up phase - gradually increase load
                if ((Get-Date) -lt $rampUpEndTime) {
                    $rampUpDelay = [Math]::Max(100, (1000 - (($RampUpSeconds * 1000) / $ConcurrentUsers)))
                    Start-Sleep -Milliseconds $rampUpDelay
                }
                
                # Add random delay between requests
                Start-Sleep -Milliseconds (Get-Random -Minimum 10 -Maximum 100)
                
                try {
                    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                    $response = Invoke-WebRequest -Uri $url -Method $endpoint.Method -TimeoutSec 10 -UseBasicParsing
                    $stopwatch.Stop()
                    
                    $results.TotalRequests++
                    $results.EndpointResults[$endpoint.Path].TotalRequests++
                    
                    if ($response.StatusCode -eq 200) {
                        $results.SuccessfulRequests++
                        $results.EndpointResults[$endpoint.Path].SuccessfulRequests++
                    } else {
                        $results.FailedRequests++
                        $results.EndpointResults[$endpoint.Path].FailedRequests++
                    }
                    
                    $results.ResponseTimes += $stopwatch.ElapsedMilliseconds
                    $results.EndpointResults[$endpoint.Path].ResponseTimes += $stopwatch.ElapsedMilliseconds
                }
                catch {
                    $results.TotalRequests++
                    $results.FailedRequests++
                    $results.Errors += $_.Exception.Message
                    
                    $results.EndpointResults[$endpoint.Path].TotalRequests++
                    $results.EndpointResults[$endpoint.Path].FailedRequests++
                    $results.EndpointResults[$endpoint.Path].Errors += $_.Exception.Message
                }
            }
            
            return $results
        } -ArgumentList $BaseUrl, $Endpoints, $DurationSeconds, $RampUpSeconds, $testUsers, $testPosts
        
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
        
        # Aggregate endpoint results
        foreach ($endpointPath in $jobResult.EndpointResults.Keys) {
            if (!$results.EndpointResults.ContainsKey($endpointPath)) {
                $results.EndpointResults[$endpointPath] = @{
                    TotalRequests = 0
                    SuccessfulRequests = 0
                    FailedRequests = 0
                    ResponseTimes = @()
                    Errors = @()
                }
            }
            
            $results.EndpointResults[$endpointPath].TotalRequests += $jobResult.EndpointResults[$endpointPath].TotalRequests
            $results.EndpointResults[$endpointPath].SuccessfulRequests += $jobResult.EndpointResults[$endpointPath].SuccessfulRequests
            $results.EndpointResults[$endpointPath].FailedRequests += $jobResult.EndpointResults[$endpointPath].FailedRequests
            $results.EndpointResults[$endpointPath].ResponseTimes += $jobResult.EndpointResults[$endpointPath].ResponseTimes
            $results.EndpointResults[$endpointPath].Errors += $jobResult.EndpointResults[$endpointPath].Errors
        }
    }
    
    $results.EndTime = Get-Date
    $results.Duration = ($results.EndTime - $results.StartTime).TotalSeconds
    
    return $results
}

function Generate-Report {
    param([hashtable]$Results, [string]$OutputPath)
    
    if (!(Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = Join-Path $OutputPath "nodejs-benchmark-report-$timestamp.html"
    
    $avgResponseTime = if ($Results.ResponseTimes.Count -gt 0) { 
        [Math]::Round(($Results.ResponseTimes | Measure-Object -Average).Average, 2) 
    } else { 0 }
    
    $minResponseTime = if ($Results.ResponseTimes.Count -gt 0) { 
        ($Results.ResponseTimes | Measure-Object -Minimum).Minimum 
    } else { 0 }
    
    $maxResponseTime = if ($Results.ResponseTimes.Count -gt 0) { 
        ($Results.ResponseTimes | Measure-Object -Maximum).Maximum 
    } else { 0 }
    
    $requestsPerSecond = if ($Results.Duration -gt 0) { 
        [Math]::Round($Results.TotalRequests / $Results.Duration, 2) 
    } else { 0 }
    
    $successRate = if ($Results.TotalRequests -gt 0) { 
        [Math]::Round(($Results.SuccessfulRequests / $Results.TotalRequests) * 100, 2) 
    } else { 0 }
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Node.js Server Performance Benchmark Report</title>
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
        <h1>Node.js Server Performance Benchmark Report</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Test Duration: $DurationSeconds seconds | Concurrent Users: $ConcurrentUsers</p>
        <p>Base URL: $($Results.BaseUrl)</p>
    </div>
    
    <div class="service">
        <h2>Overall Performance</h2>
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">$($Results.TotalRequests)</div>
                <div class="metric-label">Total Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value success">$($Results.SuccessfulRequests)</div>
                <div class="metric-label">Successful Requests</div>
            </div>
            <div class="metric">
                <div class="metric-value error">$($Results.FailedRequests)</div>
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
    
    <h2>Endpoint Performance</h2>
    <table>
        <tr>
            <th>Endpoint</th>
            <th>Total Requests</th>
            <th>Success Rate</th>
            <th>Avg Response Time (ms)</th>
            <th>Min Response Time (ms)</th>
            <th>Max Response Time (ms)</th>
        </tr>
"@
    
    foreach ($endpointPath in $Results.EndpointResults.Keys) {
        $endpointResult = $Results.EndpointResults[$endpointPath]
        
        $endpointAvgResponseTime = if ($endpointResult.ResponseTimes.Count -gt 0) { 
            [Math]::Round(($endpointResult.ResponseTimes | Measure-Object -Average).Average, 2) 
        } else { 0 }
        
        $endpointMinResponseTime = if ($endpointResult.ResponseTimes.Count -gt 0) { 
            ($endpointResult.ResponseTimes | Measure-Object -Minimum).Minimum 
        } else { 0 }
        
        $endpointMaxResponseTime = if ($endpointResult.ResponseTimes.Count -gt 0) { 
            ($endpointResult.ResponseTimes | Measure-Object -Maximum).Maximum 
        } else { 0 }
        
        $endpointSuccessRate = if ($endpointResult.TotalRequests -gt 0) { 
            [Math]::Round(($endpointResult.SuccessfulRequests / $endpointResult.TotalRequests) * 100, 2) 
        } else { 0 }
        
        $html += @"
        <tr>
            <td>$endpointPath</td>
            <td>$($endpointResult.TotalRequests)</td>
            <td>$endpointSuccessRate%</td>
            <td>$endpointAvgResponseTime</td>
            <td>$endpointMinResponseTime</td>
            <td>$endpointMaxResponseTime</td>
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
Write-ColorOutput "Node.js Server Performance Benchmark" $Blue
Write-ColorOutput "================================================" $Blue
Write-ColorOutput ""

# Check if server is running
Write-ColorOutput "Checking server health..." $Yellow
if (Test-ServerHealth -BaseUrl $BaseUrl) {
    Write-ColorOutput "✓ Node.js server is healthy" $Green
} else {
    Write-ColorOutput "Node.js server is not responding. Attempting to start..." $Yellow
    if (!(Start-NodeJSServer)) {
        Write-ColorOutput "Failed to start Node.js server. Please start it manually." $Red
        exit 1
    }
}

# Run load test
Write-ColorOutput ""
Write-ColorOutput "Starting load test..." $Yellow
$results = Run-LoadTest -BaseUrl $BaseUrl -Endpoints $endpoints -ConcurrentUsers $ConcurrentUsers -DurationSeconds $DurationSeconds

# Generate report
Write-ColorOutput ""
Write-ColorOutput "Generating benchmark report..." $Yellow
$reportFile = Generate-Report -Results $results -OutputPath $OutputPath

# Display summary
Write-ColorOutput ""
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Benchmark Summary" $Blue
Write-ColorOutput "================================================" $Blue

$avgResponseTime = if ($results.ResponseTimes.Count -gt 0) { 
    [Math]::Round(($results.ResponseTimes | Measure-Object -Average).Average, 2) 
} else { 0 }

$requestsPerSecond = if ($results.Duration -gt 0) { 
    [Math]::Round($results.TotalRequests / $results.Duration, 2) 
} else { 0 }

$successRate = if ($results.TotalRequests -gt 0) { 
    [Math]::Round(($results.SuccessfulRequests / $results.TotalRequests) * 100, 2) 
} else { 0 }

Write-ColorOutput "Node.js Server:" $Yellow
Write-ColorOutput "  Total Requests: $($results.TotalRequests)" $White
Write-ColorOutput "  Success Rate: $successRate%" $White
Write-ColorOutput "  Avg Response Time: $avgResponseTime ms" $White
Write-ColorOutput "  Requests/Second: $requestsPerSecond" $White
Write-ColorOutput ""

Write-ColorOutput "Detailed report: $reportFile" $Green
Write-ColorOutput "Benchmark completed successfully!" $Green
