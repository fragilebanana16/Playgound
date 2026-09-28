@echo off
echo [DEBUG] Script started...

cd /d "%~dp0"
echo [DEBUG] Current working directory: %CD%

if not exist "build" mkdir build
cd build
if errorlevel 1 (
    echo [ERROR] Failed to enter build directory.
    pause
    exit /b 1
)
echo [DEBUG] Entered build directory, ready to run CMake...

cmake -G "Visual Studio 16 2019" -A x64 ..
set CMAKE_RET=%ERRORLEVEL%
echo [DEBUG] CMake finished, return code: %CMAKE_RET%
if not "%CMAKE_RET%"=="0" (
    echo [ERROR] CMake configuration failed. See the messages above.
    pause
    exit /b %CMAKE_RET%
)

echo [DEBUG] Ready to build with MSBuild...
cmake --build . --config Debug
set BUILD_RET=%ERRORLEVEL%
echo [DEBUG] Build finished, return code: %BUILD_RET%
if not "%BUILD_RET%"=="0" (
    echo [ERROR] Build failed. See the messages above.
    pause
    exit /b %BUILD_RET%
)

echo [DEBUG] Running program...
cd ..\bin\Debug
main_d.exe
set RUN_RET=%ERRORLEVEL%
echo [DEBUG] Program exited, return code: %RUN_RET%
pause
exit /b %RUN_RET%