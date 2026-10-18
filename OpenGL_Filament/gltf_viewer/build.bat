@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: 项目根目录（bat 所在目录）
set "ROOT=%~dp0"
set "BUILD_DIR=%ROOT%build"
set "EXE_REL=build\Release\modelviewer.exe"
set "CONFIG=Release"
set "GENERATOR=Visual Studio 17 2022"

:BUILD_LOOP
cd /d "%ROOT%"
cls
echo ========================================
echo   ModelViewer 一键编译运行
echo ========================================
echo.

:: 首次或无工程时配置 CMake
if not exist "%BUILD_DIR%\modelviewer.vcxproj" (
    echo [DEBUG] 未检测到工程，准备执行 CMake 配置...
    if not exist "%BUILD_DIR%" mkdir "%BUILD_DIR%"
    cmake -G "%GENERATOR%" -A x64 -S "%ROOT%" -B "%BUILD_DIR%"
    if errorlevel 1 (
        echo.
        echo [ERROR] CMake 配置失败！
        goto RETRY_PROMPT
    )
) else (
    echo [DEBUG] 已检测到工程，跳过配置
)

:: 编译
echo [DEBUG] 正在编译 (%CONFIG%)...
cmake --build "%BUILD_DIR%" --config %CONFIG%
if errorlevel 1 (
    echo.
    echo [ERROR] 编译失败！
    goto RETRY_PROMPT
)

:: 运行（从项目根目录启动，保证 assets/ 相对路径可用；
::        CMake 也会把 assets/ 拷到 exe 旁边，两条路都通）
if exist "%ROOT%%EXE_REL%" (
    cd /d "%ROOT%"
    "%ROOT%%EXE_REL%"
    echo.
    echo [DEBUG] 程序运行结束，返回码: !errorlevel!
) else (
    echo.
    echo [ERROR] 未找到可执行文件: %EXE_REL%
)

:RETRY_PROMPT
echo.
echo [按 Enter] 重新编译运行  ^|  [按 r] 重置 CMake  ^|  [按 n] 退出
echo.
set "KEY="
for /f "delims=" %%K in ('powershell -NoProfile -Command "$key = $host.UI.RawUI.ReadKey('NoEcho,IncludeKeyDown'); $key.Character"') do (
    set "KEY=%%K"
)
if /i "!KEY!"=="n" exit /b 0
if /i "!KEY!"=="r" (
    echo [DEBUG] 正在清理 build 目录...
    cd /d "%ROOT%"
    rd /s /q build 2>nul
)
goto BUILD_LOOP
