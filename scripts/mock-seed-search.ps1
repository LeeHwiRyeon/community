#!/usr/bin/env pwsh
param(
    [string]$Seed = 'search-seed'
)

$payload = @{
    count = 5
    board = 'news'
    seed = $Seed
    titlePrefix = @('SearchTest')
    daysBack = 7
    viewsMin = 10
    viewsMax = 50
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri 'http://localhost:50000/api/mock/generate' -Body $payload -ContentType 'application/json'
