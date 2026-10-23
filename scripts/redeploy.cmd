@echo off
REM ==============================================================================
REM Quick CMD launcher for KubeDeploy local CI redeployment script
REM ==============================================================================
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0redeploy.ps1" %*
