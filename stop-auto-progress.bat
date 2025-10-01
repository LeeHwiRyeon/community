@echo off 
echo Stopping Auto-Progress Service... 
taskkill /f /im "auto-progress-service.bat" 2>nul 
schtasks /end /tn "Community Auto-Progress" 2>nul 
echo [SUCCESS] Auto-Progress Service stopped 
pause 
