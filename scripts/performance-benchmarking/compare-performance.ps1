# =====================================================
# Performance Comparison: C# .NET vs Node.js
# =====================================================
# This script compares the performance of C# .NET microservices vs Node.js server

param(
    [int]$ConcurrentUsers = 100,
    [int]$DurationSeconds = 60,
    [int]$RampUpSeconds = 10,
    [string]$OutputPath = ".\benchmark-results",
    [switch]$RunBothTests = $false,
    [string]$CSharpResultsPath = "",
    [string]$NodeJSResultsPath = ""
)

# Configuration
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $Color
}

function Parse-BenchmarkResults {
    param([string]$ResultsPath)
    
    try {
        if (!(Test-Path $ResultsPath)) {
            Write-ColorOutput "Results file not found: $ResultsPath" $Red
            return $null
        }
        
        $content = Get-Content $ResultsPath -Raw
        
        # Extract metrics using regex patterns
        $totalRequests = if ($content -match 'Total Requests.*?(\d+)') { [int]$matches[1] } else { 0 }
        $successfulRequests = if ($content -match 'Successful Requests.*?(\d+)') { [int]$matches[1] } else { 0 }
        $failedRequests = if ($content -match 'Failed Requests.*?(\d+)') { [int]$matches[1] } else { 0 }
        $avgResponseTime = if ($content -match 'Avg Response Time.*?(\d+\.?\d*)\s*ms') { [double]$matches[1] } else { 0 }
        $requestsPerSecond = if ($content -match 'Requests/Second.*?(\d+\.?\d*)') { [double]$matches[1] } else { 0 }
        $successRate = if ($content -match 'Success Rate.*?(\d+\.?\d*)%') { [double]$matches[1] } else { 0 }
        
        return @{
            TotalRequests = $totalRequests
            SuccessfulRequests = $successfulRequests
            FailedRequests = $failedRequests
            AvgResponseTime = $avgResponseTime
            RequestsPerSecond = $requestsPerSecond
            SuccessRate = $successRate
        }
    }
    catch {
        Write-ColorOutput "Error parsing results: $($_.Exception.Message)" $Red
        return $null
    }
}

