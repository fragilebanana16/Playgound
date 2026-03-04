@echo off
set SRC=H:\jsProjects\RESUME\Playground\Memories\Server
set DEST=%SRC%\termuxSrc

echo 清理旧文件...
rd /s /q "%DEST%" 2>nul
mkdir "%DEST%"

echo 写入排除列表...
echo node_modules\ > "%SRC%\exclude.txt"
echo termuxSrc\ >> "%SRC%\exclude.txt"
echo dist\ >> "%SRC%\exclude.txt"
echo .env >> "%SRC%\exclude.txt"

echo 拷贝文件...
xcopy "%SRC%\*" "%DEST%\" /s /e /y /exclude:%SRC%\exclude.txt

echo 拷贝 termux 专用 .env...
copy "%SRC%\.env for termux" "%DEST%\.env"

del "%SRC%\exclude.txt"

echo 开始 SCP 传输...
scp -P 8022 -r "%DEST%" u0_a465@192.168.0.108:~/storage/memo/server

echo 完成！
pause