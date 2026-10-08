@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:BUILD_LOOP
cd /d "%~dp0"
cls

if not exist "build\main.vcxproj" (
    echo [DEBUG] 未检测到工程结构，准备执行首次配置...
    if not exist "build" mkdir build
    cd /d "%~dp0build"

    cmake -G "Visual Studio 16 2019" -A x64 ..
    if errorlevel 1 (
        echo.
        echo [ERROR] CMake 配置失败！
        goto RETRY_PROMPT
    )
) else (
    cd /d "%~dp0build"
)

echo [DEBUG] 正在编译代码...
cmake --build . --config Debug
if errorlevel 1 (
    echo.
    echo [ERROR] 代码编译失败！
    goto RETRY_PROMPT
)

echo [DEBUG] 启动程序...
if exist "%~dp0bin\Debug\main_d.exe" (
    cd /d "%~dp0bin\Debug"
    :: 在独立窗口中运行 exe，并等待其结束；关闭该窗口不会影响本脚本
    start "main_d" /wait main_d.exe
    echo.
    echo [DEBUG] 程序运行结束，返回码: !errorlevel!
) else (
    echo.
    echo [ERROR] 未找到可执行文件: bin\Debug\main_d.exe
)

:RETRY_PROMPT
echo.
echo [按 Enter 键] 重新编译运行 ^| [按 r 键] 重置 CMake ^| [按 n 键] 退出
echo.

:: 每次读键前先清空，避免 Enter（读不到字符）时沿用上一次的值
set "KEY="
for /f "delims=" %%K in ('powershell -NoProfile -Command "$key = $host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown'); $key.Character"') do (
    set "KEY=%%K"
)

if /i "!KEY!"=="n" exit /b 0
if /i "!KEY!"=="r" (
    cd /d "%~dp0"
    echo [DEBUG] 正在清理 build 目录以彻底重新生成...
    rd /s /q build 2>nul
)

goto BUILD_LOOP