function Generate-ComparisonReport {
    param([hashtable]$CSharpResults, [hashtable]$NodeJSResults, [string]$OutputPath)
    
    if (!(Test-Path $OutputPath)) {
        New-Item -ItemType Directory -Path $OutputPath -Force | Out-Null
    }
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $reportFile = Join-Path $OutputPath "performance-comparison-report-$timestamp.html"
    
    # Calculate performance improvements
    $responseTimeImprovement = if ($NodeJSResults.AvgResponseTime -gt 0) {
        [Math]::Round((($NodeJSResults.AvgResponseTime - $CSharpResults.AvgResponseTime) / $NodeJSResults.AvgResponseTime) * 100, 2)
    } else { 0 }
    
    $throughputImprovement = if ($NodeJSResults.RequestsPerSecond -gt 0) {
        [Math]::Round((($CSharpResults.RequestsPerSecond - $NodeJSResults.RequestsPerSecond) / $NodeJSResults.RequestsPerSecond) * 100, 2)
    } else { 0 }
    
    $successRateImprovement = if ($NodeJSResults.SuccessRate -gt 0) {
        [Math]::Round((($CSharpResults.SuccessRate - $NodeJSResults.SuccessRate) / $NodeJSResults.SuccessRate) * 100, 2)
    } else { 0 }
    
    $html = @"
<!DOCTYPE html>
<html>
<head>
    <title>Performance Comparison: C# .NET vs Node.js</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .comparison { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin: 20px 0; }
        .service { padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .csharp { background-color: #e8f4fd; }
        .nodejs { background-color: #f0f8e8; }
        .improvement { background-color: #fff3cd; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; }
        .metric { background-color: #f9f9f9; padding: 10px; border-radius: 3px; text-align: center; }
        .metric-value { font-size: 20px; font-weight: bold; color: #2c3e50; }
        .metric-label { font-size: 12px; color: #7f8c8d; }
        .improvement-value { font-size: 18px; font-weight: bold; }
        .positive { color: #27ae60; }
        .negative { color: #e74c3c; }
        .neutral { color: #7f8c8d; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f2f2f2; }
        .winner { background-color: #d4edda; font-weight: bold; }
        .loser { background-color: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Performance Comparison: C# .NET vs Node.js</h1>
        <p>Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")</p>
        <p>Test Duration: $DurationSeconds seconds | Concurrent Users: $ConcurrentUsers</p>
    </div>
    
    <div class="comparison">
        <div class="service csharp">
            <h2>C# .NET Microservices</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.TotalRequests)</div>
                    <div class="metric-label">Total Requests</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.SuccessfulRequests)</div>
                    <div class="metric-label">Successful</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.FailedRequests)</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.RequestsPerSecond)</div>
                    <div class="metric-label">Req/Sec</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.SuccessRate)%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($CSharpResults.AvgResponseTime) ms</div>
                    <div class="metric-label">Avg Response</div>
                </div>
            </div>
        </div>
        
        <div class="service nodejs">
            <h2>Node.js Server</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.TotalRequests)</div>
                    <div class="metric-label">Total Requests</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.SuccessfulRequests)</div>
                    <div class="metric-label">Successful</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.FailedRequests)</div>
                    <div class="metric-label">Failed</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.RequestsPerSecond)</div>
                    <div class="metric-label">Req/Sec</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.SuccessRate)%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
                <div class="metric">
                    <div class="metric-value">$($NodeJSResults.AvgResponseTime) ms</div>
                    <div class="metric-label">Avg Response</div>
                </div>
            </div>
        </div>
        
        <div class="service improvement">
            <h2>Performance Improvement</h2>
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value improvement-value $(if ($responseTimeImprovement -gt 0) { 'positive' } elseif ($responseTimeImprovement -lt 0) { 'negative' } else { 'neutral' })">$responseTimeImprovement%</div>
                    <div class="metric-label">Response Time</div>
                </div>
                <div class="metric">
                    <div class="metric-value improvement-value $(if ($throughputImprovement -gt 0) { 'positive' } elseif ($throughputImprovement -lt 0) { 'negative' } else { 'neutral' })">$throughputImprovement%</div>
                    <div class="metric-label">Throughput</div>
                </div>
                <div class="metric">
                    <div class="metric-value improvement-value $(if ($successRateImprovement -gt 0) { 'positive' } elseif ($successRateImprovement -lt 0) { 'negative' } else { 'neutral' })">$successRateImprovement%</div>
                    <div class="metric-label">Success Rate</div>
                </div>
            </div>
        </div>
    </div>
    
    <h2>Detailed Comparison</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>C# .NET</th>
            <th>Node.js</th>
            <th>Winner</th>
            <th>Improvement</th>
        </tr>
        <tr>
            <td>Total Requests</td>
            <td>$($CSharpResults.TotalRequests)</td>
            <td>$($NodeJSResults.TotalRequests)</td>
            <td class="$(if ($CSharpResults.TotalRequests -gt $NodeJSResults.TotalRequests) { 'winner' } else { 'loser' })">$(if ($CSharpResults.TotalRequests -gt $NodeJSResults.TotalRequests) { 'C# .NET' } else { 'Node.js' })</td>
            <td>$([Math]::Round((($CSharpResults.TotalRequests - $NodeJSResults.TotalRequests) / $NodeJSResults.TotalRequests) * 100, 2))%</td>
        </tr>
        <tr>
            <td>Requests/Second</td>
            <td>$($CSharpResults.RequestsPerSecond)</td>
            <td>$($NodeJSResults.RequestsPerSecond)</td>
            <td class="$(if ($CSharpResults.RequestsPerSecond -gt $NodeJSResults.RequestsPerSecond) { 'winner' } else { 'loser' })">$(if ($CSharpResults.RequestsPerSecond -gt $NodeJSResults.RequestsPerSecond) { 'C# .NET' } else { 'Node.js' })</td>
            <td>$throughputImprovement%</td>
        </tr>
        <tr>
            <td>Avg Response Time (ms)</td>
            <td>$($CSharpResults.AvgResponseTime)</td>
            <td>$($NodeJSResults.AvgResponseTime)</td>
            <td class="$(if ($CSharpResults.AvgResponseTime -lt $NodeJSResults.AvgResponseTime) { 'winner' } else { 'loser' })">$(if ($CSharpResults.AvgResponseTime -lt $NodeJSResults.AvgResponseTime) { 'C# .NET' } else { 'Node.js' })</td>
            <td>$responseTimeImprovement%</td>
        </tr>
        <tr>
            <td>Success Rate (%)</td>
            <td>$($CSharpResults.SuccessRate)</td>
            <td>$($NodeJSResults.SuccessRate)</td>
            <td class="$(if ($CSharpResults.SuccessRate -gt $NodeJSResults.SuccessRate) { 'winner' } else { 'loser' })">$(if ($CSharpResults.SuccessRate -gt $NodeJSResults.SuccessRate) { 'C# .NET' } else { 'Node.js' })</td>
            <td>$successRateImprovement%</td>
        </tr>
    </table>
    
    <h2>Recommendations</h2>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
"@
    
    if ($responseTimeImprovement -gt 10) {
        $html += "<p><strong>✓ C# .NET shows significantly better response times</strong> - Consider migrating to C# .NET for better performance.</p>"
    } elseif ($responseTimeImprovement -lt -10) {
        $html += "<p><strong>⚠ Node.js shows better response times</strong> - Consider optimizing C# .NET services or staying with Node.js.</p>"
    } else {
        $html += "<p><strong>≈ Similar response times</strong> - Both technologies perform similarly in terms of response time.</p>"
    }
    
    if ($throughputImprovement -gt 10) {
        $html += "<p><strong>✓ C# .NET shows higher throughput</strong> - Better for high-traffic applications.</p>"
    } elseif ($throughputImprovement -lt -10) {
        $html += "<p><strong>⚠ Node.js shows higher throughput</strong> - Better for high-concurrency scenarios.</p>"
    } else {
        $html += "<p><strong>≈ Similar throughput</strong> - Both technologies handle similar loads.</p>"
    }
    
    if ($successRateImprovement -gt 5) {
        $html += "<p><strong>✓ C# .NET shows better reliability</strong> - Fewer failed requests.</p>"
    } elseif ($successRateImprovement -lt -5) {
        $html += "<p><strong>⚠ Node.js shows better reliability</strong> - More stable under load.</p>"
    } else {
        $html += "<p><strong>≈ Similar reliability</strong> - Both technologies are equally reliable.</p>"
    }
    
    $html += @"
    </div>
    
    <h2>Conclusion</h2>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
"@
    
    $csharpScore = 0
    $nodejsScore = 0
    
    if ($CSharpResults.RequestsPerSecond -gt $NodeJSResults.RequestsPerSecond) { $csharpScore++ } else { $nodejsScore++ }
    if ($CSharpResults.AvgResponseTime -lt $NodeJSResults.AvgResponseTime) { $csharpScore++ } else { $nodejsScore++ }
    if ($CSharpResults.SuccessRate -gt $NodeJSResults.SuccessRate) { $csharpScore++ } else { $nodejsScore++ }
    
    if ($csharpScore -gt $nodejsScore) {
        $html += "<p><strong>C# .NET microservices outperform Node.js</strong> in this benchmark. Consider migrating to the microservices architecture for better performance, scalability, and maintainability.</p>"
    } elseif ($nodejsScore -gt $csharpScore) {
        $html += "<p><strong>Node.js server outperforms C# .NET</strong> in this benchmark. Consider optimizing the C# .NET services or maintaining the current Node.js architecture.</p>"
    } else {
        $html += "<p><strong>Both technologies perform similarly</strong> in this benchmark. The choice between them should be based on other factors like development team expertise, maintainability, and specific requirements.</p>"
    }
    
    $html += @"
    </div>
</body>
</html>
"@
    
    $html | Out-File -FilePath $reportFile -Encoding UTF8
    Write-ColorOutput "Comparison report generated: $reportFile" $Green
    
    return $reportFile
}

# Main execution
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Performance Comparison: C# .NET vs Node.js" $Blue
Write-ColorOutput "================================================" $Blue
Write-ColorOutput ""

# Check if we need to run both tests
if ($RunBothTests) {
    Write-ColorOutput "Running both C# .NET and Node.js benchmarks..." $Yellow
    
    # Run C# .NET benchmark
    Write-ColorOutput "Running C# .NET benchmark..." $Yellow
    $csharpScript = Join-Path $PSScriptRoot "benchmark-csharp-services.ps1"
    if (Test-Path $csharpScript) {
        & $csharpScript -ConcurrentUsers $ConcurrentUsers -DurationSeconds $DurationSeconds -RampUpSeconds $RampUpSeconds -OutputPath $OutputPath
    } else {
        Write-ColorOutput "C# .NET benchmark script not found: $csharpScript" $Red
    }
    
    # Run Node.js benchmark
    Write-ColorOutput "Running Node.js benchmark..." $Yellow
    $nodejsScript = Join-Path $PSScriptRoot "benchmark-nodejs-server.ps1"
    if (Test-Path $nodejsScript) {
        & $nodejsScript -ConcurrentUsers $ConcurrentUsers -DurationSeconds $DurationSeconds -RampUpSeconds $RampUpSeconds -OutputPath $OutputPath
    } else {
        Write-ColorOutput "Node.js benchmark script not found: $nodejsScript" $Red
    }
}

# Parse results
Write-ColorOutput "Parsing benchmark results..." $Yellow

# Find the most recent C# .NET results
$csharpResultsFiles = Get-ChildItem -Path $OutputPath -Filter "csharp-benchmark-report-*.html" | Sort-Object LastWriteTime -Descending
if ($csharpResultsFiles.Count -eq 0 -and $CSharpResultsPath) {
    $csharpResultsFiles = @(Get-Item $CSharpResultsPath)
}

if ($csharpResultsFiles.Count -eq 0) {
    Write-ColorOutput "No C# .NET benchmark results found. Please run the C# .NET benchmark first." $Red
    exit 1
}

$csharpResults = Parse-BenchmarkResults -ResultsPath $csharpResultsFiles[0].FullName
if (!$csharpResults) {
    Write-ColorOutput "Failed to parse C# .NET results" $Red
    exit 1
}

# Find the most recent Node.js results
$nodejsResultsFiles = Get-ChildItem -Path $OutputPath -Filter "nodejs-benchmark-report-*.html" | Sort-Object LastWriteTime -Descending
if ($nodejsResultsFiles.Count -eq 0 -and $NodeJSResultsPath) {
    $nodejsResultsFiles = @(Get-Item $NodeJSResultsPath)
}

if ($nodejsResultsFiles.Count -eq 0) {
    Write-ColorOutput "No Node.js benchmark results found. Please run the Node.js benchmark first." $Red
    exit 1
}

$nodejsResults = Parse-BenchmarkResults -ResultsPath $nodejsResultsFiles[0].FullName
if (!$nodejsResults) {
    Write-ColorOutput "Failed to parse Node.js results" $Red
    exit 1
}

# Generate comparison report
Write-ColorOutput "Generating comparison report..." $Yellow
$reportFile = Generate-ComparisonReport -CSharpResults $csharpResults -NodeJSResults $nodejsResults -OutputPath $OutputPath

# Display summary
Write-ColorOutput ""
Write-ColorOutput "================================================" $Blue
Write-ColorOutput "Performance Comparison Summary" $Blue
Write-ColorOutput "================================================" $Blue

$responseTimeImprovement = if ($nodejsResults.AvgResponseTime -gt 0) {
    [Math]::Round((($nodejsResults.AvgResponseTime - $csharpResults.AvgResponseTime) / $nodejsResults.AvgResponseTime) * 100, 2)
} else { 0 }

$throughputImprovement = if ($nodejsResults.RequestsPerSecond -gt 0) {
    [Math]::Round((($csharpResults.RequestsPerSecond - $nodejsResults.RequestsPerSecond) / $nodejsResults.RequestsPerSecond) * 100, 2)
} else { 0 }

$successRateImprovement = if ($nodejsResults.SuccessRate -gt 0) {
    [Math]::Round((($csharpResults.SuccessRate - $nodejsResults.SuccessRate) / $nodejsResults.SuccessRate) * 100, 2)
} else { 0 }

Write-ColorOutput "C# .NET Microservices:" $Yellow
Write-ColorOutput "  Requests/Second: $($csharpResults.RequestsPerSecond)" $White
Write-ColorOutput "  Avg Response Time: $($csharpResults.AvgResponseTime) ms" $White
Write-ColorOutput "  Success Rate: $($csharpResults.SuccessRate)%" $White
Write-ColorOutput ""

Write-ColorOutput "Node.js Server:" $Yellow
Write-ColorOutput "  Requests/Second: $($nodejsResults.RequestsPerSecond)" $White
Write-ColorOutput "  Avg Response Time: $($nodejsResults.AvgResponseTime) ms" $White
Write-ColorOutput "  Success Rate: $($nodejsResults.SuccessRate)%" $White
Write-ColorOutput ""

Write-ColorOutput "Performance Improvement (C# .NET vs Node.js):" $Yellow
Write-ColorOutput "  Response Time: $responseTimeImprovement%" $White
Write-ColorOutput "  Throughput: $throughputImprovement%" $White
Write-ColorOutput "  Success Rate: $successRateImprovement%" $White
Write-ColorOutput ""

Write-ColorOutput "Detailed comparison report: $reportFile" $Green
Write-ColorOutput "Performance comparison completed successfully!" $Green
