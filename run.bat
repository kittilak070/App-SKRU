@echo off
title SKRU Satisfaction Rating Server
chcp 65001 > nul
echo ======================================================
echo    SKRU Satisfaction Rating System - Web Server
echo ======================================================
echo.
echo กำลังเปิดระบบที่ http://localhost:3000 ...
echo กด Ctrl + C เพื่อหยุดการทำงาน
echo.

where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [Node.js] ตรวจพบ Node.js ในเครื่อง - กำลังรันผ่าน server.js
    node server.js
) else (
    echo [PowerShell] กำลังรันเว็บเซิร์ฟเวอร์สำรองผ่าน PowerShell
    powershell.exe -ExecutionPolicy Bypass -File "%~dp0server.ps1"
)
pause
