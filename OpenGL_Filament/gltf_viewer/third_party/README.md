# third_party —— 本工程自带的依赖

这个目录让工程**自包含**：编译 `modelviewer` 不需要源码树、不需要原始发行包、
不需要任何绝对路径。把整个 `cc\` 拷到另一台机器就能直接编。

```
third_party\                                        合计 191.8 MB
├── filament-v1.77.3-windows\      官方预编译包（裁剪版）      188.0 MB
│   ├── include\                    官方公共头                 1.8 MB
│   ├── bin\matc.exe                材质编译器（.mat → .filamat）7.5 MB
│   ├── bin\cmgen.exe               环境贴图生成器              0.9 MB
│   └── lib\x86_64\mt\              25 个 .lib                177.7 MB
├── filament-extra-include\         release 包没带的头          0.9 MB
│   ├── cgltf\                      <cgltf.h>   解析 .glb 拿包围盒/节点名
│   ├── filabridge\                 <private/filament/*>
│   └── utils\                      <private/utils/*>
└── imgui\                          ImGui 1.92.5 核心 + Win32 后端  3.0 MB
                                    （阶段 3 的控制面板用，**当源码编**）
```

## 来源

| 目标 | 来源 |
|---|---|
| `filament-v1.77.3-windows\{include,bin,lib}` | `G:\filament-main\MyHelloTriangle\third_party\filament-v1.77.3-windows`<br>（官方 `filament-v1.77.3-windows.tgz` 解压而来） |
| `filament-extra-include\cgltf` | `G:\filament-main\filament-main\third_party\cgltf` |
| `filament-extra-include\filabridge` | `G:\filament-main\filament-main\libs\filabridge\include` |
| `filament-extra-include\utils` | `G:\filament-main\filament-main\libs\utils\include` |
| `imgui\` | `G:\filament-main\filament-main\third_party\imgui`<br>（只拷 4 个核心 `.cpp` + 头 + `imgui_impl_win32`） |

版本：Filament **1.77.3**，ImGui **1.92.5**

> ImGui 是**源码**，不进任何 `.lib`：`CMakeLists.txt` 直接编
> `third_party\imgui\*.cpp`。同理，Filament 那边的 ImGui 桥 `filagui` 也没有现成的
> `.lib` 可用（见下），它的 5 个文件（`src\` 2 个 `.cpp` + `include\filagui\` 3 个头）
> 拷在工程的 `src\filagui\` 里 —— 那部分属于源码目录，不在 `third_party\`。

## 怎么重建

```powershell
powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1
```

升级 Filament 版本：

```powershell
powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1 `
    -FilamentDist D:\deps\filament-v1.78.0-windows
```

升级时脚本里有两处要跟着改：

1. `$DistDst`（目标目录名里带了版本号）
2. `CMakeLists.txt` 的 `FILAMENT_DIST` 默认值（同样带版本号）

## 故意没拷的东西

原始发行包 **4,836 MB**，这里 **188.9 MB**（预编译包部分）。省掉的 4,647 MB 都是确定用不上的：

| 没拷 | 体积 | 原因 |
|---|---|---|
| `lib\x86_64\mtd` | 1,911 MB | Debug 用的 `/MTd` 静态库。本工程只支持 Release / RelWithDebInfo |
| `lib\x86_64\mdd` | 1,859 MB | DLL 运行时的 Debug 版，同上 |
| `lib\x86_64\md` | 474 MB | DLL 运行时。本工程静态链接 `/MT`，永远不用 |
| **`filamat.lib`** | **197 MB** | 材质**编译器**库（`matc.exe` 用的）。运行时解析材质走 `filaflat`，用不到它 |
| `matdbg.lib` | 62 MB | 材质调试服务（MATDBG），没开 |
| `perfetto.lib` | 32 MB | 性能追踪后端，没开 |
| `assimp.lib` | 30 MB | 额外的模型格式支持，gltfio 用不到 |
| 另外 12 个 | ~20 MB | `filamentapp`(6) `matp`(4) `viewer`(4) `ibl-lite`(2) `civetweb`(1) `filamentapp-resources`(1) `gltfio`(0.5) `filament-iblprefilter` `filameshio` `imagediff` `filament-generatePrefilterMipmap` `shaders` |

> 注意 `gltfio`(0.5 MB) 和 `gltfio_core`(11.8 MB) **是两个库**。
> 前者是个便利封装（Meta 目标），后者才是真正干活的 glTF 解析器。
> 本工程链的是 `gltfio_core`，所以上面这个 `gltfio` 确实用不上。
| `bin\` 里另外 13 个工具 | 51 MB | 只用 matc 和 cmgen。`gltf_viewer.exe`(20.7 MB) 是对照用的官方查看器，需要时单独拷 |
| `docs\` | 0 MB | 空目录 |
| `cgltf` 的 `.github` `fuzz` `test` `tnt` | — | 上游仓库的构建/测试外壳，对我们没用 |

**没链上的 16 个库合计 340.9 MB** —— 其中 `filamat` 一个就占 197 MB，是 mt 目录里最大的单一文件。

> **阶段 3 要控制面板，为什么没把 GUI 那些库拷回来？** 因为 `filagui.lib` / `imgui.lib`
> 在 release 包**里根本不存在**，`include\` 里也没有 `filagui\` / `filamentapp\` 头。
> 所以走的是"拷源码"：ImGui 核心进 `third_party\imgui\`，Filament 的 ImGui 桥
> （`ImGuiHelper` 等）进工程的 `src\filagui\`。真正的 GUI 框架 `filamentapp`
> （6 MB）一个字节都没拷 —— 这正是本目录能停在 191.8 MB 的原因之一。

### SDL2 为什么不在里面

**因为一行都没用到。** 窗口是裸 Win32 写的（`RegisterClassExW` / `CreateWindowExW` /
`PeekMessage` / `DefWindowProcW`），`src\main.cpp` 里没有任何 SDL 符号，
`CMakeLists.txt` 的 `target_link_libraries` 里也没有。

证据 —— `modelviewer.exe` 的导入表（`dumpbin /dependents`）只有 7 个系统 DLL：

```
OPENGL32.dll   GDI32.dll   USER32.dll   SHELL32.dll   SHLWAPI.dll   KERNEL32.dll   IMM32.dll
```

没有 `SDL2.dll`。顺带说明三件事：导入表里**没有** `MSVCP140.dll` / `VCRUNTIME140.dll`
→ `/MT` 静态 CRT 生效，单 exe 零 DLL 成立；**没有** `vulkan-1.dll` → 静态链的
`bluevk` 不会拖一个 Vulkan 运行时依赖（二进制里能搜到这个**字符串**，那是它运行时
`LoadLibrary` 用的名字）；多出来的 `SHELL32.dll` / `IMM32.dll` 分别是拖放
（`DragAcceptFiles` / `DragQueryFileW`）和 ImGui 的输入法支持（`imgui.cpp` 里那段
Win32 IME）带进来的，同样都是 Windows 自带。

（`SHLWAPI.dll` 是接上 gltfio 之后多出来的：`ResourceLoader` 用 `utils::Path`
解析资源路径，底下调到 shlwapi 的 `PathIsRelativeA`。它同样是 Windows 自带系统库。）

所以之前拷进来的 `sdl2-2.32.2\`（4.1 MB / 94 个文件）是死重，已经删掉。

**真要上 SDL2 时的两个前提**（现在这个包不满足）：

1. 它是**动态版**（只有 `SDL2.lib` + `SDL2.dll`，没有 `SDL2-static.lib`）。
   一链接就得带 `SDL2.dll` 分发，破坏单 exe。要上得**从 SDL 源码编一份静态的**。
2. 它**解决不了关窗慢**。慢的是 Filament 自己的 teardown —— 官方在 Windows 上
   也只是拿 SDL 建个窗口要一个 `HWND`（`NativeWindowHelperWindows.cpp`），
   整个 `SDLDisplayManager.cpp` 里没有一处 `SDL_GL_CreateContext`。
   详见工程根目录 `README.md` 第 7 节。

它的实际价值是阶段 2 的**拖拽加载**（`SDL_DROPFILE`）和 hi-DPI。
到那时再决定是编静态 SDL2，还是干脆用 Win32 的 `WM_DROPFILES`
（`DragAcceptFiles` + 一个消息分支，可能比引一整个 SDL 更省）。

要临时拷回来验证，脚本留了开关（**默认不拷**）：

```powershell
powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1 -WithSdl2
```

### 那 25 个库是怎么定的

不是猜的：就是 `CMakeLists.txt` 里的 `FL_CORE` + `FL_GLTF` + `FL_EXTRA`，
清单同时写在 `tools\vendor-deps.ps1` 的 `$Libs` 里。**两处必须保持一致。**

以后要加功能（比如用 `filameshio` 读 `.filamesh`、用 `viewer` 做远程 UI），
把库名加到 `$Libs` 和 `CMakeLists.txt` 两处，重跑脚本即可。

## 为什么用"拷贝"而不是"引用外部路径"

依赖是**只读的第三方产物** —— 按版本放、从不修改。把它拷进项目换来两个好处：

1. **工程可以从零重建**：拿到 `cc\` 就能编，不用先解压一个 4.8 GB 的包、
   再去找一个 3.26 GB 的源码树补头文件。
2. **"我们到底依赖了什么"变成看得见的事实**：25 个库名就写在脚本里，
   而不再是"从 4.8 GB 里碰运气看哪个能链上"。

代价是：**必须有人记得它是哪来的。这份 README 就是为这个存在的。**

## 注意

- **改完 `third_party` 之后必须删掉 `build\` 重新 configure。**
  CMake 把路径缓存在 `CMakeCache.txt` 和 `.vcxproj` 里，不重配会报一堆路径错。
- **`tools\vendor-deps.ps1` 里不要写中文注释。**
  Windows PowerShell 5.1 会把无 BOM 的 UTF-8 当 ANSI 读，中文会被打碎，
  极端情况下还会吃掉换行、让脚本语法出错（本项目已经被这个坑弄坏过一次源文件）。
  中文文档写在这里，脚本保持纯 ASCII。
