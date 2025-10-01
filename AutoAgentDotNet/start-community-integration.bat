@echo off
echo Starting AutoAgent with Community Platform Integration...
cd /d "C:\Users\hwi\Desktop\Projects\community\AutoAgentDotNet\AutoAgent.Worker"

echo.
echo Setting environment to Community integration...
set ASPNETCORE_ENVIRONMENT=Community

echo.
echo Starting AutoAgent...
dotnet run --environment Community

pause
