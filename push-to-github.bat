@echo off
chcp 65001 > nul
title Push branch 030 to GitHub
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Users\%USERNAME%\AppData\Local\Programs\Git\cmd"

echo ========================================================
echo    Push to GitHub: Branch [030]
echo    Repo: https://github.com/kittilak070/App-SKRU.git
echo ========================================================
echo.

set REPO_URL=https://github.com/kittilak070/App-SKRU.git

git config user.name "kittilak070"
git config user.email "kittilak070@users.noreply.github.com"

git checkout -B 030
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

git add .
git commit -m "feat: SKRU teacher appointment request system (branch 030)" >nul 2>nul

echo กำลังเชื่อมต่อและ Push branch [030] ไปยัง GitHub...
echo.
git push -u origin 030

echo.
echo ========================================================
echo เสร็จสิ้นเรียบร้อย!
echo ========================================================
pause
