@echo off
chcp 65001 >nul
setlocal

set "BASE_DIR=%~dp0"
set "CLIENT_DIR=%BASE_DIR%Client"
set "DIST_DIR=%CLIENT_DIR%\dist"
set "TARGET_DIR=%BASE_DIR%TermuxClientDist"
set "REMOTE_IP=192.168.0.108"
set "REMOTE_PORT=8022"
set "REMOTE_USER=u0_a465"
set "REMOTE_DIR=~/storage/memo/client"

echo [1/5] 构建 Client...
set /p "SKIP_BUILD=是否跳过构建？(y/N): "
if /i "%SKIP_BUILD%"=="y" (
    echo 跳过构建
) else (
    cd /d "%CLIENT_DIR%"
    npm run build
    if %errorlevel% neq 0 (
        echo 构建失败，终止执行
        pause
        exit /b 1
    )
)

echo [2/5] 清空并重建 TermuxClientDist...
if exist "%TARGET_DIR%" rd /s /q "%TARGET_DIR%"
mkdir "%TARGET_DIR%"

echo [3/5] 平铺 dist 内容到 TermuxClientDist...
xcopy /e /i /y "%DIST_DIR%\*" "%TARGET_DIR%\"

echo [4/5] 重命名 .env.production 为 .env...
if exist "%TARGET_DIR%\.env.production" (
    ren "%TARGET_DIR%\.env.production" ".env"
) else (
    echo 未找到 .env.production，跳过
)

echo [5/5] 清空 Termux 远端目录...
ssh -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_IP% "rm -rf %REMOTE_DIR%/*"

echo [6/6] SCP 上传到 Termux...
scp -P %REMOTE_PORT% -r "%TARGET_DIR%\*" %REMOTE_USER%@%REMOTE_IP%:%REMOTE_DIR%/

if %errorlevel% neq 0 (
    echo SCP 上传失败
    pause
    exit /b 1
)

echo 全部完成！
pause