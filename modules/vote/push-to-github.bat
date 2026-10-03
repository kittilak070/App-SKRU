@echo off
chcp 65001 > nul
title Push branch 033 to GitHub
set "PATH=%PATH%;C:\Program Files\Git\cmd"

echo ========================================================
echo    Push to GitHub: Branch [033] (Independent Orphan)
echo    Repo: https://github.com/kittilak070/App-SKRU.git
echo ========================================================
echo.

set REPO_URL=https://github.com/kittilak070/App-SKRU.git

git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

echo กำลังเชื่อมต่อและ Push branch [033] ไปยัง GitHub...
echo.
git push -u origin 033

echo.
echo ========================================================
echo เสร็จสิ้นเรียบร้อย!
echo ========================================================
pause
