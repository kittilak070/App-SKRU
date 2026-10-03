@echo off
title SKRU Appointment Request System
chcp 65001 > nul
cls
echo ===================================================
echo   ระบบส่งคำขอเข้าพบอาจารย์ - SKRU Appointment
echo ===================================================
echo.
echo กำลังเริ่มต้นเซิร์ฟเวอร์ที่ http://localhost:3000 ...
echo หน้านักศึกษา: http://localhost:3000
echo หน้าอาจารย์:  http://localhost:3000/admin.html
echo.
echo (หากเปิดหน้าต่างนี้ทิ้งไว้ เซิร์ฟเวอร์จะทำงานตลอดเวลา)
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"

pause
