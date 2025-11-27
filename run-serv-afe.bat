@echo off
title Cloudflare Tunnel Launcher

:: 1. สั่งเปิดหน้าต่างใหม่เพื่อรัน Next.js
echo [1/2] Starting Next.js Server...
start "NextJS Server" cmd /k "npm run dev"

:: 2. รอ 5 วินาที ให้ Next.js รันเสร็จก่อน (ปรับเวลาได้)
echo Waiting for Next.js to be ready...
timeout /t 5 >nul

:: 3. สั่งรัน Tunnel ในหน้าต่างนี้
echo [2/2] Starting Cloudflare Tunnel...
echo URL: https://afetest.newjtech.online
cloudflared tunnel run --url http://localhost:3050 test-dev

pause