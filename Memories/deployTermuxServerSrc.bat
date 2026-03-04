@echo off
chcp 65001 >nul
setlocal

set "REMOTE_IP=192.168.0.108"
set "REMOTE_PORT=8022"
set "REMOTE_USER=u0_a465"
set "REMOTE_DIR=~/storage/memo/server"

set "SRC=H:\jsProjects\RESUME\Playground\Memories\Server"
set "DEST=H:\jsProjects\RESUME\Playground\Memories\TermuxServerSrc"

echo [1/5] 清空本地 TermuxServerSrc...
rd /s /q "%DEST%" 2>nul
mkdir "%DEST%"

echo [2/5] 写入排除列表...
echo node_modules\ > "%SRC%\exclude.txt"
echo termuxSrc\ >> "%SRC%\exclude.txt"
echo dist\ >> "%SRC%\exclude.txt"
echo .env >> "%SRC%\exclude.txt"
echo .env for termux >> "%SRC%\exclude.txt"

echo [3/5] 复制文件...
xcopy "%SRC%\*" "%DEST%\" /s /e /y /exclude:%SRC%\exclude.txt
copy "%SRC%\.env for termux" "%DEST%\.env"
del "%SRC%\exclude.txt"

echo [4/5] 清空 Termux 远端目录...
ssh -p %REMOTE_PORT% %REMOTE_USER%@%REMOTE_IP% "rm -rf %REMOTE_DIR%/*"
if %errorlevel% neq 0 (
    echo 远端清空失败，终止执行
    pause
    exit /b 1
)

echo [5/5] SCP 上传到 Termux...
scp -P %REMOTE_PORT% -r "%DEST%" %REMOTE_USER%@%REMOTE_IP%:%REMOTE_DIR%/
if %errorlevel% neq 0 (
    echo SCP 上传失败
    pause
    exit /b 1
)

echo 完成！请 SSH 到 Termux 执行 npm install 并启动服务。
pause