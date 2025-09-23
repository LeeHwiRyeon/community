# Community Server Quick Start Script
# Purpose: Simple server startup and window management
# Usage: .\quick-start.ps1 [options]

param(
    [ValidateSet("dev", "backend", "frontend", "minimal", "background")]
    [string]$Mode = "dev",
    [switch]$ReadOnly,
    [switch]$Help
)

if ($Help) {
    Write-Host "Community Server Quick Start" -ForegroundColor Cyan
    Write-Host "==============================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Usage: .\quick-start.ps1 -Mode <mode> [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Modes:" -ForegroundColor Green
    Write-Host "  dev        - Full-stack development environment (default)"
    Write-Host "  backend    - Backend only"
    Write-Host "  frontend   - Frontend only"
    Write-Host "  minimal    - Run with minimal windows"
    Write-Host "  background - Run as background jobs"
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Green
    Write-Host "  -ReadOnly  - Read-only mode"
    Write-Host "  -Help      - Show this help"
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\quick-start.ps1                    # Full-stack development environment"
    Write-Host "  .\quick-start.ps1 -Mode backend      # Backend only"
    Write-Host "  .\quick-start.ps1 -Mode minimal      # Minimal windows"
    Write-Host "  .\quick-start.ps1 -Mode background   # Background jobs"
    Write-Host ""
    Write-Host "Additional tools:" -ForegroundColor Green
    Write-Host "  .\scripts\test-oauth.ps1             # Test OAuth configuration"
    Write-Host "  .\scripts\server-stop.ps1            # Stop running servers"
    Write-Host ""
    return
}

# Script directory
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Community Server Quick Start" -ForegroundColor Cyan
Write-Host "===============================" -ForegroundColor Cyan
Write-Host "Mode: $Mode" -ForegroundColor Yellow
if ($ReadOnly) { Write-Host "Read-Only Mode Enabled" -ForegroundColor Yellow }
Write-Host "===============================" -ForegroundColor Cyan

switch ($Mode) {
    "dev" {
        Write-Host "[INFO] Starting full-stack development environment..." -ForegroundColor Green
        if ($ReadOnly) {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -NoBrowser:$false -ReadOnly
        } else {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -NoBrowser:$false
        }
    }
    
    "backend" {
        Write-Host "[INFO] Starting backend server only..." -ForegroundColor Green
        if ($ReadOnly) {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendOnly -BackendPort 50000 -NoBrowser:$false -ReadOnly
        } else {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendOnly -BackendPort 50000 -NoBrowser:$false
        }
    }
    
    "frontend" {
        Write-Host "[INFO] Starting frontend server only..." -ForegroundColor Green
        & (Join-Path $ScriptDir "dev-start.ps1") -FrontendOnly -FrontendPort 5500
    }
    
    "minimal" {
        Write-Host "[INFO] Starting with minimal windows..." -ForegroundColor Green
        if ($ReadOnly) {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -WindowStyle Minimized -NoBrowser -ReadOnly
        } else {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -WindowStyle Minimized -NoBrowser
        }
    }
    
    "background" {
        Write-Host "[INFO] Starting as background jobs..." -ForegroundColor Green
        if ($ReadOnly) {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -NoNewWindows -NoBrowser -ReadOnly
        } else {
            & (Join-Path $ScriptDir "dev-start.ps1") -BackendPort 50000 -FrontendPort 5500 -NoNewWindows -NoBrowser
        }
    }
    
    default {
        Write-Host "[ERROR] Unknown mode: $Mode" -ForegroundColor Red
        Write-Host "Available modes: dev, backend, frontend, minimal, background" -ForegroundColor Yellow
        Write-Host "Help: .\quick-start.ps1 -Help" -ForegroundColor Yellow
    }
}