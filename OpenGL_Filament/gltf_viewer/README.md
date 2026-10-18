# ModelViewer

基于 Google [Filament](https://github.com/google/filament) 的最小 GLB 模型查看器。
目标：保留官方 `samples/gltf_viewer` 的核心渲染，砍掉整套 FilamentApp 外壳，
从零写 CMake，靠**拷贝官方源码片段**逐步完善，而不是自己写渲染基础设施。
（阶段 3 之前刻意**不引入 ImGui**；后来说要控制面板，就把 ImGui 的**核心源码**和
Filament 的 `filagui` 桥一起拷进来**当源码编** —— 只借它"算界面"，画像素仍是 Filament。）

**当前状态：能加载 `.glb`、能用鼠标转着看、画质对齐官方、拖拽带阻尼（阶段 1-e）、
运行时换模型（阶段 2）、地面网格（阶段 2-b）、左侧 ImGui 控制面板（阶段 3）** ——
默认用 gltfio 打开 `assets/models/DamagedHelmet.glb`，
相机先按包围盒自动就位，之后交给官方的 `camutils::Manipulator` 轨道相机
（左键旋转 / 右键平移 / 滚轮推拉 / `R` 复位，**手感按 Blender 调过** —— 见
[第 4 节](#画质开关阶段-1-e)）。
渲染走完整的 PBR 管线（IBL 环境光 + 天空盒 + 太阳光 + ACES tone mapping），
并且**按官方 `ViewerGui` 的出厂设置打开了 4x MSAA / SSAO / Bloom / 太阳阴影** —— 之前
画面"飘、不真实"就是因为这四项被关着。地面网格给阴影一个落点，也顺便当尺度参照。
相机另外叠了一层**阻尼（惯性平滑）**：拖动和推拉会稍晚一点跟上鼠标、松手后还会滑一小段
（`--damping K` 可调，`0` = 完全关掉）。阻尼是在**轨道参数**（方位角 / 仰角 / 距离）上做的，
所以是纯正的**转台**：模型钉在画面正中、轨道半径恒定，怎么甩都不会穿模。
可以离屏截图。初期那个 PBR 三角形保留下来当调试靶子。
不改程序就能换模型：**把 `.glb` 拖到窗口上**，或者按 `F5` 重新加载当前文件
（见[第 4 节](#内容重载阶段-2)）。画质 / 光照 / 地面这些参数也不用改代码 ——
左侧面板当场就能调（`F1` 收放，见[第 4 节](#控制面板阶段-3)）。

---

## 1. 跑起来

```bat
build.bat
```

或者用 CMake 预设（推荐，配置都写在 `CMakePresets.json` 里）：

```bat
cmake --preset win-x64
cmake --build --preset release
build\Release\modelviewer.exe
```

或者等价的手工命令：

```bat
cmake -G "Visual Studio 17 2022" -A x64 -S . -B build
cmake --build build --config Release
build\Release\modelviewer.exe
```

> 本工程**只支持 `Release` 和 `RelWithDebInfo`**（`cmake --build --preset reldbg`）。
> Debug 用不了 —— 原因见[第 3 节](#只支持-release--relwithdebinfo)。

### 命令行参数

```
modelviewer.exe [<model.glb> | default|metal|rough] [--shot out.bmp] [--frames N] [--verbose] [--damping K]
                [--show | --hidden] [--size WxH] [--ui | --no-ui]
```

位置参数有两种含义：**给 `default`/`metal`/`rough` 就走 PBR 三角形，其它一律当成 `.glb` 路径**；
不给就加载默认模型 `assets/models/DamagedHelmet.glb`。

| 参数 | 说明 |
|---|---|
| *（不给）* | 加载 `assets/models/DamagedHelmet.glb` |
| `D:\path\to\foo.glb` | 加载指定的 `.glb`（自包含模型，不需要外部 `.bin` / 贴图） |
| `default` | 三角形：roughness 0.30 / metallic 0.0（电介质） |
| `metal` | 三角形：roughness 0.20 / metallic 1.0（纯金属，会镜面反射整个环境） |
| `rough` | 三角形：roughness 0.85 / metallic 0.0（粗糙漫反射） |
| `--shot out.bmp` | 渲染一帧 → 用 `Renderer::readPixels` 回读 → 存 24 位 BMP → 退出 |
| `--frames N` | 跑完 N 帧自动退出（用来测清理耗时 / 压测） |
| `--verbose` | 打印关闭时每一步的耗时 |
| `--damping K` | 轨道相机阻尼速率（1/秒）：越小越沉、松手后惯性滑行越久；默认 15，`0` = 完全关掉（1:1 跟手） |
| `--show` / `--hidden` | 强制显示 / 强制隐藏窗口。**`--shot` 默认隐藏**（见下） |
| `--size WxH` | 窗口 / 帧缓冲尺寸，默认 `1280x720`。隐藏窗口不受屏幕大小限制，所以它也能用来截高分辨率（或者一屏装下整块长面板）的图 |
| `--ui` / `--no-ui` | 强制显示 / 强制隐藏左侧控制面板（阶段 3）。**交互跑默认显示，`--shot` 默认隐藏** |

保留三角形是为了**隔离问题**：模型渲染不对时切过去跑一下，就能立刻分辨
是渲染管线坏了还是模型加载/数据的问题。

`--shot` 不用窗口交互，是把渲染结果拿来做验证/回归测试用的。
它存完图就立刻 `_Exit`，不走清理 —— 原因见 [第 7 节](#7-关窗与清理要不要上-sdl2)。

> **`--shot` 默认不显示窗口。** 截图路径**不是**离屏渲染：Filament 的
> `Engine::createSwapChain(hwnd)` 必须挂在一个**真的原生窗口**上（预编译包里没有
> headless 后端），所以每次截图都会真的建窗口、建 GL 上下文、渲染、读回。
> 一轮回归要跑十几遍，窗口就反复弹出来闪 —— 于是 `--shot` 只用
> `WS_OVERLAPPEDWINDOW`（不带 `WS_VISIBLE`）建窗口。想看着它渲染就加 `--show`。
> 实测**隐藏与否的像素完全一致**（两种跑法 md5 相同），所以基线不受影响。
>
> 同理，`--shot` 默认**不画控制面板**（阶段 3）—— 基线里只有场景，面板怎么改都
> 动不了它。要连面板一起截就加 `--ui`。

它的输出是**完全可复现**的：同一个模型 + 同一个 preset，连跑多少次 md5 都一样
（三角形那条路的旋转是按**帧号**驱动的，就为了这点 —— 之前用墙上时间驱动，
每次截图角度都不同，当不了基线）。所以可以直接拿来当回归测试：

```powershell
.\modelviewer.exe --shot a.bmp
Get-FileHash a.bmp -Algorithm MD5      # 本机 GTX 960 上是 6DCA8E7A...
```

> 四个基线各是各的，**别混**（都在同一台 GTX 960 上测的，含地面网格）：
> 模型 `6DCA8E7A...`、三角形 `default` `4E179041...`、`metal` `4B98E32B...`、
> `rough` `56A6C93D...`。三角形三个材质是三种不同的着色，像素当然不一样。
>
> 基线换过一次：加地面网格（阶段 2-b）之前是模型 `AD89128C...` /
> `ECE937F2...` / `62FF8F08...` / `90E4CA7C...` —— 地面落在画面里，四个像素都变了，
> 旧数字直接作废（**别拿新图去比旧 md5**）。

> 加了轨道相机也不破坏这个性质：ORBIT 模式的 `update()` 是空实现
> （`Manipulator.cpp:326`），相机只在收到输入时才动，所以第 1 帧永远等于 home 姿态。
>
> 之后加的**阻尼**也不破坏它：阻尼只平滑"喂给相机的姿态"，而且已经贴合的那些帧会
> **直接照抄真值**（bit-exact），第 1 帧正好落在这一支上 —— 实测加阻尼前后 `--shot`
> 的 md5 一模一样（那时还是 `AD89128C...`，也就是地面进来之前那个基线）。

### 交互操作

| 操作 | 效果 |
|---|---|
| 左键拖拽 | 绕 `targetPosition`（= 模型包围盒中心）转**转台**，**物体跟着鼠标走**，和 Blender 一致 |
| 右键拖拽 | 平移（同样是物体跟手） |
| 滚轮 | 推拉（往前滚 = 拉近） |
| **拖放 `.glb`** | 把文件从资源管理器拖到窗口上 = **运行时换模型**（阶段 2-a） |
| `F5` | 重新加载当前文件（导出覆盖后重看一眼，不用重启进程） |
| `R` | 视角复位到刚加载完的取景（**地面跟着一起复位**） |
| `F1` | 显示 / 隐藏左侧控制面板（阶段 3） |
| `ESC` | 退出 |

拖拽时会 `SetCapture`，鼠标甩到窗口外面也不会断（实测：拖到客户端坐标 `(1700,1000)`
—— 窗口只有 1280×720 —— 相机照样跟着转）。⚠ 这一句 `SetCapture` 自带一个能把**整个
鼠标交互废掉**的坑，见[第 10 节](#10-已知坑--排查)第一条。

画面里**默认开着地面网格**（阶段 2-b）—— 它存在的理由和做法见
[第 4 节](#地面网格阶段-2-b)：给太阳的 PCF 阴影一个落脚的地方，同时给模型一个尺度参照。
模型/三角形一换，地面的位置和疏密会跟着重新贴合。

左边有一块 **ImGui 控制面板**（阶段 3，`F1` 收放）：信息 / 画质 / 光照 / 地面网格 /
相机 / 调试 六组，都是**即时生效**的。出厂值和上面写的那些设置**逐字相同**，所以
"什么都不动"跑出来的画面跟没有面板时逐位一样 —— 四个 `--shot` 基线在面板接进来
前后**一个都没变**。做法和踩过的坑见 [第 4 节](#控制面板阶段-3)。

拖放和 `F5` 走的是**同一条重载路径**，见 [第 4 节](#内容重载阶段-2)。
只接**自包含**的 `.glb`（贴图 / 顶点数据都嵌在文件里）；外挂 `.bin` / 贴图的
`.gltf` 还读不出来 —— 我们没给 `ResourceLoader` 设 `gltfPath`。
拖进来一个坏文件（或者 `F5` 时磁盘上的文件已经没了）**不会**把画面搞空：
新内容先完整加载成功，才去拆旧的（见那一节）。

> 拖拽和推拉都带**阻尼**（惯性平滑）：镜头会稍微晚一点才跟上鼠标，松手后还会滑一小段。
> 这是官方 `camutils` **没有**、我们额外加的一层，原因和做法见
> [第 4 节](#相机阻尼阶段-1-e)。想要完全 1:1 跟手就用 `--damping 0`。
>
> 阻尼是在**轨道参数**（方位角 / 仰角 / 距离）上做的，所以是纯正的**转台**：转的过程中
> 轨道半径恒定、`eye.y` 不变，模型始终钉在画面正中，怎么甩都不会穿模。
>
> 上面的**左键**里写的"绕 `targetPosition` 转"是出厂设定；加了阻尼之后，真正的原点
> 是"当前轨道中心"，也就是 `OrbitManipulator` 的 `mPivot`。它平时就是模型包围盒中心，
> 但**右键平移会把它整个搬走**，所以阻尼自己维护了一份 `mPivot` 的影子：
> 平移时同步搬、`R` 复位时跟着回去。详见
> [第 4 节](#相机阻尼阶段-1-e)。

> **竖直方向是特意翻过来的。** Filament 出厂那套的效果是"鼠标往上拖 = 相机升高 =
> 俯视看顶面"，和 Blender / three.js `OrbitControls` 正好上下相反。我们只翻了
> `orbitSpeed.y`。原因见 [第 4 节](#鼠标手感为什么翻过来阶段-1-e)。

> md5 和 GPU / 驱动 / 后端绑定，换台机器数字就不一样了 —— 它适合**本机前后对比**
> （改代码前后跑一遍看有没有变），不适合跨机器断言。

> 对比 `default` 和 `metal` 最能说明三角形为什么是 PBR：`metal` 会直接反射出
> lightroom 环境（能看见软光箱和桌椅），这就是 IBL 起作用的直接证据。

---

## 2. 目录结构

```
cc/
├── CMakeLists.txt
├── CMakePresets.json          预设：win-x64 / release / reldbg
├── build.bat                  一键编译运行
├── src/main.cpp               应用逻辑（窗口 / 相机 / 渲染循环 / 内容重载）
├── src/ui.h, src/ui.cpp       控制面板（阶段 3）：UiControls + ImGui 侧边栏
├── src/filagui/               Filament 的 ImGui 桥（ImGuiHelper / ImGuiExtensions / ImGuiMath），从源码树拷来
├── materials/litTriangle.mat  三角形材质源文件，构建时用 matc 编成 .filamat
├── materials/groundGrid.mat   地面网格材质源文件（阶段 2-b），同样走 matc
├── materials/uiBlit.mat       控制面板用的 UI 材质（阶段 3），同样走 matc
├── tools/vendor-deps.ps1      重建 third_party/（从本地下载重拷依赖）
├── tools/check-ui-glyphs.ps1  面板汉字体检 + kPanelGlyphs 生成器（构建时自动跑）
├── third_party/               自带依赖，自包含（来源见其 README.md）
│   ├── filament-v1.77.3-windows/  官方预编译包（只留 include + 25 个 .lib + matc / cmgen）
│   ├── filament-extra-include/    官方包没带的补充头（cgltf / filabridge / utils）
│   └── imgui/                     ImGui 1.92.5 核心 + imgui_impl_win32（当源码编，不链接 .lib）
└── assets/
    ├── ibl/lightroom_14b/     ← 环境光，决定"像不像 PBR"
    │   ├── lightroom_14b_ibl.ktx     反射 / 辐照度
    │   ├── lightroom_14b_skybox.ktx  天空盒
    │   └── sh.txt                    球谐系数（本版本没用上，用 ktx 内嵌的）
    └── models/DamagedHelmet.glb   ← 默认加载的模型
```

构建产物布局（`assets/` 和 `materials/*.filamat` 会被自动拷到 exe 旁边）：

```
build/Release/
├── modelviewer.exe
├── assets/ibl/lightroom_14b/*.ktx
└── materials/litTriangle.filamat
    materials/groundGrid.filamat
    materials/uiBlit.filamat
```

`main.cpp` 里的 `ensureAssetRoot()` 会优先用当前工作目录，找不到材质就切到 exe 所在目录，
所以从工程根目录、exe 目录、或任意位置启动都能跑。

---

## 3. 依赖（自包含）

**工程里没有任何指向工程外部的路径。** `cc\` 整个拷到别的机器就能直接编 ——
不需要 Filament 源码树、不需要原始的 4.8 GB 发行包。

```
FILAMENT_DIST = <本工程>/third_party/filament-v1.77.3-windows     ← 自带
```

`third_party\` 合计 **191.8 MB**，是官方预编译包（4,836 MB）裁掉用不上的部分后的结果，
再加上阶段 3 拷进来的 ImGui。**裁了什么、为什么、怎么重建**全部写在
[`third_party/README.md`](third_party/README.md)，这里只记结论：

| 目录 | 内容 | 体积 |
|---|---|---|
| `filament-v1.77.3-windows\` | 官方预编译包：`include\` + 25 个 `.lib` + `matc.exe` / `cmgen.exe` | 188.0 MB |
| `filament-extra-include\` | release 包**没带**的补充头：`cgltf` / `filabridge` / `utils` | 0.9 MB |
| `imgui\` | ImGui 1.92.5 核心源码（4 个 `.cpp` + 头）+ `imgui_impl_win32` | 3.0 MB |

丢了、或者要换 Filament 版本，跑一次就能重建：

```powershell
powershell -ExecutionPolicy Bypass -File tools\vendor-deps.ps1
```

> **重要**：官方包里**没有** `filagui.lib`、`imgui.lib`、`sdl2.lib`，`include/` 里
> 也**没有** `filamentapp/`、`filagui/` 头文件。所以它只能支撑
> 「filament 核心 + gltfio」这条路（本项目的路线 A）。
> 想要官方那套 FilamentApp2 + ViewerGui 面板，只能用源码树里自己编的那套（路线 B/C）。
>
> 阶段 3 要面板，于是走了**第三条**：**不链接**这些库，而是把
> `third_party/imgui/`（ImGui 1.92.5）和 `src/filagui/`（`ImGuiHelper` 等，从源码树
> `libs/filagui/` 拷来）**当源码编进 exe**。ImGui 本来就是「头 + cpp」，`filagui`
> 也只是一层薄桥 —— 预编译包里既然没有，反倒省了二进制 ABI 对不上的麻烦。

### 只支持 Release / RelWithDebInfo

`lib` 本来有四套运行时（`mt`/`mtd`/`md`/`mdd`），本项目**只保留了 `mt`**：

| 目录 | 运行时 | 本项目 |
|---|---|---|
| `mt`  | `/MT`  Release | ✅ 唯一保留 |
| `mtd` | `/MTd` Debug | ❌ 不用 Debug，省了 **1,911 MB** |
| `md` / `mdd` | `/MD` / `/MDd` 动态 | ❌ 静态链接，省了 **2,333 MB** |

代价是 Debug 构建做不了。用 `CMAKE_CONFIGURATION_TYPES "Release;RelWithDebInfo"` 把 Debug
整个移出配置列表就不容易踩坑了；`MSVC_RUNTIME_LIBRARY` 固定 `MultiThreaded`，
原来的 `$<CONFIG:Debug>` 分支也一并删了。

`RelWithDebInfo` 同样是 `/MT`、`_ITERATOR_DEBUG_LEVEL=0`，**可以安全链接**，
需要断点自己的代码时用它。第三方没有 PDB，进不去 Filament 内部 ——
链接期那上百条 `LNK4099`（"未找到 filament.pdb"）已用 `/ignore:4099` 屏蔽。

### 链接的库（`CMakeLists.txt` 里分三组）

| 组 | 库 | 作用 |
|---|---|---|
| `FL_CORE` | `filament backend bluegl bluevk filabridge filaflat smol-v utils geometry ibl image zstd abseil` | 引擎核心 + IBL 加载 |
| `FL_GLTF` | `gltfio_core uberarchive uberzlib ktxreader stb imageio-lite meshoptimizer mikktspace basis_transcoder dracodec` | glTF 解析 / 贴图解码（阶段 1-c 用上了） |
| `FL_EXTRA` | `camutils getopt` | 轨道相机（阶段 1-d 用上了）、参数解析 |

MSVC 只拉取真正被引用到的 `.lib` 成员，所以这里**可以一次列全**，不会让 exe 白白变大；
以后想砍功能，从这个清单里删对应项即可。当前 exe 约 **7.2 MB**（接上 gltfio + 贴图
解码器从 4.5 MB 涨到 6.8 MB，阶段 3 的 ImGui 又加了约 0.4 MB）。

另外有 **7 个 `.cpp` 是当源码编进来的**（不是库）：`third_party/imgui/` 的 4 个 ImGui
核心文件 + `imgui_impl_win32.cpp`（输入后端），以及 `src/filagui/ImGuiHelper.cpp` +
`ImGuiExtensions.cpp`（ImGui → Filament 的桥）—— 预编译包里根本没有对应的 `.lib`，
也不需要（ImGui 本来就是"头 + cpp"）。

另外还链了 5 个系统库：`opengl32`（后端）、`gdi32` `user32`、`shell32`，
以及 `shlwapi` —— 最后一个是被 gltfio 间接拉进来的：`ResourceLoader` 用
`utils::Path` 解析资源路径，而 `utils::Path::isAbsolute()` 调的是 shlwapi 的
`PathIsRelativeA`。只画三角形时那个 `.obj` 不会被拉进链接，接上 gltfio 就冒出
`LNK2019: __imp_PathIsRelativeA`。

成品 exe 的导入表用 `dumpbin /dependents` 验过，**只剩系统 DLL**（7 个）：

```
OPENGL32.dll   GDI32.dll   USER32.dll   SHELL32.dll   SHLWAPI.dll   KERNEL32.dll   IMM32.dll
```

没有 `vulkan-1.dll`（后端选了 OpenGL）、没有 `MSVCP140.dll` / `VCRUNTIME140.dll`
（`/MT` 静态 CRT）、也没有 `SDL2.dll`。就是想要的那个"**单个 exe、零附带 DLL**"。

> 二进制里能搜到 `vulkan-1.dll` 这个**字符串**，但**不在导入表里** ——
> 那是 `bluevk` 运行时按需动态加载时用的名字（`LoadLibrary`），静态链它不会拖一个
> Vulkan 运行时依赖出来。
>
> `SHELL32.dll` 是阶段 2-a 的拖放带进来的（`DragAcceptFiles` / `DragQueryFileW`），
> `IMM32.dll` 是阶段 3 的 ImGui 输入法支持带进来的（`imgui.cpp` 里那段 Win32 IME：
> `ImmGetContext` / `ImmSetCompositionWindow`）。两个都是 Windows 自带，不影响
> "零附带 DLL"。

> 这个清单和 `tools\vendor-deps.ps1` 里的 `$Libs` **必须一致** —— 脚本按它决定
> 往 `third_party` 里拷哪些 `.lib`。`CMakeLists.txt` 里也加了体检：缺库直接在
> configure 阶段报人话，而不是等连接器报一串 `LNK1104`。

### 材质编译

照抄官方 `samples/CMakeLists.txt:68-80` 的做法，构建时调
`${FILAMENT_DIST}/bin/matc.exe`：

```cmake
matc.exe -a opengl -a vulkan -o materials/litTriangle.filamat materials/litTriangle.mat
```

`-a opengl -a vulkan` 表示两种后端都预编译进去，以后切 `Backend::VULKAN` 不用重编材质。

现在一共**三个** `.mat`，都走同一条路（往 `CMakeLists.txt` 的 `MATERIAL_SRCS` 里加一行就行）：

| 源文件 | 用途 | 阶段 |
|---|---|---|
| `materials/litTriangle.mat` | 三角形调试靶子 | 0 |
| `materials/groundGrid.mat` | 地面网格 | 2-b |
| `materials/uiBlit.mat` | 控制面板的 UI 材质（半透明 + 无光照） | 3 |

> `uiBlit.mat` 是照官方 `libs/filagui/src/materials/uiBlit.mat` 抄的简化版。官方那份旁边
> 还有个 `uiBlitExternal.mat`（给 Android 的 `samplerExternal` 用），桌面后端**编不过**，
> 所以一个字节都没拷。

---

## 4. glTF 模型加载（阶段 1-c）

默认就是加载 `.glb` 了，三角形退回成调试靶子：

```bat
modelviewer.exe                          :: 加载 assets/models/DamagedHelmet.glb
modelviewer.exe G:\3dmodels\xxx.glb      :: 加载任意自包含 .glb
modelviewer.exe default                  :: 回退到 PBR 三角形
```

流程就是官方 `gltf_viewer.cpp` 的核心三步，砍掉 FilamentApp 的外壳：

```cpp
// 1. 材质提供者 + AssetLoader
MaterialProvider* materials = createUbershaderProvider(
        engine, UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
AssetConfiguration config = {};
config.engine    = engine;
config.materials = materials;
AssetLoader* loader = AssetLoader::create(config);
FilamentAsset* asset = loader->createAsset(bytes.data(), bytes.size());

// 2. ResourceLoader（注册贴图解码器 + 上传几何/贴图）
ResourceConfiguration resConfig = {};
resConfig.engine = engine;
resConfig.normalizeSkinningWeights = true;
ResourceLoader* resLoader = new ResourceLoader(resConfig);
resLoader->addTextureProvider("image/png",  stbDecoder);   // 同一个 stbDecoder
resLoader->addTextureProvider("image/jpeg", stbDecoder);   // 注册两次
resLoader->addTextureProvider("image/ktx2", ktxDecoder);
resLoader->loadResources(asset);

// 3. 进场景
scene->addEntities(asset->getEntities(), asset->getEntityCount());
```

几个和官方不同、或者说踩出来的点：

### `loadResources()` 在 1.77 是**同步**的

官方 Viewer 用 `asyncBeginLoad` + 每帧 `asyncUpdateLoad`，是为了加载期间还能显示进度条。
我们只加载一个模型，直接用同步版就够了：不用轮询、也不存在"还没加载完就渲染"的中间态。
代价是加载时窗口不刷新（DamagedHelmet 约 200 ms，肉眼看不出来）。

### `recomputeBoundingBoxes()` 必须排在 `releaseSourceData()` **前面**

顺序反了 Filament 会直接抛 Precondition 并终止进程：

```
Precondition in recomputeBoundingBoxes:102
reason: Do not call releaseSourceData before recomputeBoundingBoxes
```

原因很直白：`recomputeBoundingBoxes()` 要真去读 cgltf 里的顶点数据来算 AABB，
而 `releaseSourceData()` 干的正是把那份源码数据释放掉。官方
`gltf_viewer.cpp:573-577` 也是这个相对顺序。

顺带区分一下，`asset->getBoundingBox()` 和 `instance->getBoundingBox()` **不是一回事**：

| | 数据来源 | 特点 |
|---|---|---|
| `asset->getBoundingBox()` | glTF accessor 里写的 `min`/`max` | 零成本，但模型没写就不准 |
| `instance->getBoundingBox()` | `recomputeBoundingBoxes()` 真读顶点算 | 节点变换也含在内，accessor 没写也能算 |

拟合相机用的是后者。

### 相机拟合

不是"把包围球塞进视锥"，而是把**包围盒的半尺寸投影到相机的 right / up 两轴上**，
得到它在屏幕上占的半宽半高，再反推距离。包围球用的是半对角线，太保守 ——
DamagedHelmet 实测要远 1.8 倍，模型在画面里小一圈：

```cpp
const float3 half = aabb.extent();          // 注意是**半**尺寸 (max-min)/2
const float3 dir  = normalize(float3{ 0.55f, 0.42f, 1.0f });   // 右上前方 3/4 视角
const float3 gaze = -dir;
const float3 right = normalize(cross(gaze, float3{ 0.0f, 1.0f, 0.0f }));
const float3 up    = cross(right, gaze);

auto support = [](float3 h, float3 u) {     // 长方体沿单位方向 u 能撑多远
    return std::abs(h.x*u.x) + std::abs(h.y*u.y) + std::abs(h.z*u.z);
};
const float halfW = support(half, right), halfH = support(half, up);

// 竖直要 halfH <= d*tan(fovY/2)，水平要 halfW <= d*tan(fovX/2)，
// 而 tan(fovX/2) = tan(fovY/2) * aspect。两边都要满足，取更严的那个。
const float tanY = std::tan(fovDegrees * 0.5f * F_PI / 180.0f);
const float distance = std::max(halfH / tanY, halfW / (tanY * aspect)) * 1.05f;
```

> ★ **单位**：`fovDegrees` 是**度**（跟 `Camera::setProjection` 一个口径），
> 函数内部再换成弧度。这里踩过坑，见 [第 6 节](#相机投影有两个重载)。

> `filament::Aabb` 是 `{min, max}` 结构，**不是** `Box`，所以没有 `getBoundingSphere()`。
> 而且 `Aabb::extent()` 返回的是 `(max-min)/2` —— **半**尺寸，名字看不出来，很容易当成全长。
> `Aabb` 暴露的是裸字段 `min`/`max`，`getMin()`/`getMax()` 是 `Box` 的方法，
> 写到 `Aabb` 上会 `C2039`。

### 轨道相机（阶段 1-d）

用官方的 `camutils::Manipulator`（`Mode::ORBIT`），不自己写。起始姿态直接喂
`fitCamera()` 算出来的那个取景，所以"加载完"和"手动取景"是同一套参数，
不会加载完再跳一下：

```cpp
gManipulator = camutils::Manipulator<float>::Builder()
        .viewport(gWidth, gHeight)
        .targetPosition(target.x, target.y, target.z)
        .orbitHomePosition(eye.x, eye.y, eye.z)
        .upVector(0.0f, 1.0f, 0.0f)
        .zoomSpeed(初始距离 * 0.08f)     // 滚轮一格 ≈ 拉近 8% 初始距离
        .fovDegrees(45.0f)               // 只影响右键平移的手感，不改变投影
        .build(camutils::Mode::ORBIT);
```

鼠标事件照官方 `FilamentApp2.cpp:1086-1108` 转发：`grabBegin(x, y, 是不是右键)` /
`grabUpdate(x, y)` / `grabEnd()` / `scroll(0, 0, -滚轮格数)`。滚轮**要取反**，
因为 `Manipulator.h` 的约定是"负数 = 拉近"，而 Win32 往前滚是 `+120`。

两个必须知道的内部行为（代码里也写了注释）：

1. **`R` 复位不能用 `getHomeBookmark()`**。它把 `phi/theta` 硬编码成 0
   （`OrbitManipulator.h:159-160`），复位后镜头会跑到 +Z 正前方，把 3/4 视角丢掉
   （实测 `eye` 从 `(1.494 1.143 2.534)` 变成 `(-0.002 0.000 3.122)`）。
   改成构造完立刻 `getCurrentBookmark()` 自己存一份。
2. **`getLookAt()` 返回的 target 不是 pivot**。`jumpToBookmark()` 故意把它放在
   眼睛正前方**恰好 1 个单位**（`OrbitManipulator.h:181`），所以 `length(eye - target)`
   恒等于 1.0。别拿它算距离 —— 算出来的远平面会固定在一个常数上，
   滚轮往外拉几格模型就被整个裁掉。改成用"相机到模型包围球心的距离"
   （**模型不动、动的是相机**），跟 pivot 被平移了多少无关。

### 鼠标手感为什么翻过来（阶段 1-e）

`camutils::Manipulator` 的 ORBIT 约定（`OrbitManipulator.h:113` 起）是：

```cpp
const int delx = mGrabWinX - x;      // Win32/SDL 的 y 轴向下，"往上拖" => dely > 0
const int dely = mGrabWinY - y;
delta_theta = delx * orbitSpeed.x;   // 水平
delta_phi   = dely * orbitSpeed.y;   // 竖直；phi 是仰角 = asin(eye.y / 半径)
```

`orbitSpeed` 出厂是 `(0.01, 0.01)`。于是：

| 拖拽 | 默认（Filament 官方） | 本工程 / Blender |
|---|---|---|
| 往上拖 | `dely > 0` → `phi` 变大 → 相机**升高** → 俯视看**顶面** | 相机**降低** → 看**底面** |
| 往下拖 | `phi` 变小 → 相机**降低** → 看**底面** | 相机**升高** → 看**顶面** |

右列才是 Blender / three.js `OrbitControls` 的手感（"抓住物体拖"）：`OrbitControls` 里
`rotateUp(2π·deltaY/h)` 干的是 `sphericalDelta.phi -= angle`，而它的 `phi` 是从 +Y 量的
极角，所以往下拖（`deltaY > 0`）→ 极角变小 → 相机升高、看到顶面，和右列一致。

结论：**只翻竖直，水平不动** —— 水平方向 Filament 本来就是"物体跟手"
（`OrbitControls` 的 `rotateLeft` 同号）。就改一个常数，要是真觉得水平也反了，
把 `x` 也取负即可：

```cpp
.orbitSpeed(0.01f, -0.01f)      // 默认是 (0.01, 0.01)
```

验证方式：向活着的窗口**注入真实 Win32 消息**（`WM_LBUTTONDOWN` → 拖 300 px →
`WM_LBUTTONUP`），读 `--verbose` 的 `[camera]` trace。300 px × 0.01 = 3 rad 会被
clamp 到 ±89.94°，相机几乎正上/正下，`eye.y` 的符号不可能看错：

| 拖拽方向 | 终态 `eye`（home 半径 3.309） | 含义 |
|---|---|---|
| 上 300 px | `(-0.001, -3.309, -0.184)` | 相机在模型**正下方** → 看**底面** |
| 下 300 px | `(-0.001, +3.309, -0.184)` | 相机在模型**正上方** → 看**顶面** |
| 不给输入 | 全程停在 home，姿势一次都不变 | 基线干净，上面两行只来自拖拽 |

`|eye.y|` 正好等于 home 半径，说明是纯轨道旋转，没有顺带把距离也改了。

### 画质开关（阶段 1-e）

之前画面"飘、看着不真实"，根因就是**四个画质开关全关着**。而且代码里那句注释
"这几项默认开着但很贵"本身就是**错的** —— Filament 自己的 `Options.h` 里
`BloomOptions::enabled` 和 `AmbientOcclusionOptions::enabled` 出厂都是 `false`，
是**官方 viewer 显式把它们打开的**。

权威来源就是官方 viewer 唯一的构造函数 `libs/viewer/src/ViewerGui.cpp:427-453`：

```cpp
mSettings.view.shadowType   = ShadowType::PCF;
mSettings.view.dithering    = Dithering::TEMPORAL;
mSettings.view.antiAliasing = AntiAliasing::FXAA;
mSettings.view.msaa         = { .enabled = true, .sampleCount = 4 };
mSettings.view.ssao.enabled = true;
mSettings.view.bloom.enabled= true;

LightManager::Builder(LightManager::Type::SUN)
    .color(...).intensity(...).direction(...)
    .castShadows(true)                                   // ★
    .build(*engine, mSunlight);

view->setAmbientOcclusionOptions({ .upsampling = View::QualityLevel::HIGH });
```

我们按这张表逐条抄回 `main.cpp`（另外 `Settings.h:265-274` 的太阳出厂值是
`intensity = 100000`、方向 `{0.6, -1, -0.8}`，也一并对齐了）：

| 开关 | 之前 | 现在 | 缺了会怎样 |
|---|---|---|---|
| `setMultiSampleAntiAliasingOptions` | 关 | `enabled = true, sampleCount = 4` | 边缘锯齿 |
| `setAmbientOcclusionOptions` | 关 | `enabled = true, upsampling = HIGH` | 缝隙没有接触阴影，像贴上去的贴纸 |
| `setBloomOptions` | 关 | `enabled = true` | 高光不"发光"，缺摄影感 |
| `setShadowingEnabled` + 太阳 `castShadows` | 关 | 都开，`ShadowType::PCF` | **完全没有影子** |
| `setDithering` | 没设 | `TEMPORAL` | 暗部出现带宽色带 |
| 太阳 `intensity` | 50000 | 100000 | 整体比官方暗一档 |

> ★ **阴影有三个开关，缺一不可**：`View::setShadowingEnabled(true)`（View 总开关）、
> 光源 `.castShadows(true)`（谁投影）、以及**每个 renderable 自己的 `castShadows(true)`**。
> `RenderableManager.h:388` 原话是 "Controls if this renderable casts shadows,
> **false by default**" —— glTF 加载出来的 renderable 全是 `false`，不显式打开的话
> 阴影贴图里就是空的、画面上一点影子都没有。所以 `loadModel()` 里加了一段遍历
> `asset->getRenderableEntities()` 逐个 `setCastShadows(inst, true)`。

代价实测（GTX 960 / 720p / OpenGL）：单次测量曾量到 **11.8 ms → 13.4 ms**，但后来才发现
这台机器的帧率会被 **vsync 整段钉在 60 Hz**（同一份 exe 在 10.5 和 16.7 ms/帧之间跳），
小于 6.7 ms 的差别根本量不出来 —— 详见[第 9 节](#9-性能要点)。换来的观感提升是实打实的。

真要更高的帧率，官方留的"高性能开关"是 `View::setDynamicResolutionOptions`
（**DSR**，动态分辨率：帧率掉下去时自动降内部渲染分辨率，回来了再升回去），
配合 `Renderer::setFrameRateOptions` 用。官方 viewer 把它挂在侧边栏、默认不开 ——
需要再上。

### 相机阻尼（阶段 1-e）

官方的轨道相机**一点阻尼都没有**：

* `Manipulator::update()` 是**空实现**（`libs/camutils/src/Manipulator.cpp:326`）——
  ORBIT 模式的姿态只在收到输入事件时改变，帧循环里调 `update(dt)` 什么都不会发生。
* 官方 App 里确实有一处阻尼 `.flightMoveDamping(15.0)`（`FilamentApp2.cpp:212`），
  但它**只作用于 `FREE_FLIGHT` 模式**，ORBIT 用不上。

所以"阻尼"是我们自己加的一层。**不需要任何额外库**，核心就是一行指数平滑：

```cpp
const float alpha = 1.0f - std::exp(-K * dt);       // 按时间常数收敛，跟帧率无关
```

* 用 `exp` 而不是固定 `alpha`：帧率一变手感就变了。
* 也不用 `alpha = K * dt`：`dt` 稍大就会超过 1，那会**过冲**（镜头甩过头再荡回来）。
* `dt > 0.25 s`（窗口被拖走 / 长时间被盖住）时直接贴合，不让镜头慢慢"飘"过去。
* 已经贴合的帧**直接照抄真值**、不走平滑 —— 这是 `--shot` 的 md5 能保持不变的唯一原因。

关键设计：**Manipulator 一点没动，只平滑"喂给相机的姿态"**。`grabBegin` / `grabUpdate` /
`scroll` 的数学全是官方原装，阻尼只是个显示层滤波器。平滑后的姿态**永远不写回**
Manipulator，所以既不污染相机状态，也不会随时间累积误差。

姿态不能用"世界坐标的两个点"来表示，得用**轨道参数**（方位角 + 仰角 + 距离）——
这是这一节最关键的坑，也是"左右晃会穿过模型"的根因：

```cpp
// ❌ 直接插值世界坐标的两个点：走的是**弦**，半径会被削掉一截
dampEye = mix(dampEye, camEye, alpha);

// ✅ 只插值轨道参数，眼睛恒在半径 dampDist 的球面上
toSpherical(camEye - pivot, &thetaTrue, &phiTrue);
dampDist  += (dTrue - dampDist) * alpha;
dampPhi   += (phiTrue - dampPhi) * alpha;
dampTheta += nearestDelta(dampTheta, thetaTrue) * alpha;  // theta 跨 ±π 要取最近代表元
dampEye    = pivot + fromSpherical(dampTheta, dampPhi) * dampDist;
```

**为什么会"穿过模型"**：两个世界坐标点之间的线性插值走的是**弦**。甩得猛的时候
（一帧之内转 100° 以上）弦从球**里面**抄近路，轨道半径被削掉一大截。实测一帧甩
400px（约 229°）：

| | 轨道半径（= `--verbose` 里的"到模型"） |
|---|---|
| `--damping 0`（无阻尼） | **恒为 3.3090**，一点不差 |
| `--damping 15`（旧写法：插值世界坐标点） | 掉到 **2.6170**（**−21%**），正好穿过模型外圈 |

**但原点必须是"真正的 pivot"，不能写死成模型中心。** 没平移过的时候两者恰好相等
（`OrbitManipulator.h:46` 就是 `mPivot = mTarget = props.targetPosition`，而
`targetPosition` 喂的正是模型包围盒中心；`--damping 0` 时实测半径全程恒等于 3.3090），
所以一开始把原点写成模型中心也不会露馅。**露馅的是右键平移**：

```cpp
// libs/camutils/src/OrbitManipulator.h:100-107 —— 平移时 pivot 跟着 eye / target 一起走
if (mGrabState == PANNING) {
    const vec3 translation = (mGrabFar - raycastFarPlane(x, y)) * ulen / vlen;
    mPivot        = mGrabPivot  + translation;   // ★ pivot 被搬走了
    Base::mEye    = mGrabEye    + translation;
    Base::mTarget = mGrabTarget + translation;
}
```

搬走之后还拿**旧**的模型中心当原点，半径和朝向就全错了 —— 拿到的不是"绕 pivot 的圆弧"，
而是一条歪掉的轨迹，于是"**右键拖一下、再左右拖就穿模**"。实测（先右键平移、再左键一帧甩出去，
K=15，720p，半径都在 `--verbose` 的 `raw` / `eye` 两栏上量）：

| 一帧内：右键平移 → 左键甩动 | 真值半径（Manipulator 自己的） | 阻尼后半径（原点 ❌ 写死模型中心） | 阻尼后半径（✅ 影子 pivot） |
|---|---|---|---|
| 120px → 200px | 3.309 ~ 3.310 | **3.166 ~ 3.331**（−4.5% ~ +0.7%） | **3.308 ~ 3.311** |
| 250px → 400px | 3.309 ~ 3.309 | — | **3.309 ~ 3.310** |
| 300px → 500px（`--damping 5`） | 3.308 ~ 3.309 | — | **3.308 ~ 3.309** |

`mPivot` 是 `private`，外面读不到（和 `Bookmark` 那几个字段一样，只对 manipulator 自己是
friend），但它对 pivot 的**行为是确定的**，照着复刻一份影子就行：

| 动作 | 真 `mPivot` 怎么动 | 影子怎么写 |
|---|---|---|
| 左键旋转 | 不动 | 不动 |
| 滚轮推拉 | 不动（只有 `eye` 沿视线走，`OrbitManipulator.h:117-119`） | 不动 |
| 右键平移 | 和 `mEye` **同步平移**，位移量完全相同 | `pivot = 按下时的 pivot + (eye − 按下时的 eye)` |
| `R` 复位 | `jumpToBookmark()` 把它拉回 `targetPosition` | 跟着回到模型中心 |

四行里"右键平移"那一行是**我们自己在 `WM_RBUTTONDOWN` / `WM_RBUTTONUP` 里知道的**，
不用去猜（`grabBegin(strafe=true)` 才会进 `PANNING`；`.panning(true)` 因此显式写在
`buildManipulator()` 里，免得哪天被改掉）。用"按下时的起点 + 位移"这种**绝对**形式，
而不是逐帧累加，免得长时间拖拽后攒出漂移。

> 注意近 / 远平面那一步用的**仍然是模型包围球心**：那里要框住的是**模型**（它不会动），
> 平移之后 camera 确实离它更远了，这正是对的。所以代码里有两个不同的点并存：
> `pivot`（阻尼的原点）和 `camSphereCenter`（= `camHomeTarget`，包围球心），别合并。


**为什么插"方位角 / 仰角"而不是走"最短弧（大圆）"**：这两个角就是 `OrbitManipulator`
内部自己的参数（`jumpToBookmark()` 的 `dir = (sinθ·cosφ, sinφ, cosθ·cosφ)`、
`getCurrentBookmark()` 的 `φ = asin(y)` / `θ = atan2(x, z)`），在它们上面插值得到的是
**转台**运动：纯水平拖拽时仰角一点不动。按最短弧插方向则不然 —— 大圆跨大角度时会朝
极地方向鼓出去：同一发 400px 水平甩动，仰角从 20.2° 一路鼓到 33.3°（`eye.y` 1.143 → 1.818），
画面会"往上翻"。两种写法实测对比：

| 水平甩 400px | 半径 min / max | `eye.y` min / max |
|---|---|---|
| 旧（大圆 + 插世界坐标点） | 2.6170 / 3.3090 | 1.1430 / 1.8180 |
| 现在（方位角 / 仰角 + 转台） | **3.3090 / 3.3090** | **1.1430 / 1.1430** |

**相机永远正对模型中心**：注视点固定在眼睛正前方 1.0 处（和真值同构，
`OrbitManipulator.h:181`），所以转的过程中模型不会从画面正中跑掉，也不会翻身 ——
就是 Blender / 游戏里"拖住人物转一圈"的手感。滚轮推到"翻过中心"之后真值符号会反过来
（`mFlipped`），这里跟着它。

| `--damping K` | 实测（一帧之内把鼠标甩出去 400px ≈ 229°，720p；下面的帧数是在约 75 FPS 下数的，秒数随帧率走） |
|---|---|
| `0` | 完全不阻尼：下一帧就到位（偏差恒为 0.0000），半径恒为 3.3090 |
| `15`（默认） | 单调收敛、**不过冲**，约 **60 帧（~0.8 s）** 滑到位；半径恒为 3.3090、`eye.y` 恒为 1.1430 |
| `5` | 更沉：约 **170 帧（~2.2 s）** 才滑到位；轨迹同样是半径恒定的转台 |

这几个数字是这么测的：`--verbose` 下每帧打印一行
`[camera] frame=N eye=(...) raw=(...) 到模型=R`，`raw` 是 Manipulator 的真值（一帧之内就跳到位），
`eye` 是实际喂给相机的平滑值 —— 看它一步步追上去；`到模型` 那一栏就是**轨道半径**，
盯住它有没有被削掉即可。`--damping 0` 时每一帧 `eye` 都**完全等于** `raw`。

> **顺带的好处**：滚轮推拉和 `R` 复位也一起变柔和了 —— 它们走的是同一个姿态出口，
> 不用另外写动画。

> **为什么不用 `Bookmark::interpolate()`**：camutils 自带
> `Bookmark::interpolate(a, b, t)`（`camutils/Bookmark.cpp:68-71`）看着正合适，其实用不上 ——
> 它要两个**已经存下来的** bookmark 才能插值（"从这个机位飞到那个机位"），而连续拖拽需要
> 一个外部读不到也写不进的"中间态"：`Bookmark` 的字段全是 `private`，只有几个 manipulator
> 类是 friend（`camutils/Bookmark.h:57-72`）。所以轨道参数只能自己从 `getLookAt()` 的
> 姿态反算（`atan2` / `asin`），再自己插值。

### 内容重载（阶段 2）

**运行时换内容**有两条入口，走的是**同一条路**：

| 入口 | 来源 |
|---|---|
| 拖放 `.glb` 到窗口 | `WM_DROPFILES` → `DragQueryFileW` 拿到 UTF-16 路径 → `narrowUtf8()` 转 UTF-8 |
| `F5` | 重新加载 `modelPath`（导出覆盖后重看一眼，也是最容易自动化的一条） |

#### 真正干活的时机：帧循环里，不是 `WndProc` 里

`WndProc` 只做一件事：把路径抄进 `gDropPath`（`F5` 只置一个 `gReloadPending` 标志）。
拆 GPU 资源放在**消息泵之后、渲染之前**那段：

* `WndProc` 可以嵌套、可以重入，此刻帧循环的相机状态正处在**中间态**；
* 到了循环里，上一帧已经完整渲染完，状态是干净的。

`loadModel()` 里 `AddAsset` 的成本是纯 CPU 的（解码 + 建 buffer），一帧之内做完，
不需要异步状态机。

#### 顺序：**先加载新的，成功了再拆旧的**

```cpp
Model fresh;
if (loadModel(engine, scene, target.c_str(), fresh)) {   // 只有完全成功才 addEntities
    if (triangleMode) { /* 拆掉三角形那套 */ } else { destroyModel(scene, model); }
    model     = fresh;        // Model 是纯指针结构，直接搬
    modelPath = target;
    resetView();              // 相机按新包围盒重新就位
}
```

这一点能成立，是因为 `loadModel()` 是**全有或全无**的：`scene->addEntities()` 是它的
**最后一步**（`main.cpp` 里 `loadModel` 的末尾），前面每一条失败路径都在那之前就把
entity 收拾干净了。所以拿一个临时 `Model` 去试，失败时当前内容**一点没动** ——
拖进来一个坏文件、或者 `F5` 时磁盘上的文件已经没了，画面原样保留，只多一行
`[drop]/[reload] 加载失败，保持当前内容不变`。

（两个模型**同时**挂在场景里只有这一帧之前的一瞬间，渲染开始前旧的就已经被移走了，看不见。）

#### `resetView()`：一次把整套相机状态复位

启动时和每次重载成功之后都走它，里面按顺序做五件事：

1. 重新拟合取景（`fitCamera(model.bounds, ...)`；三角形模式用那个固定机位）；
2. `delete gManipulator` 然后**重建**（新建的正好停在 home，轨道参数由它反算）；
3. `gHomeBookmark = gManipulator->getCurrentBookmark()`（`R` 复位用的那份）；
4. 影子 pivot / 平移起点 / `gPanning` / `gPivotReset` 全部归位；
5. `dampEye/dampTarget/dampTheta/dampPhi/dampDist` **贴着**新 home。

第 5 步有个额外好处：重载后第一帧正好落进阻尼的"已贴合"那一支，**bit-exact 照抄**
真值 —— 相机是**直接**落在新取景上的，不会从旧姿态慢慢飘过去。

> 这也解释了为什么 `dampEye` 那五个量声明在**第 6 节开头**（`resetView` 旁边），
> 而不是帧循环前面：`resetView()` 得能顺手复位它们。

#### 实测（`--verbose`，都跑过）

| 场景 | 结果 |
|---|---|
| `F5` 同一个文件 | `[bounds]` / `[camera] home` 与启动时**逐位相同**（3.309 / eye 1.494 1.143 2.534） |
| 磁盘上换成另一个模型再 `F5` | `[bounds]` 0.947 → **0.500**，`[camera] home` 距离 3.309 → **1.784**，`entity` 1 → 2（相机确实重算了） |
| 先删掉文件再 `F5` | `[reload] 加载失败，保持当前内容不变`，进程**不崩**、画面保留（原来的 `[model]` 只在启动时打过一次） |
| 三角形模式按 `F5` | 标题 `ModelViewer - PBR Triangle` → `ModelViewer - DamagedHelmet.glb`；相机从固定机位 `(0,0,3)` 换成拟合后的 `(1.494 1.143 2.534)` |

四条都验证了，而且**重载这条路本身不影响启动路径**：换完 / 刷新完再 `--shot`，
画面与启动时逐位相同。

> 四个基线**整体换过一次**：加地面网格（阶段 2-b）那一次 —— 地面落进了画面，
> 四个数字一起变了（新旧都在[第 1 节](#1-跑起来)）。后来接控制面板（阶段 3）**又没动**
> （面板在 `--shot` 里默认不画）。

#### `WM_DROPFILES` 的两个细节

* **`DragAcceptFiles(hwnd, TRUE)` 必须调**，否则系统根本不发这条消息（它顺手给窗口
  加上 `WS_EX_ACCEPTFILES`）。
* `DragFinish(hdrop)` **必须调**，否则泄的是 shell 的内存。反过来说：**自己伪造
  `WM_DROPFILES` 时不能自己 `GlobalFree` 那个句柄**（会双重释放）。
  而且伪造一条**跨进程**的 `WM_DROPFILES` 是**做不到**的，见
  [第 10 节](#wm_dropfiles-没法跨进程伪造自动测试用-f5)。

### 地面网格（阶段 2-b）

**为什么要有它**：太阳开了 PCF 阴影之后，影子的"落点"其实**是不存在的** —— 场景里
只有模型本身，阴影只能投在模型自己身上，看上去仍然"飘在虚空里"。有了一块地面，
影子才有地方落脚，模型也才有了**尺度参照**（多大的算"大"）。

素材是 `materials/groundGrid.mat`，走 matc，和三角形同一条流程。

| 决定 | 为什么 |
|---|---|
| `shadingModel : lit`；renderable **不**设 `castShadows` | 受光 → 太阳的直接光被挡掉的那一块就是阴影；自己不进阴影贴图（一块地板没必要） |
| `blending : fade` + `culling : back` | 半透明地板。`fade` 模式要求 baseColor **预乘 alpha**，材质里那句 `vec4(col.rgb * a, a)` 就是干这个的 |
| 网格线用 `getWorldPosition().xz` + `fract` / `fwidth` | 纯程序化：不用贴图。`fwidth` 让线宽在任何距离都保持约 1px（自带抗锯齿） |
| 径向淡出（`fadeRadius` / `fadeStart`） | 远处不留硬边 —— 地板"消失在雾里"，顺手把视锥边缘也藏了 |
| 底面不透明度 0.72（不是 0.3） | 太透的话，阴影造成的**直接光缺口**会和背后的天空盒混在一起，等于看不见。实测 0.72 影子最"实" |

**几何是死的，只有参数在动。** 地平面就是一个 **1×1 的单位四边形**（`static const
GroundVertex verts[4]`）；模型加载完之后按包围盒**缩放 + 平移到模型脚底**
（贴 `bounds.min.y`，边长 `kGroundSideFactor * radius`）。`F5` / 拖放换模型时
**不重建**几何和 `RenderableComponent`，只改 `TransformManager` 那两个分量 + 几个
材质参数 —— 换一次模型是 **0 个 GPU 对象分配**。

> 这里踩过一个坑：四边形顶点一开始写在函数里的**局部数组**，而 `VertexBuffer` 上传
> 是异步的（`BufferDescriptor(data, size, nullptr)` **不做同步拷贝**），数组一出作用域
> 内存就还回去了 —— 地面渲染成一片垃圾。改成 `static const` 才对。

**跟着模型走的量**：`gridSpacing` 吸附到 2 的幂（`pow(2, round(log2(radius / 6)))`）。
边长是 6×半径，格距约半径/6 —— 所以半径范围内大致 6 格、整块地板约 36×36 格，
模型再大再小，格子看上去都一样大。

**和相机的耦合**：`camNear` / `camFar` 必须**包住**这块地板，否则地板会被裁掉，
或者深度精度崩掉（`camFar` 太近 → 阴影贴图抖动）。见 `fitCamera()` 里的
`kGroundSideFactor`。

**验证过什么**：透视地面正确、太阳的软阴影（PCF）**落在地面上**、换模型后格子重新
贴合、三角形模式也有地面、`R` 复位地面跟着回位。参数是用 `--shot` + 眼睛调的，
最终值（`baseColor` a=0.72 / `lineColor` 0.300,0.320,0.350 a=0.95 /
`fadeRadius = radius*3` / `fadeStart` 0.25 / `roughness` 0.85 / `reflectance` 0）
就是面板"地面网格"那一组的出厂值（见[控制面板](#控制面板阶段-3)）。

> 官方 `samples/gltf_viewer` 用的是 `libs/filamentapp` 里那张 `groundShadow.mat`
> （unlit + shadowMultiplier，只画一片"阴影形状"的灰）—— 画不出格子、也不受光照，
> 本质是"在模型脚下贴一块假影子"。我们要的是**看得见的地板** + 格子做尺度参照，
> 所以自己写了一个。

### 控制面板（阶段 3）

左侧一块**固定 340px** 的侧边栏，`F1` 收放，`--no-ui` 彻底关掉。它存在的理由很直接：
画质开关、光照、地面参数原来都只能改代码重编，现在**当场就能调**，调完照着参数写回
出厂值即可。

| 分组 | 内容 | 默认 |
|---|---|---|
| 信息 | 模型路径、entity 数、包围盒半径、可见 renderable 数、帧耗时 / FPS、相机姿态 | 展开 |
| 画质 | 后处理 / FXAA / MSAA 4x / SSAO（含 upsampling 档位）/ Bloom 强度 / 阴影类型（PCF、VSM、DPCF、PCSS、PCFd）/ 抖动 / 视锥剔除 | 展开 |
| 光照 | 太阳强度（lux）、高度角、方位角、IBL 强度、天空盒开关 | 收起 |
| 地面网格 | 显示开关、格距自动 / 手动、淡出半径、淡出起点、底面不透明度、网格线不透明度、粗糙度 | 收起 |
| 相机 | 阻尼速率、视场角、复位按钮 | 展开 |
| 调试 | 控制台打印相机姿态、面板显隐、截图用法提示 | 收起 |

**架构上只加了一层"皮"，像素仍然是 Filament 画的：**

| 位置 | 内容 | 来源 |
|---|---|---|
| `third_party/imgui/` | ImGui 1.92.5 核心（4 个 `.cpp` + `imgui_internal.h` 等）+ `imgui_impl_win32` | 源码树 `third_party/imgui/`，**当源码编**，不链接 `.lib` |
| `src/filagui/` | `ImGuiHelper`（ImGui 的 draw list → Filament `VertexBuffer` / `MaterialInstance`）、`ImGuiExtensions`、`ImGuiMath` | 源码树 `libs/filagui/`（`src/` 2 个 + `include/filagui/` 3 个），拷 5 个文件 |
| `materials/uiBlit.mat` | 画 UI 用的那个材质 | 照 `libs/filagui/src/materials/uiBlit.mat` 抄 |
| `src/ui.h` / `src/ui.cpp` | `UiControls`（一堆朴素字段）+ `drawPanel()` + `UiLayer`（生命周期 / 输入 / 渲染） | 本项目写的 |

ImGui 一行渲染代码都没参与画图：`ImGuiHelper` 把 ImGui 攒出来的 draw list 翻译成
顶点 / 索引缓冲 + 一条 `MaterialInstance`，剩下交给正常的 `Renderer::render()`。
（ImGui 只负责"算界面"，Filament 负责"画像素"。）

**必须是第二个 View。** `ImGuiHelper` 的构造函数会**接管**你交给它的那个 View
（设正交相机、换 scene、把 `blendMode` 改成 `TRANSLUCENT`），所以它不能和主画面共用
一个 View —— 于是有了 `uiView`。每帧的渲染顺序也是固定的：

```cpp
renderer->render(view);      // 场景（这一步会清屏）
renderer->render(uiView);    // 面板（不清屏，直接叠上去）
```

**输入怎么进来。** Win32 消息在 `WndProc` 里**先**喂给
`ImGui_ImplWin32_WndProcHandler`，再用官方的 `WantCaptureMouse` / `WantCaptureKeyboard`
决定要不要转发给相机 —— 就是 `FilamentApp2.cpp:509` 那套。三个细节：

* 已经开始的拖拽**不因为鼠标滑进面板就中断**（否则拖到面板上会突然粘住）；
* `F1` / `ESC` **永远**有效，不受面板捕获影响；`R` / `F5` 在面板忙着的时候（比如正在
  拖滑块）让给面板，免得拖到一半视角突然复位；
* 面板里一个文本输入框都没有，所以它基本不抢键盘。

**改动只在"面板真的改了东西"时生效。** `UiControls` 里有个 `dirty` 标志：第一帧按
默认值**整套** apply 一次（所以默认值 = 启动时的渲染状态），之后任何控件改值才置位、
主循环看到才再 apply 一次（`applyControls()`）。好处是默认路径上一帧都不多花，
而且四个 `--shot` 基线在接入面板前后**逐位不变**。

> **出厂值必须逐字等于主代码里的初始设置**（`View` 的 MSAA / SSAO / Bloom / 阴影、
> `LightManager` 的强度与方向、地面那几个参数……）。相等 → 有没有面板渲染结果一模一样；
> 差一个字，`--shot` 基线立刻漂。临时改默认值做实验后忘了改回来，就是这个后果
> （见[第 10 节](#10-已知坑--排查)里那条踩坑记录）。

**中文字体**：ImGui 自带字体只有 ASCII（中文全变 `?`），所以从 `C:\Windows\Fonts\`
里挑一个（`msyh.ttc` → `simhei.ttf` → `Deng.ttf`），一个都没有就退回自带字体
（面板照样能用，只是中文看不见）。

> 这里有个**静默**的坑：ImGui 的"常用 2500 汉字"表**不含**"帧""锥"这类字，缺了就画成
> `?`，不报错、不警告。所以 `src/ui.cpp` 里显式带了一串 `kPanelGlyphs`（本文件所有
> **字符串字面量**里的汉字 + 全角标点），建完图集再**逐字自检**一遍，缺哪个就按
> `U+XXXX` 打到控制台。
>
> 光有自检还不够 —— 它只能检查"列在表里的字"，防不了"改了文案忘了更新表"。所以还有
> **构建时体检**：`tools/check-ui-glyphs.ps1` 在 `POST_BUILD` 跑，扫一遍 `ui.cpp`
> 的字面量（用状态机先剥掉注释，否则注释里的引号会把配对带偏），只要有一个字不在
> `kPanelGlyphs` 里就**让构建失败**。要更新那张表就跑
> `powershell -File tools\check-ui-glyphs.ps1 -Print`，把输出贴回去。

**其它几个决定**：

* `io.IniFilename = nullptr` —— 不往用户目录写 `.ini`。面板是固定布局（没有可拖可缩的
  窗口），"上次拖过哪里"对截图毫无意义，还会让结果不可复现；
* 面板是**盖在**画面上的固定宽度侧边栏，3D 视口仍然铺满整个窗口 —— 所以主相机的
  宽高比**不受面板影响**，开不开面板，模型取景完全一样；
* `ImGuiHelper` 读的是磁盘上的 `materials/uiBlit.filamat`：官方用 `resgen` 把资源编成
  C 数组，而我们手里没有 `resgen.exe`，于是把三处读资源改成读文件（文件头部有三段
  注释标了改哪、为什么）；
* ImGui 的 context **由我们建**、再交给 `ImGuiHelper`（构造函数第 4 个参数）——
  这样字体在 `createAtlasTexture()` 之前就已经注册进图集了。

**代价**：+0.18 ms/帧（10.9 → 11.1，见[第 9 节](#9-性能要点)）。所以 `--shot` 默认关掉它。

### 为什么必须是 ubershader

| | `createUbershaderProvider` | `createJitShaderProvider` |
|---|---|---|
| shader 何时编译 | **打包时就编好**（707 KB 的 uberarchive） | 加载时用 `filamat` 现场编 |
| 首次加载 | 秒开 | 慢 1~2 秒 |
| 额外依赖 | 只要 `uberarchive` + `uberzlib` | 还要 `filamat.lib`（**197 MB**） |
| 渲染开销 | 多一点分支 | 略优 |

选了前者，这也是 `third_party\` 能砍掉 197 MB 的**前提** —— 两条路是绑死的：
想换 JIT provider，就得把 `filamat.lib` 拷回来。

### 生命周期必须按这个顺序

照抄 `gltf_viewer.cpp:913-950` 的 `cleanup()`：

```
destroyAsset → destroyMaterials → delete materials
→ delete resourceLoader → delete 贴图解码器 → AssetLoader::destroy
```

两个容易漏的点：

- `MaterialProvider::destroyMaterials()` **不会**自动调用。ubershader provider 的实现是
  `ArchiveCache::destroyMaterials()` —— 它 `engine.destroy()` 掉从 uberarchive 建出来的
  `Material` 对象；`ArchiveCache` 的析构函数里还有一条 assert
  （"Please call destroyMaterials explicitly to ensure correct destruction order"），
  漏调就会踩。
- 贴图解码器（`stbDecoder` / `ktxDecoder`）是被 `resourceLoader` **引用**的，
  必须等 `resourceLoader` 删掉之后再删它们。

---

## 5. 为什么"不像 PBR"

Filament 里 PBR 效果 = **材质 + 光照**。官方 `samples/hellotriangle.cpp` 是刻意做成
最小示例的，它必然不像 PBR：

| 官方 hellotriangle | 这里 (`cc`) |
|---|---|
| `bakedColor.mat`，`shadingModel : unlit` | `litTriangle.mat`，`shadingModel : lit` |
| 没有法线 | `TANGENTS` 属性（法线四元数） |
| 没有光源 | 太阳 `SUN` + IBL 环境光 |
| 没有 IBL | lightroom_14b IBL + Skybox |
| `setPostProcessingEnabled(false)` | `true` → ACES tone mapping 生效 |
| 正交投影、只有顶点色 | 透视相机 + 粗糙度/金属度/反射率参数 |

三个关键点：

1. **IBL 是命门。** 没有 `IndirectLight`，`lit` 材质就只剩直接光，而空场景又没打灯 →
   一片死灰。IBL 同时提供漫反射辐照度和镜面反射。
2. **Tone mapping 挂在 post-processing 上。** `setPostProcessingEnabled(false)` 一关，
   ACES 色调映射和 ColorGrading 全失效，画面必然"平"。
3. **材质本身得是 lit。** unlit 材质再亮的 IBL 也不会反光。

---

## 6. Filament 的几个坑（踩过的）

### 法线不是独立顶点属性

`VertexAttribute` 只有 `POSITION / TANGENTS / COLOR / UV0 / UV1 / BONE_* / CUSTOM*`，
**没有 `NORMAL`**。法线、切线、副切线被打包成一个四元数塞进 `TANGENTS`（`short4` + normalized）：

```cpp
quatf  q = quatf::fromDirectedRotation(float3{0, 0, 1}, normal);
short4 t = packSnorm16(float4{ q.x, q.y, q.z, q.w });   // <math/quat.h> + <math/norm.h>
```

### 顶点属性和 offset 要对齐

```cpp
struct Vertex {
    float3 position;    // offset  0  FLOAT3
    short4 tangents;    // offset 12  SHORT4 normalized
    float4 color;       // offset 20  FLOAT4
};
static_assert(sizeof(Vertex) == 36, "...");
```

### `readPixels` 的参数顺序

`PixelBufferDescriptor(buffer, size, PixelDataFormat format, PixelDataType type, Callback, user)` ——
**format 在 type 前面**，写反了会报 "无法从 initializer list 转换"。

### `readPixels` 的调用位置

必须在 `beginFrame()` 之后、`endFrame()` 之前，通常在 `render()` 之后。

### 相机投影有两个重载

- 透视：`setProjection(fovY, aspect, near, far)` —— **不传 `Projection` 枚举**
- 正交：`setProjection(Camera::Projection::ORTHO, l, r, b, t, near, far)`

⚠️ 头文件里是 `setProjection(double fovInDegrees, ...)`（`Camera.h:245-254`），
收的是**度**。别和 `filament::math` 里那些吃**弧度**的函数混起来
（`Camera::projection`、`mat4::perspective` 一系是按度/弧度各有各的口径，容易串）。

本项目就在这里栽过：`fitCamera(aabb, aspect, fovY)` 内部按**弧度**算，
调用处却传了 `45.0f`（度）。两个后果叠在一起：

1. `tan(45.0f * 0.5f)` 实际在求 `tan(22.5 弧度)`，是个垃圾值；
2. 更隐蔽的是 `std::min(fovX, fovY)` —— `fovY = 45.0` 是个"巨大的弧度数"
   （`fovX` 才 1.56），所以**永远赢不了 `fovX`**，竖直方向的约束整个变成死代码。

症状是相机比正确的拟合近了 1.8 倍 —— 画面照样能看，所以一直没暴露。
发现的办法：拿 `--verbose` 打出来的 `eye`/`target` 反推 `|eye-target| = 2.685`，
而按代码写的公式应该是 4.94，对不上，于是回去查单位。

### `Scene` 而不是 `View` 持有 IBL / Skybox

Filament 1.77 里是 `scene->setIndirectLight(ibl)` 和 `scene->setSkybox(skybox)`。

### VS 生成器忽略 `SYSTEM`

CMake 3.22 的 Visual Studio 生成器不会把 `target_include_directories(... SYSTEM ...)`
转成 `/external:I`，所以 Filament 头文件里的 `C4244`/`C4267` 会糊满输出。
本项目手动补了 `/external:I` + `/external:anglebrackets` + `/external:W0`。

### `DefWindowProc` 千万别用裸名（标题只剩一个字母）

这个不是 Filament 的坑，但藏得最深，单独记一笔。

窗口类是用 `RegisterClassExW` 注册的（Unicode 窗口），`CreateWindowExW` 也是 W 版，
但工程里**没有定义 `UNICODE` 宏**，于是 WndProc 末尾那句裸写的：

```cpp
return DefWindowProc(hwnd, msg, wParam, lParam);   // ← 展开成 DefWindowProcA
```

拿到了 `DefWindowProcA`。它处理 `WM_NCCREATE` 时会把 `lParam` 当
**`CREATESTRUCTA*`**、把 `lpszName` 当 **ANSI 字符串**去读；
而实际传来的是 UTF-16 的 `L"ModelViewer - PBR Triangle"`，
内存里是 `4D 00 6F 00 64 00 ...`，读到第二个字节的 `00` 就断了：

```
窗口标题 = "M"     GetWindowTextLengthW() == 1
```

排查过程用的是这几招（都在 `--verbose` 下）：

```cpp
// 1. 传进去的指针对不对？   -> len=26 codes=004D 006F 0064   ✓
// 2. 内核收到的 CREATESTRUCT 对不对？  WM_NCCREATE 里读 lpszName -> len=26  ✓
// 3. 窗口里存的到底是什么？  GetWindowTextLengthW() -> 1      ✗
// 4. 绕过 GetWindowText：SendMessageW(hwnd, WM_GETTEXT, ...) -> 也是 1
```

1、2 都对、3、4 都错，说明问题在"存"的那一步 —— 也就是 WndProc 里那个 A 版
`DefWindowProcA`。改成 `DefWindowProcW` 后标题立刻变回 26 个字符。

> 教训：只要用了 `RegisterClassExW`/`CreateWindowExW`，WndProc 里就必须写
> **`DefWindowProcW`**（或者干脆定义 `UNICODE`）。混用不会报错，只会悄悄坏掉。

顺带把控制台中文乱码也修了：源码是 UTF-8（`/utf-8`），而中文控制台默认按 GBK
解释字节，`printf` 里的中文全是乱码。main 开头加一句就好：

```cpp
SetConsoleOutputCP(CP_UTF8);
```

---

## 7. 关窗与清理（要不要上 SDL2）

**结论：SDL2 解决不了，而且官方在 Windows 上也不靠 SDL 管渲染。真正该做的是改清理顺序 + 立刻隐藏窗口。**

### 官方在 Windows 上是怎么用 SDL 的

读了 `libs/filamentapp/src/display_managers/SDLDisplayManager.cpp` 和
`NativeWindowHelperWindows.cpp`：SDL **只负责建窗口和收事件**，
对上层的唯一输出是 `getNativeWindowFromSDL()` 拿到的那个 `HWND`：

```cpp
void* getNativeWindowFromSDL(SDL_Window* sdlWindow) {
    SDL_SysWMinfo wmi; SDL_VERSION(&wmi.version);
    SDL_GetWindowWMInfo(sdlWindow, &wmi);
    return (void*) wmi.info.win.window;      // 就这一个 HWND
}
```

整个 `SDLDisplayManager.cpp` 里**没有一处** `SDL_GL_CreateContext`。
GL context、swapchain、所有 GPU 资源的销毁全是 Filament 自己的事。

所以：**换成 SDL2 之后，关闭时慢的仍然是 Filament 的 teardown，一分钱都不会变快。**
SDL2 的价值在别处（拖拽 `SDL_DROPFILE`、hi-DPI、跨平台、和官方代码结构一致），
不在这个问题上。

> 另外 SDL2 只有 `SDL2.lib` + `SDL2.dll`（动态版），没有 `SDL2-static.lib`。
> 上了它就要多带一个 `SDL2.dll`，破坏现在"单个 exe、零 DLL"的特性。
> （所以 SDL2 **没有**放进 `third_party\`。它的价值只剩阶段 2 的拖拽加载，
> 到那时再决定是编静态 SDL2 还是用 Win32 的 `WM_DROPFILES` ——
> 详见 [`third_party/README.md`](third_party/README.md) 的「SDL2 为什么不在里面」。）

### 官方的清理顺序（`FilamentApp2.cpp:744-784`）

```
场景资源 → 地面/灯光/IBL → 相机 → UI 面板（ImGui）→ View → Renderer → SwapChain
→ destroyWindow → Scene → Engine::destroy
```

注意 `destroyWindow` 排在 `Engine::destroy` **之前**。我们现在也照这个顺序来
（顺手把 `ShowWindow(SW_HIDE)` 提到了最前面）。

### 实测数据（`--verbose`）

| 步骤 | 耗时 |
|---|---|
| 模型资源（`destroyAsset` + `destroyMaterials` + provider + loader + 解码器） | **~3 ms** |
| renderable / material / 各种 buffer / light | < 1 ms |
| ibl + skybox texture | 0 ms |
| manipulator（CPU 侧，纯 `delete`） | 0 ms |
| **ui panel**（阶段 3：ImGui 上下文 + 字体图集 + `uiView`） | **~4 ms**（面板**没开着**也是这 4 ms —— `UiLayer` 一直在，`--no-ui` 只是不画） |
| **renderer** | **1.5 ~ 150 ms** |
| swapchain | 0 ms |
| DestroyWindow | 8 ~ 25 ms |
| Engine::destroy | 20 ~ 35 ms |
| **合计** | **~80 ~ 170 ms**（Debug 构建 ~350 ms） |

模型模式实测（`--frames 5 --verbose`，DamagedHelmet）：

```
[shutdown] scene entities  0.0 ms   → asset 1.3 → materials 0.5 → material provider 1.4
[shutdown] resource loader / stb / ktx2 / asset loader   全 0.0 ms
[shutdown] renderer      100.5 ms
[shutdown] DestroyWindow   5.2 ms
[shutdown] Engine::destroy 20.1 ms
[shutdown] 清理耗时 140 ms（窗口在第 11 ms 就消失了）
```

也就是说加载进来的整个 glTF 场景（顶点 / 索引缓冲 / 4 张贴图）销毁只要十几毫秒，
清理的大头永远在 `renderer` 和 `Engine::destroy` 上。

也就是说**清理本身并不慢**，一二百毫秒。真正的问题是这期间窗口还挂在屏幕上、
不再响应消息，Windows 会把它画成白板 + 标题栏"未响应"，看着就像卡死了。

### 做了什么

```cpp
// 主循环一退出，第一件事就是把窗口藏掉（瞬间返回，绝对安全）
ShowWindow(hwnd, SW_HIDE);
```

`ShowWindow(SW_HIDE)` 只是不显示，窗口对象和 HWND 都还在，Filament 后面销毁
GL context 时照常能用。**不能**在这里 `DestroyWindow`：那会让 Filament 内部
持有的 HWND 变成野指针。真正的 `DestroyWindow` 还是放在 swapchain 之后。

效果：窗口在 **~2 ms** 就消失，剩下 160ms 的清理在后台无声无息地跑。
`--verbose` 会打出 `[shutdown] 清理耗时 164 ms（窗口在第 2 ms 就消失了）`。

### 顺带修的一个真 bug：`beginFrame` 返回 false 时在空转烧 CPU

`Renderer::beginFrame()` 返回 `false` 表示这一帧被跳过（窗口被遮挡/最小化，
或者有异步读回没结束）。原来的循环在这种情况下会**立刻进入下一次迭代**：

```cpp
if (renderer->beginFrame(swapChain)) { ... }   // false 时什么都不做，直接转圈
```

实测 **12 毫秒里空转了 87269 次**，一个核直接烧满。现在走了 `Sleep(1)`：

```cpp
} else {
    Sleep(1);
    continue;
}
```

### `--shot` 为什么直接 `_Exit`

`readPixels` 是异步的，实测有个很反直觉的现象：

| 情况 | `Engine::destroy(Renderer*)` 耗时 |
|---|---|
| 读回在销毁 Renderer **之前就完成了** | **8000 ~ 10800 ms**（卡在 `Fence::waitAndDestroy` 的 `FENCE_WAIT_FOR_EVER`） |
| 读回还挂在队列里、让它在 teardown **期间**完成 | ~140 ms |

```cpp
--shot             -> renderer 10339.7 ms     (读回已完成)
--shot --frames 2  -> renderer   136.4 ms     (读回在 teardown 期间完成)
```

（`Fence::waitAndDestroy` 见 `filament/src/details/Renderer.cpp:196`）

这是 Filament/驱动的一个边角行为，不值得为它跟结构较劲。截图存完就算了 ——
进程马上就死，操作系统会回收一切，BMP 也已经落盘：

```cpp
if (shot.path && shot.finished) {
    std::_Exit(0);      // 跳过清理，800ms 内退出（原来要 10 秒）
}
```

交互式关窗仍然是完整的正规清理。

---

## 8. 路线图

| 阶段 | 内容 | 状态 |
|---|---|---|
| **0** | 窗口 + Engine + 清屏 | ✅ |
| **0-b** | 依赖自包含（`third_party\`，191.8 MB，无外部路径） | ✅ |
| **1-a** | 后处理 / ACES tone mapping | ✅ |
| **1-b** | IBL 环境光 + 天空盒 | ✅ |
| **1-c** | 加载 `.glb`（gltfio）+ 包围盒自适应相机 | ✅ |
| **1-d** | 轨道相机 `camutils::Manipulator`（旋转 / 平移 / 推拉 / `R` 复位） | ✅ |
| **1-e** | 鼠标手感对齐 Blender；画质开关对齐官方 `ViewerGui`（4x MSAA / SSAO / Bloom / PCF 阴影）；相机阻尼 `--damping K`（**转台**） | ✅ |
| **2** | 运行时换模型：拖放加载 `.glb`（`WM_DROPFILES`）+ `F5` 重新加载 | ✅ |
| **2-b** | 地面网格（给太阳投影一个落点，兼尺度参照；程序化格子 + 径向淡出） | ✅ |
| **3** | ImGui 控制面板（画质 / 光照 / 地面 / 相机 / 调试 + 中文字体） | ✅ |
| **4** | 对齐官方：ViewerGui / FilamentApp2（把剩下的旋钮也搬进来） | 计划 |

### 阶段 1-c 的做法（已完成）

细节写在 [第 4 节](#4-gltf-模型加载阶段-1-c)。一句话总结：
照 `samples/gltf_viewer.cpp` 的三步走（`createUbershaderProvider` → `AssetLoader`
→ `ResourceLoader`），把 `materials/litTriangle.mat` 换成 asset 自带材质，
其余（IBL / 天空盒 / 太阳 / 后处理）代码原样不动。

### 阶段 1-d 的做法（已完成）

细节写在 [第 4 节](#4-gltf-模型加载阶段-1-c) 的"轨道相机"小节。一句话总结：
`camutils::Manipulator<float>`（`Mode::ORBIT`）+ Win32 鼠标消息转发，
起始姿态喂 `fitCamera()` 的结果；顺手修掉了拟合里的**度/弧度混用**
（见 [第 6 节](#相机投影有两个重载)）。

### 阶段 1-e 的做法（已完成）

四块，细节都在 [第 4 节](#4-gltf-模型加载阶段-1-c)：

1. **鼠标手感** —— `orbitSpeed(0.01f, -0.01f)`，只翻竖直方向，对齐 Blender /
   three.js `OrbitControls` 的"物体跟手"。水平方向 Filament 本来就对，没动。
2. **画质** —— 把官方 `ViewerGui.cpp:427-453` 的出厂设置抄回来：4x MSAA、
   SSAO（`upsampling = HIGH`）、Bloom、太阳 PCF 阴影（含每个 renderable 的
   `castShadows`）、`Dithering::TEMPORAL`，太阳 intensity 对齐 100000。
   代价量不出来（这台机器的帧率会被 vsync 钉住，见[第 9 节](#9-性能要点)）。
3. **阻尼** —— 官方 ORBIT 模式没有任何阻尼（`Manipulator::update()` 是空实现，官方那句
   `.flightMoveDamping(15.0)` 只作用于 `FREE_FLIGHT`），所以自己加了一层指数平滑：
   `alpha = 1 - exp(-K*dt)`，`--damping K` 可调（默认 15，`0` = 关）。不引入新库，
   Manipulator 原样不动，`--shot` 的 md5 也没变。平滑必须做在**轨道参数**
   （方位角 / 仰角 / 距离）上，不能插值世界坐标的两个点 —— 后者走的是**弦**，
   一甩就把轨道半径削掉两成、镜头直接穿进模型里（实测 3.3090 → 2.6170）。
4. **阻尼的原点** —— 平滑轨道参数需要一个原点，它必须是**真正的 pivot**（`mPivot`，private）。
   平时它恰好等于模型中心，但**右键平移会把它整个搬走**（`OrbitManipulator.h:104-105`：
   `mPivot` 和 `mEye` / `mTarget` 同步平移）。原点写死成模型中心的话，平移之后再甩就会绕
   **旧**中心插值、照样穿模（实测半径 3.309 → 3.166）。所以在 `WM_RBUTTONDOWN` /
   `WM_RBUTTONUP` 里维护了一份**影子 pivot**：平移时同步搬、`R` 复位时跟着回去。
   改完之后，上表几种拖法下半径都恒在 3.308 ~ 3.311。

### 阶段 2 的做法（拖放 + `F5`，已完成）

细节写在 [第 4 节](#内容重载阶段-2)。一句话总结：`WM_DROPFILES` / `F5` 都只记一个
"待加载"标志，真正的换内容放在帧循环里（**先加载新的、成功了再拆旧的**，
失败就原样保留），换完调一次 `resetView()` 把相机 / Manipulator / 影子 pivot /
阻尼状态整套复位。`loadModel()` 本来就已经是"全有或全无"，所以这条路径基本是
把现成的零件重新排一下顺序 —— `--shot` 四个基线一个没变。
`F5` 本来是为了让这条路径能**自动化测试**才加的，但它本身就是查看器该有的键
（Blender 里导出覆盖同一个文件，切回来按 `F5` 就行）。

### 阶段 2-b 的做法（地面网格，已完成）

细节写在 [第 4 节](#地面网格阶段-2-b)。一句话总结：自己写了一张
`materials/groundGrid.mat`（lit + fade + 程序化格子 + 径向淡出），几何是**一个死的
1×1 四边形**，加载完模型后按包围盒缩放平移贴到脚底；换模型时只改 transform 和几个
材质参数，**不重建任何 GPU 对象**。它同时解决了两个问题 —— 太阳的 PCF 阴影有地方落，
模型有了尺度参照。代价是四个 `--shot` 基线**整体换了一次**（地面进了画面）。

### 阶段 3 的做法（控制面板，已完成）

细节写在 [第 4 节](#控制面板阶段-3)。一句话总结：ImGui 的**核心 + win32 后端**和
Filament 的 `filagui` 桥都**当源码**编进 exe（预编译包里根本没有这两样），
`src/ui.cpp` 把六个分组的控件写在一块固定侧边栏里，改动只在 `dirty` 时**整套**重新
apply，所以默认路径一帧都不多花、`--shot` 四个基线**逐位不变**。中文字体从系统
`C:\Windows\Fonts` 里取，并把面板用到的汉字**全部**显式列进 `kPanelGlyphs`（缺了会静默
画成 `?`）；漏列会被构建时的 `tools/check-ui-glyphs.ps1` 拦下来。

### 阶段 3-b 的做法（鼠标捕获修复，已完成）

现象：面板接进来之后，**真机**上左键旋转 / 右键平移全都没反应（"交互功能没了"）。
根因不在相机也不在 ImGui，而在 `WM_LBUTTONDOWN` 里那句 `SetCapture(hwnd)`：
它会让 Windows **给本窗口自己**发一条 `WM_CAPTURECHANGED`（按下鼠标时那份"隐式捕获"
被释放又重新获取），而 `WM_CAPTURECHANGED` 的处理器把"收到这条 = 拖拽结束"写了进去，
于是拖拽在按下的那一瞬间就被自己收尾了。修法：认出 `lParam == hwnd` 的那条通知直接
放行，真正的捕获丢失才收尾。细节和复现方法见
[第 10 节](#10-已知坑--排查)第一条。

为什么一直没发现：之前的交互测试（`pantest.ps1`）用 `SendMessage` 合成消息，
**合成消息不产生隐式捕获**，所以永远看不到那条通知 —— 测试全绿，真机全废。
现在多了一个用 `SetCursorPos` + `mouse_event` 注入**真实输入**的回归脚本
（`realtest.ps1`），四个相位：窗口内旋转、拖出窗口边界、右键平移、
按下前先点一下面板；再补一个"松手后有没有漏捕获"的相位。
面板控件本身也用真实输入点过一遍（`uitest.ps1`：点 `画质` 里的**后处理**复选框，
视口 42560 个采样点里变了 39928 个 —— 画面确实从 ACES 换成"平"的，
顺带证明 ImGui 的控件没被捕获逻辑影响）。
这次修复**不动任何渲染路径**，四个 `--shot` 基线仍是 `6DCA8E7A` / `4E179041` /
`4B98E32B` / `56A6C93D`，逐位不变。

---

## 9. 性能要点

### 实测（GTX 960 / OpenGL 后端 / Release / 1280x720）

先说结论：**这台机器上"每帧成本"不好量**。同一份 exe、同样的参数、连续跑两次
`--frames 2000 --hidden`，墙钟时间会在 **21 s（10.5 ms/帧 ≈ 95 FPS）** 和
**33.4 s（16.7 ms/帧 —— 正好 60 Hz 的台阶）** 之间跳；后者一看就是被 **vsync** 钉住了。
也就是说帧率先由"这一轮有没有被垂直同步绑住"决定，而不是由画质开关决定。

在这种前提下，能确定说出口的只有这些：

| 观察 | 数据 |
|---|---|
| 帧时间（画质全开、不带面板） | **10.5 ~ 16.7 ms/帧（60 ~ 95 FPS）**，取决于这一轮是否被 vsync 钉住 |
| 控制面板（阶段 3）的代价 | **+0.18 ms/帧** —— 4 组交替采样，抖动 ±0.09，符号 4/4 一致（那 8 次跑全程没被 vsync 钉住，运气好） |
| 4x MSAA + SSAO + Bloom + PCF 阴影的代价 | **量不出来**：5 组交替采样，差值在 **−0.06 ~ +4.9 ms** 之间乱跳（vsync 一锁就是 +6.7 ms 的台阶），中位数 −0.04 ms |
| 相机阻尼（阶段 1-e） | 量不出来（每帧几十条浮点运算） |
| 地面网格（阶段 2-b） | 没单独量（物理上只多一个 draw call、4 个顶点） |

量法（想复现的话）：**同一帧数、A/B 交替采样，取中位数**。单跑一次的墙钟时间带着
加载 / 清理的一次性开销（约 1 s），"跑一次 200 帧、再跑一次 800 帧相减"这种办法
把抖动全算进去了：

```powershell
# 两边交替跑 3000 帧；启动开销相同，差值就只剩面板的代价
.\modelviewer.exe --frames 3000 --hidden --no-ui
.\modelviewer.exe --frames 3000 --hidden --ui
```

> **以前这里写的"+1.6 ms"不可信。** 那是"200 帧与 800 帧相减"的单次测量。后来
> 前后试了三种量法（单次相减、300/6000 帧相减、交替采样）才看明白：这台机器上
> 帧时间会整段整段地被 vsync 钉在 60 Hz，任何小于 6.7 ms 的差别都可能被它盖掉，
> 或者反过来凭空冒出来。要拿到干净的数字，得**先关掉 vsync**（或者换一台帧率稳定的
> 机器）再交替采样。

### 取舍

| 点 | 做法 | 原因 |
|---|---|---|
| Material provider | `createUbershaderProvider` | 免运行时编译 shader，秒开 |
| 后端 | `Engine::Backend::OPENGL` | Windows 上启动比 Vulkan 快，驱动兼容性好 |
| 后处理 | 开 `setPostProcessingEnabled(true)`，保住 tone mapping（PBR 必需） | 关掉连 ColorGrading 一起失效 |
| 画质（阶段 1-e） | 4x MSAA / SSAO(`upsampling=HIGH`) / Bloom / PCF 阴影**全按官方出厂值开** | 观感优先；这台机器上量不出代价（帧率被 vsync / CPU 侧压着，见上） |
| 控制面板（阶段 3） | 一个固定侧边栏 + `dirty` 才 apply；`--shot` 默认不画 | +0.18 ms，且默认路径逐位不变 |
| 相机手感（阶段 1-e） | `orbitSpeed(0.01f, -0.01f)` | 竖直方向对齐 Blender / `OrbitControls` 的"物体跟手" |
| 相机阻尼（阶段 1-e） | 每帧只平滑**轨道参数**（方位角 / 仰角 / 距离），原点用**真 pivot 的影子副本**，不写回 Manipulator | 官方 ORBIT 没有阻尼；插世界坐标的两个点会走"弦"、一甩就穿模，插参数才是转台；而原点若写死成模型中心，右键平移后照样穿模 —— 既不加新库、不污染相机状态，也不破坏 `--shot` 的确定性 |
| 运行时库 | `/MT` + Release 静态链接 | 无 DLL 加载、无 CRT 抖动 |
| 材质实例 | 只在加载时建一次，别每帧 `createInstance()` | 每帧建会不断触发材质变体 |
| 贴图解码器 | `stbDecoder` 只建一个，png/jpeg 各注册一次 | 官方也是这么干的，别建两个 |
| 相机 | 用 `camutils::Manipulator` | 官方实现，不用自己写那套球坐标/射线拾取 |
| 视锥剔除 | 材质里保持 `culling : back`，别偷懒设 none | 大模型每帧少画一半三角形 |

---

## 10. 已知坑 / 排查

- **运行时库必须匹配**。exe 用 `/MD` 去链 `mt/*.lib` 会出一堆 `LNK2038` / 重复符号。
  本项目已把运行库固定成 `MultiThreaded`、并删掉 Debug 配置，从根上避开。
- **改完 `third_party\` 一定要删掉 `build\` 重新 configure**。CMake 把路径缓存在
  `CMakeCache.txt` 和 `.vcxproj` 里，不重配会报一堆莫名其妙的路径错。
- **`tools\vendor-deps.ps1` 里不要写中文**。Windows PowerShell 5.1 会把无 BOM 的
  UTF-8 当 ANSI 读，中文会被打碎，极端情况下会吃掉换行、让脚本语法出错
  （本项目已经被这个坑弄坏过一次 `main.cpp`）。脚本保持纯 ASCII，中文写进
  `third_party\README.md`。
- **`private/*` 头**：`gltf_viewer.cpp` 里用了一次 `<private/filament/EngineEnums.h>`
  （判断 `Backend::METAL`）。本项目不需要，别为它引入整个 filabridge 私有头。
- **接上 gltfio 后多出一个 `LNK2019: __imp_PathIsRelativeA`**：`ResourceLoader` 用到
  `utils::Path`，而它底下是 shlwapi。解决办法就是链 `shlwapi`（系统库，不影响
  "单 exe 零 DLL" 的性质 —— 见[第 3 节](#链接的库cmakeliststxt-里分三组)的依赖清单）。
- **`Aabb` 和 `Box` 是两回事**：`Aabb` 是 `{min, max}`，只有 `center()` / `extent()` /
  `isEmpty()` / `transform()`；`getBoundingSphere()`、`getMin()`、`getMax()` 全是 `Box` 的。
  混用直接编译错。
- **`recomputeBoundingBoxes()` 要在 `releaseSourceData()` 之前**，否则 Filament 抛
  Precondition 并直接终止进程。详见 [第 4 节](#4-gltf-模型加载阶段-1-c)。
- **`MaterialProvider::destroyMaterials()` 必须显式调用**，而且要在 `destroyAsset()`
  之后、删 provider 之前。
- **`bluevk.lib`**：如果链接报 Vulkan 未解析符号，加 `vulkan-1` + Vulkan SDK，
  或者从 `FL_CORE` 里删掉 `bluevk`（前提是不用 `Backend::VULKAN`）。
- **源码是 UTF-8 且含中文注释**，MSVC 必须加 `/utf-8`，否则 `C4819` 满屏（已加）。
- **找不到 `materials/*.filamat`**：先跑一次构建，`matc` 是构建期生成的。
- **`LNK4099`（未找到 `filament.pdb`）**：官方包不发布 PDB，`RelWithDebInfo` 下必然出现。
  无害，已用 `/ignore:4099` 屏蔽。
- **竖直拖拽方向由 `orbitSpeed.y` 决定，而且和直觉相反**：Filament 出厂那套是
  "鼠标往上拖 = 相机升高 = 看顶面"，和 Blender / `OrbitControls` 相反。要"物体跟手"
  就把 `orbitSpeed.y` 取负。详见 [第 4 节](#鼠标手感为什么翻过来阶段-1-e)。
- **"左右晃会穿过模型"有两个互相独立的原因，只修一个还会穿**：
  (a) 阻尼去插**世界坐标的两个点**，走的是**弦**：甩得猛时弦从球**里面**抄近路。实测
      轨道半径 3.3090 → 2.6170（−21%）。修法是改插**轨道参数**（方位角 / 仰角 / 距离）。
  (b) 插轨道参数的**原点**写死成模型中心。`pivot` 平时确实是模型中心
      （`OrbitManipulator.h:46`：`mPivot = mTarget = props.targetPosition`），但
      **右键平移会把它搬走**（`OrbitManipulator.h:104-105`：`mPivot` 和 `mEye` / `mTarget`
      同步平移）。搬走之后还拿模型中心当原点，半径和朝向就全错 —— 现象是"**右键拖一下、
      再左右拖就穿模**"，实测半径 3.309 → 3.166。`mPivot` 是 `private`，只能自己维护一份
      影子（平移时同步搬、`R` 复位时回去）。
  两个都改完，平移 + 各种甩法下实测半径恒在 3.308 ~ 3.311。
  详见 [第 4 节](#相机阻尼阶段-1-e)。
- **用"最短弧 / 大圆"插方向，出来的不是转台手感**：大圆跨大角度时会朝极地方向鼓出去 ——
  水平甩 400px 时仰角从 20.2° 鼓到 33.3°（`eye.y` 1.143 → 1.818），画面"往上翻"。
  想要游戏里那种"拖住人物转一圈"，就插 `atan2` / `asin` 出来的方位角 / 仰角
  （也就是 `OrbitManipulator` 自己的那套参数），别插方向向量。
- **`SetCapture` 会给窗口自己发一条 `WM_CAPTURECHANGED`，处理不当就把鼠标交互整个废掉**：
  按下鼠标时系统已经给了本窗口一份"隐式捕获"，这时再 `SetCapture(hwnd)` 同一个窗口，
  Windows 会先释放、再重新获取，然后**给本窗口自己**发一条 `WM_CAPTURECHANGED`
  （实测 `lParam` 就是本 `hwnd` —— 按规矩 `lParam` 是"拿到捕获的那个窗口"）。
  把那条通知当成"捕获被抢走"、在处理器里 `grabEnd()` + `gDragging = false` 的话，
  拖拽会在**按下的那一瞬间**被自己收尾，现象是**鼠标拖拽完全没反应**（左键旋转、
  右键平移全废，看着像"交互功能没了"）。修法是认出 `lParam == hwnd` 直接 `return`，
  真正的捕获丢失（`Alt+Tab` / 别的进程抢）才收尾。
  两个附带事实：ImGui 官方 Win32 后端在同一个消息里也会 `SetCapture`
  （`imgui_impl_win32.cpp:696`，所以这条通知基本每次按下都会来，而且"多问一句
  `GetCapture()`"躲不掉）；松开按键时系统还会来一条 `lParam == 0` 的（"捕获没了、
  也没给别人"），紧跟着才是 `WM_*BUTTONUP`，让它收尾无害。
  ★ **这个坑合成消息 (`SendMessage`) 测不出来**：它不产生隐式捕获、也就没有这条通知 ——
  一直用 `SendMessage` 的交互测试（`pantest.ps1`）**每次都过**，只有真机真实输入才暴露。
  真机回归要用 `SetCursorPos` + `mouse_event` 注入（`realtest.ps1`），判据三条：
  拖拽真的转了（两次拖拽合计 113.52°）、拖出窗口右/下边界还在转（客户端坐标
  `(1700,1000)` 仍收到 `WM_MOUSEMOVE`）、松手后把光标挪到窗口外**不再**收到
  `WM_MOUSEMOVE`（说明没漏捕获去抢系统输入）。
- **阴影要开三处，缺一不可**：`View::setShadowingEnabled(true)`（总开关）
  + 光源 `.castShadows(true)`（谁投）+ **每个 renderable 的 `castShadows(true)`**
  （`RenderableManager.h:388`：glTF 加载出来的默认全是 `false`）。只开前两处的话
  阴影贴图是空的、画面一丝影子都没有，很容易误判成"阴影坏了"。
- **`BloomOptions` / `AmbientOcclusionOptions` 的出厂值是 `enabled = false`**，
  是官方 viewer 显式打开的。别被"这些默认开着"的经验误导 —— 开了才会有观感。
- **用 PowerShell 注入鼠标消息测试时，函数别叫 `LP`**：`lp` 是 `Out-Printer` 的
  内置别名，而**别名优先级高于自定义函数** —— 参数会被 `Out-Printer` 抢去绑参并报错，
  更坑的是 PowerShell 的非终止错误会让整条语句**带着 `$null` 继续执行**，
  于是消息全发到 `(0,0)`，现象看着像"相机自己在乱转"。换成 `New-LParam` 之类即可。
- **用真机注入鼠标消息做实验时，物理鼠标的移动会污染结果**：窗口 `SetCapture` 之后，
  真实鼠标的移动同样会被喂进 `grabUpdate`。本项目就踩到了 —— 同一个脚本跑两次，一次
  trace 里"真值姿态"只出现过 2 种（干净），另一次有 72 种（相机正在被人真实地拖）。
  判断方法：数 `[camera] ... raw=(...)` 出现过几种值，只有 home + 一次跳变才算干净；
  不干净就重跑，别拿那些数据下结论。
  （用真实输入做**常规回归**时要主动安排，别撞运气：`realtest.ps1` 先
  `ShowWindow` + `SetWindowPos(HWND_TOP)` + `SetForegroundWindow` 把窗口顶上来，
  再看 `GetForegroundWindow() == hwnd` 是不是成立；不成立就说明输入根本没进这个窗口，
  那一轮的"没反应"不作数。见[第 10 节](#10-已知坑--排查)第一条。）
- **PowerShell 变量名大小写不敏感**：写离线仿真脚本时把轨道半径叫 `$R`、结果数组叫
  `$r`，其实是同一个变量 —— 循环里 `$r = New-Object ...` 会把 `$R` 覆盖成
  ArrayList，于是 `$R * [math]::Cos()` 报"无法把 Object[] 转成 UInt32"，
  看着完全不像变量名的问题。
- **`[regex]'pattern'.Match($s)` 的优先级**：会被解析成
  `[regex](('pattern').Match($s))`，报 `[System.String] 不包含名为 Match 的方法`。
  要写成 `([regex]'pattern').Match($s)`。
- **PowerShell 自定义函数别拿来做向量运算（数组当参数传会出问题）**：写测试脚本时
  `function Sub($a, $b) { @($a[0]-$b[0], ...) }` 再 `Sub $row.raw $homeEye`，里面的
  `$a[0]` 会变成 `Object[]`，报 `[System.Object[]] 不包含名为 op_Subtraction 的方法`。
  改成**传标量**就没事了：`function Dist($ax,$ay,$az,$bx,$by,$bz) { ... }`。
  （上面 `New-LParam` 那个坑是同源的：想省事写个短函数名，结果撞上 PS 自己的规矩。）
- **`--shot` 的基线要按材质分开记**：模型是 `6DCA8E7A...`，三角形 `default` / `metal` /
  `rough` 则是**三个不同的** md5（本机分别是 `4E179041...` / `4B98E32B...` / `56A6C93D...`）。
  换材质测就等于换了基线 —— 只记一句"三角形的 md5 是多少"迟早会自己吓自己一跳。
  （这四个是**加地面网格之后**的数字；之前那组 `AD89128C...` / `ECE937F2...` /
  `62FF8F08...` / `90E4CA7C...` 已经作废，只在跟"地面进来之前"的历史数据对比时有用。）
- **PowerShell 里 `$pid` 是只读的自动变量**（当前进程号）。写"按 PID 找窗口"的测试脚本时
  `$pid = ...` 直接报错；更阴的是它**看着像个普通变量名**，很容易写成
  `GetWindowThreadProcessId($h, [ref]$pid)` 然后一路拿到自己的 PID。换成 `$targetPid`。
- **`Process.MainWindowHandle` 可能给到控制台窗口**：这个 exe 是**控制台子系统**
  （要打 `--verbose`），所以它同时有一个控制台窗口和一个自己的窗口，`Start-Process`
  有时返回前者 —— 现象是"标题变成 exe 路径、发过去的消息石沉大海"。
  可靠的找法是 `EnumWindows` + `GetWindowThreadProcessId` 过滤本进程 + 标题以
  `ModelViewer` 开头。同一个脚本两次跑出来的 window handle 类型不一样，就是这么来的。
- **`--shot` 的 md5 偶尔会抖**（同一模型、同一 preset 跑出两个不同的 md5）：根因是
  窗口刚建好时客户区尺寸和 `createSwapChain()` 时的不一致（`WM_SIZE` 还没派发到），
  swapchain 差几个像素，画面就跟着变。修法是在 `createSwapChain()` **之前**重新
  `GetClientRect()` 一次，让 `gWidth/gHeight` 对齐"此刻真实的客户区"（`main.cpp`
  里那段注释写了完整症状：画面像被平移/挤压、任务栏那边还偶尔矮一截）。
- **隐藏窗口的 `--shot` 配了一道 10 秒看门狗**：个别驱动对"从来不显示的窗口"就是不出帧，
  那时 `--shot` 会**无声地卡死** —— 没有输出、没有窗口，自动化脚本只能靠超时。
  现在等够 10 秒就把窗口显示出来重试，并且往 stderr 打一行说明，把"挂死"变成
  "有输出的失败"。正常机器上一次都不会触发。
- **ImGui 1.92 的 `ImFont` 没有 `FindGlyphNoFallback`**（那个在 `ImFontBaked` 上）：
  想查"这个字在不在字体里"，要用 `ImFont::IsGlyphInFont()` —— 它直接问字体源
  （stb_truetype），**图集建好之前就能用**，正好拿来做缺字自检。
- **ImGui 1.92 的 `imgui_impl_win32.h` 不再声明 `ImGui_ImplWin32_WndProcHandler`**：
  官方 examples 是在自己的 cpp 里 `extern IMGUI_IMPL_API LRESULT ...` 再用的，
  照着抄一遍即可（不然要等链接期才发现）。
- **没有 ImGui context 时调 `ImGui::GetIO()` 是空指针解引用**（Release 下直接崩）。
  `WndProc` 在"窗口建好"和"面板建好"之间就会被调用，所以
  `UiLayer::wantsMouse()` / `wantsKeyboard()` 必须**先判 `mContext != nullptr`**。
- **`ImGui_ImplWin32_NewFrame()` 必须在 `ImGuiHelper::render()` 之前**：后者自己会调
  `ImGui::NewFrame()`（上游就是这么写的）。顺序反了 ImGui 会直接 assert。
- **`ImGuiHelper` 会"接管"你交给它的那个 View**（设正交相机、换 scene、
  `blendMode = TRANSLUCENT`），所以它必须有自己的 `uiView`；渲染顺序也是死的：
  先场景、再 UI，而且 UI 那一次**不能清屏**。
- **缺字是静默的**：ImGui 的"常用 2500 汉字"表**不含**"帧""锥"这种字，缺了就画成 `?`，
  不报错也不警告。所以 `src/ui.cpp` 里带了一份显式的 `kPanelGlyphs`，建完图集再逐字
  自检、缺哪个就按 `U+XXXX` 打到控制台（改面板文案后记得重生成，方法写在那个常量上方）。
- **`uiBlitExternal.mat` 在桌面上编不过**：它用的是 `samplerExternal`（Android 的
  `GL_TEXTURE_EXTERNAL_OES`），matc 直接拒绝 —— 桌面端只用 `uiBlit.mat`。
- **MSVC 的 `sscanf` 会报 C4996**（本项目开着 `/W3`，不留这种噪音）：解析 `--size 1600x900`
  用 `strtol` 手撸两个数就完了，别为它去开 `_CRT_SECURE_NO_WARNINGS`。
- **窗口高度会被系统夹住**：即使窗口是隐藏的（不带 `WS_VISIBLE`），在 1080p 屏上
  `--size 900x1500` 实际只拿到 ~1061 高。想一屏截下整块长面板，得先把上面几组折叠起来。
- **`UiControls` 的默认值就是启动时的渲染状态**：第一帧会整套 apply 一次，之后才只在
  `dirty` 时重新 apply。所以 `src/ui.h` 里的默认值和主代码那套出厂设置必须**逐字一致**
  —— 差一个字，`--shot` 基线立刻漂（这也是面板在 `--shot` 里默认不画的第二个理由）。
- **临时改 `src/ui.h` 的默认值去测画质，一定要改回来**。踩过：一次"画质全关"的测量
  把 `postProcessing / msaa / ssao / bloom / shadows` 五个 `true` 留成了 `false`，
  之后所有 `--shot` 整体变暗（后处理一关，ACES tone mapping 就没了，背景天空盒也跟着
  黑下去）、四个 md5 全变 —— 看起来特别像"ImGui 把渲染搞坏了"。
  **判据**：画面整体变暗 + 天空盒发黑 + 四个 md5 同时变 → 先去看 `src/ui.h` 那五行。
  **教训**：用"和备份比 hash"来确认还原是不够的 —— 如果备份本身就是改动之后做的，
  比出来的"一致"毫无意义（这次就这么被骗了一轮，白量了两组性能）。

### `WM_DROPFILES` 没法跨进程伪造（自动测试用 `F5`）

拖放的**接收**部分一拖就能验证（`--verbose` 下会打 `[drop] 加载 ...`），但想写脚本
**自动**测它就撞墙了：真正干活的 `DragQueryFileW(hdrop, ...)` 要的是 **shell 分配在你这个
进程里**的一块全局内存，而 `GlobalAlloc` 在 Win32 上其实是**每进程一份**的
（所谓"全局堆"就是进程的默认堆）。所以从别的进程
`SendMessage(WM_DROPFILES, 自己伪造的 hdrop)` 必然失败：

```
[dropdbg] 收到 WM_DROPFILES hdrop=0000025DCC510008 n=0 err=6
```

`err=6` 就是 `ERROR_INVALID_HANDLE` —— 消息**到了**、`WndProc` 也**进了**，但那个句柄在
本进程里无效，`DragQueryFileW` 只能返回 0。

绕开的办法就是 `F5`（重新加载当前文件）：它和拖放**共用同一条重载路径**，而
`WM_KEYDOWN` 是能用 `SendMessage` 稳定注入的。"换成另一个文件"这种用例可以这么造：
**启动时先拷一份模型到临时目录 → 用磁盘覆盖那个文件 → 按 `F5`** —— 重载读到的就是新内容。
实测 `[bounds]` 0.947 → **0.500**、相机距离 3.309 → **1.784**，说明相机确实按新包围盒重算了。

> 顺带说一句：伪造时**别自己 `GlobalFree`**。`DragFinish()` 会释放这个句柄
> （真实拖放里那是 shell 的内存，所有权转移给你），两边都放就是双重释放。

