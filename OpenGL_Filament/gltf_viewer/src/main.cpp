// ============================================================================
//  ModelViewer —— 最小 GLB 模型查看器（Filament）
//
//  当前阶段 3（控制面板）：
//    - 默认用 gltfio 加载 .glb（默认 assets/models/DamagedHelmet.glb）
//    - 相机按模型包围盒自动就位（阶段 1-c）；轨道相机 + 阻尼（阶段 1-d / 1-e）
//    - 把 .glb 拖到窗口上、或者按 F5 重新加载当前文件 —— 两条入口共用同一条
//      重载路径（阶段 2，见下面 gDropPath / gReloadPending 和 resetView()）
//    - 地面网格（阶段 2-b）：接太阳阴影的那块板子，见 materials/groundGrid.mat
//    - PBR 管线：IBL + 天空盒 + 太阳 + ACES tone mapping（阶段 1-a/1-b 的成果）
//    - 传 default|metal|rough 时回退到 PBR 三角形（用来隔离渲染问题）
//    - ImGui 控制面板（阶段 3，F1 开关）：画质开关 / 光照 / 地面参数 / 相机 / 调试
//      信息。面板本身在 src/ui.cpp 里画，这里只负责**把面板上的值落到 Filament**
//      （一个 applyControls 搞定，见帧循环前面那段）。
//
//  和官方 samples/gltf_viewer.cpp 的关系：
//    只取它的核心渲染路径，砍掉 FilamentApp / ViewerGui。
//    ImGui 照用官方那套（third_party/imgui + 从 libs/filagui 考来的胶水层），
//    渲染还是全归 Filament —— filagui 只把 ImGui 的 draw list 翻成
//    VertexBuffer / MaterialInstance。
//    材质一律走 createUbershaderProvider（预编译 ubershader），
//    所以**不需要 filamat**，加载是秒开而不是运行时编 shader ——
//    这也是 third_party 里能省掉 197 MB 的 filamat.lib 的前提。
//
//  三角形那条路的来历（阶段 1-a/1-b）：官方 samples/hellotriangle.cpp
//  是刻意做成最小的，必然不像 PBR：
//    unlit 材质 / 没有法线 / 没有光源 / 没有 IBL / 关掉后处理
//  这里全部补齐，具体对照见 README 第 4 节。
// ============================================================================

#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <windowsx.h>   // GET_X_LPARAM / GET_Y_LPARAM / GET_WHEEL_DELTA_WPARAM
#include <shellapi.h>   // DragAcceptFiles / DragQueryFileW / DragFinish（阶段 2 的拖放）

#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <algorithm>
#include <cmath>
#include <fstream>
#include <string>
#include <utility>
#include <vector>

#include <backend/PixelBufferDescriptor.h>

#include <camutils/Manipulator.h>

#include <filament/Box.h>
#include <filament/Engine.h>
#include <filament/Camera.h>
#include <filament/IndexBuffer.h>
#include <filament/IndirectLight.h>
#include <filament/LightManager.h>
#include <filament/Material.h>
#include <filament/MaterialEnums.h>
#include <filament/MaterialInstance.h>
#include <filament/RenderableManager.h>
#include <filament/Renderer.h>
#include <filament/Scene.h>
#include <filament/Skybox.h>
#include <filament/SwapChain.h>
#include <filament/Texture.h>
#include <filament/TransformManager.h>
#include <filament/VertexBuffer.h>
#include <filament/View.h>
#include <filament/Viewport.h>

#include <gltfio/AssetLoader.h>
#include <gltfio/FilamentAsset.h>
#include <gltfio/FilamentInstance.h>
#include <gltfio/MaterialProvider.h>
#include <gltfio/ResourceLoader.h>
#include <gltfio/TextureProvider.h>
#include <gltfio/materials/uberarchive.h>

#include <image/Ktx1Bundle.h>
#include <ktxreader/Ktx1Reader.h>

#include <math/mat4.h>
#include <math/norm.h>
#include <math/quat.h>
#include <math/vec3.h>
#include <math/vec4.h>
#include <utils/EntityManager.h>

// 阶段 3 的控制面板（ImGui + filagui 都在 ui.cpp 里，这里只要 UiControls / UiLayer）
#include "ui.h"

using namespace filament;
using namespace filament::math;
using namespace utils;

namespace {

// 定义在下面"资源路径"那一段（WndProc 里处理 WM_DROPFILES 要用，所以先声明）
std::string narrowUtf8(const wchar_t* wide);

// ---------------------------------------------------------------------------
// 窗口
// ---------------------------------------------------------------------------
bool  gRunning = true;
int   gWidth   = 1280;
int   gHeight  = 720;

// 窗口要不要真的显示出来。--shot 默认置 true（见参数解析处）：
// 截图路径必须挂在**真的原生窗口**上（Filament 的 swapchain 没有离屏后端），
// 但没必要把它弹到屏幕上 —— 一轮回归要跑十几遍，屏幕上就会反复闪模型/三角形。
// 隐藏窗口不影响渲染结果（像素是靠 readPixels 从默认帧缓冲读回来的），
// 所以 --shot 的 md5 基线不受影响。
bool  gWindowHidden = false;

// 轨道相机。ORBIT 模式的 update() 是空实现（camutils **自己**不带阻尼、也没有动画），
// 相机只在收到输入时才动 —— 所以 --shot 仍然是确定性的。
// （"拖拽带一点惯性和迟滞"是我们在外面又加的一层显示层平滑，见主循环前面那段注释；
//   它不改变上面这条性质。）
camutils::Manipulator<float>* gManipulator = nullptr;
bool gDragging = false;   // 是否正在拖拽（决定要不要把 WM_MOUSEMOVE 喂给相机）

// ---------------------------------------------------------------------------
// 轨道中心（pivot）的影子副本
//
// OrbitManipulator 把真正的 mPivot 藏在 private 里（camutils/Bookmark.h 那几个
// 参数的字段都只对 manipulator 自己是 friend），外面读不到。好在它对 pivot 的
// **行为是确定的**，照着复刻一份就行：
//
//   * 右键平移：mPivot 和 mEye / mTarget **三者同步平移**（OrbitManipulator.h:104-105），
//     位移量完全一样。所以平移期间把 eye 的位移量加到 pivot 上，和它内部那份精确相等；
//   * 左键旋转：绕 pivot 转，pivot 原地不动；
//   * 滚轮推拉：只有 eye 沿视线走（OrbitManipulator.h:117-119），pivot 不动；
//   * R 键 jumpToBookmark() 会把 mPivot 拉回 props.targetPosition（=模型包围盒中心）。
//
// ★ 这份影子不是锦上添花，是**必需的**：
//   下面那段阻尼插值的是"轨道参数"（方位角 / 仰角 / 距离），它需要一个原点。
//   原点如果写死成模型中心，那么一旦右键平移过，阻尼就会继续绕**旧的**模型中心
//   插值 —— 半径和朝向全错，相机就会从模型里穿过去。这正是"右键拖一下、再左右拖
//   就穿模"的根因（实测：平移 120px 后甩 200px，到*真 pivot* 的半径从 3.309
//   被削到 3.166，平移量越大偏得越狠）。
float3 gTrackedPivot = float3{ 0.0f, 0.0f, 0.0f };   // 当前轨道中心
float3 gPanPivot0    = float3{ 0.0f, 0.0f, 0.0f };   // 右键按下去那一刻的轨道中心
float3 gPanEye0      = float3{ 0.0f, 0.0f, 0.0f };   // 右键按下去那一刻的 eye
bool   gPanning      = false;                        // 右键平移进行中
bool   gPivotReset   = false;                        // R 复位：把轨道中心退回模型中心

// ---------------------------------------------------------------------------
// 拖放加载（阶段 2）
//
// WM_DROPFILES 是在消息泵里来的，而"换内容"要拆 GPU 资源（destroyModel、
// destroy 各种 buffer / 材质）。在 WndProc 里干这个风险太大：消息可以嵌套、
// 可以重入，而且此刻帧循环的相机状态正处在中间态。
//
// 所以 WndProc 只把路径抄下来，真正的加载放在帧循环开头、消息泵之后做 ——
// 那时候上一帧已经完整渲染完，状态是干净的。
// ---------------------------------------------------------------------------
std::string gDropPath;              // 最近一次拖进来的文件（UTF-8）
bool        gDropPending = false;   // 有待处理的拖放

// F5 = 重新加载当前文件。模型查看器的标准"我改完模型了，重看一眼"键：
// Blender 里导出覆盖同一个 .glb，切回来按 F5 就行，不用重启进程。
// 走的重载路径和拖放完全是同一条，只是文件路径用当前这个。
bool        gReloadPending = false; 

// 加载完那一刻的取景，R 键用它复位。
// 不能改用 Manipulator::getHomeBookmark()：那个是把 phi/theta 硬编码成 0 的
// （OrbitManipulator.h:159-160），复位后镜头会跑到 +Z 正前方，把 3/4 视角丢掉。
camutils::Bookmark<float> gHomeBookmark{};

// ---------------------------------------------------------------------------
// 控制面板（阶段 3）
//
// WndProc 是自由函数，够不到 main() 里的局部量，所以这两个用全局指针转一下：
//   * gUi     —— ImGui 层：转发消息、查 WantCapture*
//   * gUiCtl  —— 面板上的旋钮：F1 要能直接翻 showPanel
// main() 建好后就不再变，退出前才置空。
// ---------------------------------------------------------------------------
ui::UiLayer* gUi    = nullptr;
UiControls*  gUiCtl = nullptr;

LRESULT CALLBACK WndProc(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    // ---- 先把消息喂给 ImGui（官方 Win32 输入后端）----
    // 它只填 ImGuiIO，**不画东西**（渲染还是 filagui 干的）。下面的分支再按
    // WantCapture* 决定"这条消息要不要同时交给相机 / 快捷键"：
    // 鼠标落在面板上时不该转相机，正在拖滑块时也不该触发 R / F5。
    // 用上一帧的标志是 ImGui 的规矩 —— io.WantCapture* 是在 NewFrame 里更新的。
    // 官方 FilamentApp2.cpp:509-546 就是这个套路。
    const bool uiWantsMouse = gUi != nullptr && gUi->wantsMouse();
    const bool uiWantsKeys  = gUi != nullptr && gUi->wantsKeyboard();
    if (gUi != nullptr) {
        gUi->feedMessage(hwnd, msg, wParam, lParam);
    }

    switch (msg) {
    case WM_SIZE: {
        const int w = LOWORD(lParam);
        const int h = HIWORD(lParam);
        gWidth  = w > 0 ? w : 1;
        gHeight = h > 0 ? h : 1;
        if (gManipulator) {
            gManipulator->setViewport(gWidth, gHeight);
        }
        return 0;
    }
    case WM_KEYDOWN:
        if (wParam == VK_ESCAPE) {
            // 退出：不管面板要不要键盘都认，免得面板抢焦时"按了没反应"
            gRunning = false;
        } else if (wParam == VK_F1 && gUiCtl != nullptr) {
            // 面板显隐。★ 不能做成面板上的按钮：面板藏起来之后就点不到它了。
            gUiCtl->showPanel = !gUiCtl->showPanel;
        } else if (!uiWantsKeys && wParam == 'R' && gManipulator) {
            // 视角复位：回到刚加载完那个按包围盒算出来的取景。
            // 用我们自己存的那份，见 gHomeBookmark 的注释。
            gManipulator->jumpToBookmark(gHomeBookmark);
            // jumpToBookmark() 会把 mPivot 一起拉回 targetPosition（=模型中心），
            // 影子 pivot 也得跟着回去，否则阻尼会绕一个已经不存在的位置插值。
            gPivotReset = true;
        } else if (!uiWantsKeys && wParam == VK_F5) {
            // 重新加载当前文件（和拖放共用同一条重载路径，见 gReloadPending）
            gReloadPending = true;
        }
        return 0;
    case WM_CLOSE:
        gRunning = false;   // 真正的 DestroyWindow 留到清理那一步
        return 0;
    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;

    // ---- 鼠标 → camutils::Manipulator ----
    // 键位照官方 FilamentApp2.cpp:1086-1108：
    //   左键 = 绕 targetPosition 旋转
    //   右键 = 平移（官方那个 strafe 参数写的是 button == 3）
    //   滚轮 = 推拉
    case WM_LBUTTONDOWN:
    case WM_RBUTTONDOWN:
        if (gManipulator && !uiWantsMouse) {
            gManipulator->grabBegin(GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam),
                    /* strafe = */ msg == WM_RBUTTONDOWN);
            gDragging = true;
            // 捕获鼠标：拖到窗口外面也能继续拖，直到松开按键。
            // ★ 这一句会让 Windows 紧接着给本窗口**自己**发一条 WM_CAPTURECHANGED
            //   （按下鼠标时那份"隐式捕获"被释放又重新获取），见下面那条 case ——
            //   那里专门把它认出来放行，否则拖拽刚开始就会被自己收尾。
            //   ImGui 官方 Win32 后端在同一个消息里也会 SetCapture（imgui_impl_win32.cpp:696），
            //   所以这里其实是第二次；多问一句 GetCapture() 也躲不掉那条通知，
            //   干脆就按"自己发的通知要放行"来处理。
            SetCapture(hwnd);
            // 右键 = 平移。平移期间 mPivot 跟着 mEye 一起走，所以要记下起点，
            // 帧循环里才能把影子 pivot 同步搬过去（见 gTrackedPivot 的注释）。
            // grabBegin() 只记录状态、不动姿态，所以这里读到的 eye 就是平移起点。
            if (msg == WM_RBUTTONDOWN) {
                float3 e, t, u;
                gManipulator->getLookAt(&e, &t, &u);
                gPanPivot0 = gTrackedPivot;
                gPanEye0   = e;
                gPanning   = true;
            }
        }
        return 0;

    case WM_MOUSEMOVE:
        if (gManipulator && gDragging) {
            // 拖拽中途鼠标滑到面板上方也继续跟着走 —— gDragging 是按下时定下的，
            // 这里不再看 uiWantsMouse（否则"从模型上开始拖、拖过面板"会被中途截断）
            gManipulator->grabUpdate(GET_X_LPARAM(lParam), GET_Y_LPARAM(lParam));
        }
        return 0;

    case WM_LBUTTONUP:
    case WM_RBUTTONUP:
        if (gManipulator && gDragging) {
            gManipulator->grabEnd();
            gDragging = false;
            gPanning  = false;
            ReleaseCapture();
        }
        return 0;

    case WM_CAPTURECHANGED:
        // ★ 这是本工程最阴的一个坑（实测日志见 WM_LBUTTONDOWN 里 SetCapture 那段）：
        //   按下鼠标时系统已经给了本窗口一个"隐式捕获"，此时再 SetCapture(hwnd) 同一个
        //   窗口，Windows 会**先释放再重新获取**，然后给本窗口自己发一条
        //   WM_CAPTURECHANGED —— 实测 lParam 就是本 hwnd（lParam 按规矩是"拿到捕获的
        //   那个窗口"，这里就是自己）。
        //   那条通知不是"捕获被别人抢走"。要是当成拖拽结束，拖拽就会在按下的那一瞬间
        //   被自己收尾，用户看到的现象是**鼠标拖拽完全没反应**。
        //   （合成消息测不出来：SendMessage 不产生隐式捕获，所以以前一直没暴露。）
        if (reinterpret_cast<HWND>(lParam) == hwnd) {
            return 0;
        }
        // 真的被抢走捕获（Alt+Tab / 别的进程抢捕获）时要收尾，否则会一直卡在"拖拽中"。
        // （另外在松开按键时系统也会来一条 lParam == 0 的："捕获没了，也没给别人"。
        //   那条会走到这里把拖拽收尾 —— 无害，紧接着就是 WM_*BUTTONUP。）
        if (gManipulator && gDragging) {
            gManipulator->grabEnd();
            gDragging = false;
            gPanning  = false;
        }
        return 0;

    case WM_MOUSEWHEEL:
        if (gManipulator && !uiWantsMouse) {
            // 往前滚 GET_WHEEL_DELTA_WPARAM 是 +120。Manipulator.h 的约定是
            // "负数 = 拉近"，所以取反 —— 往前滚就是靠近模型。
            // ORBIT 模式的 scroll() 只用到第三个参数，x/y 传 0 就行
            //（官方也是 scroll(0, 0, x)）。
            const float notches =
                    static_cast<float>(GET_WHEEL_DELTA_WPARAM(wParam)) / WHEEL_DELTA;
            gManipulator->scroll(0, 0, -notches);
        }
        return 0;

    // ---- 拖放：把一个 .glb 拖到窗口上就加载它（阶段 2）----
    // 前提是 main() 里调过 DragAcceptFiles(hwnd, TRUE)，否则系统根本不发这条消息。
    case WM_DROPFILES: {
        HDROP drop = reinterpret_cast<HDROP>(wParam);
        wchar_t path[MAX_PATH] = {};
        // 第二个参数给 0 就是"取第 0 个文件"；返回的是写进去的字符数。
        const UINT n = DragQueryFileW(drop, 0, path, MAX_PATH);
        DragFinish(drop);            // 无论成败都要释放，否则泄的是 shell 的内存
        if (n > 0 && n < MAX_PATH && path[0] != L'\0') {
            gDropPath    = narrowUtf8(path);   // 宽字符 -> UTF-8，gltfio 要的是 UTF-8
            gDropPending = true;
        } else {
            // 只会出现在"自己给自己发 WM_DROPFILES"这类非正常场景：
            // HDROP 是 shell 分配在本进程里的，别人伪造的句柄在这儿是无效的。
            std::fprintf(stderr, "[drop] 拖放里没读到文件名（n=%u），忽略\n", n);
            std::fflush(stderr);
        }
        SetForegroundWindow(hwnd);   // 拖完把焦点还给窗口，免得之后 R / ESC 收不到
        return 0;
    }

    case WM_CONTEXTMENU:
        // 右键是用来平移的，别弹上下文菜单
        return 0;
    }
    // ★ 必须是 W 版！窗口类是用 RegisterClassExW 注册的（Unicode 窗口），
    //   而 UNICODE 宏没定义，裸写 DefWindowProc 会展开成 DefWindowProcA。
    //   DefWindowProcA 处理 WM_NCCREATE 时会把 CREATESTRUCTW::lpszName 这个
    //   UTF-16 指针当 ANSI 字符串读，"M\0o\0d\0..." 到第一个 0 就断，
    //   窗口标题于是只剩 "M"。这个 bug 藏得很深：标题栏看着没错，
    //   但 GetWindowTextLengthW 返回 1，任务栏和 Alt+Tab 显示的都是 "M"。
    return DefWindowProcW(hwnd, msg, wParam, lParam);
}

HWND createWindow(HINSTANCE hInstance, const wchar_t* title) {
    WNDCLASSEXW wc = {};
    wc.cbSize        = sizeof(wc);
    wc.style         = CS_HREDRAW | CS_VREDRAW | CS_OWNDC;
    wc.lpfnWndProc   = WndProc;
    wc.hInstance     = hInstance;
    wc.hCursor       = LoadCursor(nullptr, IDC_ARROW);
    wc.lpszClassName = L"ModelViewerWndClass";
    RegisterClassExW(&wc);

    RECT r = { 0, 0, gWidth, gHeight };
    AdjustWindowRect(&r, WS_OVERLAPPEDWINDOW, FALSE);

    return CreateWindowExW(0, L"ModelViewerWndClass", title,
            WS_OVERLAPPEDWINDOW | (gWindowHidden ? 0 : WS_VISIBLE),
            CW_USEDEFAULT, CW_USEDEFAULT,
            r.right - r.left, r.bottom - r.top,
            nullptr, nullptr, hInstance, nullptr);
}

// UTF-8 -> UTF-16。命令行参数是 UTF-8 字节（main 的 argv），
// 而窗口标题要宽的，中文文件名得真转一次，不能按字节硬塞。
std::wstring widenUtf8(const char* utf8) {
    if (utf8 == nullptr || *utf8 == '\0') {
        return {};
    }
    const int n = MultiByteToWideChar(CP_UTF8, 0, utf8, -1, nullptr, 0);
    if (n <= 1) {
        return {};
    }
    std::wstring out(static_cast<size_t>(n - 1), L'\0');
    MultiByteToWideChar(CP_UTF8, 0, utf8, -1, out.data(), n);
    return out;
}

// UTF-16 -> UTF-8。拖放拿到的是**宽字符**路径（DragQueryFileW），而 gltfio 和
// 我们自己的 readFile() 吃的都是 UTF-8 字节，所以得倒着转一次。
std::string narrowUtf8(const wchar_t* wide) {
    if (wide == nullptr || *wide == L'\0') {
        return {};
    }
    const int n = WideCharToMultiByte(CP_UTF8, 0, wide, -1, nullptr, 0, nullptr, nullptr);
    if (n <= 1) {
        return {};
    }
    std::string out(static_cast<size_t>(n - 1), '\0');
    WideCharToMultiByte(CP_UTF8, 0, wide, -1, out.data(), n, nullptr, nullptr);
    return out;
}

// 只取路径最后的文件名部分（窗口标题用，别把整条路径塞进标题栏）
const char* baseNameOf(const char* path) {
    const char* base = path;
    for (const char* p = path; *p; ++p) {
        if (*p == '\\' || *p == '/') {
            base = p + 1;
        }
    }
    return base;
}

// 窗口标题
std::wstring windowTitle(bool triangleMode, const std::string& path) {
    if (triangleMode) {
        return L"ModelViewer - PBR Triangle";
    }
    return std::wstring(L"ModelViewer - ") + widenUtf8(baseNameOf(path.c_str()));
}

// ---------------------------------------------------------------------------
// 资源路径
//
// 优先用当前工作目录；如果在那儿找不到材质，就切到 exe 所在目录。
// 这样不管是从工程根目录启动、还是双击 exe、还是从别处启动都能跑起来。
// ---------------------------------------------------------------------------
void ensureAssetRoot() {
    if (std::ifstream("materials/litTriangle.filamat", std::ios::binary)) {
        return;
    }
    wchar_t buf[MAX_PATH] = {};
    const DWORD n = GetModuleFileNameW(nullptr, buf, MAX_PATH);
    if (n == 0 || n >= MAX_PATH) {
        return;
    }
    const std::wstring exe(buf, n);
    const size_t pos = exe.find_last_of(L"\\/");
    if (pos == std::wstring::npos) {
        return;
    }
    SetCurrentDirectoryW(exe.substr(0, pos).c_str());
}

// ---------------------------------------------------------------------------
// 计时（用来定位关闭时到底慢在哪一步）
// ---------------------------------------------------------------------------
static double nowMs() {
    static const double invFreq = [] {
        LARGE_INTEGER f;
        QueryPerformanceFrequency(&f);
        return 1.0 / static_cast<double>(f.QuadPart);
    }();
    static const long long t0 = [] {
        LARGE_INTEGER c;
        QueryPerformanceCounter(&c);
        return c.QuadPart;
    }();
    LARGE_INTEGER c;
    QueryPerformanceCounter(&c);
    return 1000.0 * static_cast<double>(c.QuadPart - t0) * invFreq;
}

class Stopwatch {
public:
    Stopwatch() {
        QueryPerformanceFrequency(&mFreq);
        QueryPerformanceCounter(&mStart);
    }
    double ms() const {
        LARGE_INTEGER now;
        QueryPerformanceCounter(&now);
        return 1000.0 * static_cast<double>(now.QuadPart - mStart.QuadPart)
                / static_cast<double>(mFreq.QuadPart);
    }
private:
    LARGE_INTEGER mFreq{};
    LARGE_INTEGER mStart{};
};

// ---------------------------------------------------------------------------
// 工具
// ---------------------------------------------------------------------------
std::vector<uint8_t> readFile(const char* path) {
    std::ifstream f(path, std::ios::binary | std::ios::ate);
    if (!f) {
        return {};
    }
    const auto size = static_cast<size_t>(f.tellg());
    std::vector<uint8_t> buf(size);
    f.seekg(0);
    f.read(reinterpret_cast<char*>(buf.data()), static_cast<std::streamsize>(size));
    return buf;
}

// ---------------------------------------------------------------------------
// 环境光照（IBL + 天空盒）
//
// 抄自 libs/filamentapp/src/IBL.cpp 的 loadFromKtx()，去掉 AssetLoader 依赖，
// 直接用 std::ifstream 读文件。三步：
//    1. 读 *_ibl.ktx  /  *_skybox.ktx
//    2. Ktx1Reader::createTexture 上传成 Filament Texture
//    3. IndirectLight（反射 + 球谐辐照度） + Skybox
//
// intensity 用 30000 是 filamentapp 里的常量 IBL_INTENSITY。
// ---------------------------------------------------------------------------
struct Environment {
    std::vector<uint8_t> bytesIbl;      // 保活：Ktx1Bundle 可能引用这段内存
    std::vector<uint8_t> bytesSky;
    Texture*       iblTexture    = nullptr;
    Texture*       skyTexture    = nullptr;
    IndirectLight* indirectLight = nullptr;
    Skybox*        skybox        = nullptr;
    float3         sh[9]         = {};
    bool           hasSh         = false;
};

bool loadEnvironment(Engine* engine, const char* prefix, Environment& env) {
    // ---- IBL 贴图 ----
    env.bytesIbl = readFile((std::string(prefix) + "_ibl.ktx").c_str());
    if (env.bytesIbl.empty()) {
        std::fprintf(stderr, "[warn] 读不到 %s_ibl.ktx\n", prefix);
        return false;
    }
    auto* iblBundle = new image::Ktx1Bundle(env.bytesIbl.data(),
            static_cast<uint32_t>(env.bytesIbl.size()));

    // 球谐系数必须在 createTexture 之前取，因为 createTexture 会接管并销毁 bundle
    env.hasSh = iblBundle->getSphericalHarmonics(env.sh);

    env.iblTexture = ktxreader::Ktx1Reader::createTexture(engine, iblBundle, false);

    // ---- 天空盒贴图 ----
    env.bytesSky = readFile((std::string(prefix) + "_skybox.ktx").c_str());
    if (env.bytesSky.empty()) {
        std::fprintf(stderr, "[warn] 读不到 %s_skybox.ktx\n", prefix);
        return false;
    }
    auto* skyBundle = new image::Ktx1Bundle(env.bytesSky.data(),
            static_cast<uint32_t>(env.bytesSky.size()));
    env.skyTexture = ktxreader::Ktx1Reader::createTexture(engine, skyBundle, false);

    // ---- IndirectLight ----
    // reflections: 镜面反射用的 mipmapped cubemap
    // irradiance : 漫反射用的球谐（3 阶 = 9 个系数），比只给 cubemap 质量好
    IndirectLight::Builder iblBuilder = IndirectLight::Builder()
            .reflections(env.iblTexture)
            .intensity(30000.0f);
    if (env.hasSh) {
        iblBuilder.irradiance(3, env.sh);
    }
    env.indirectLight = iblBuilder.build(*engine);

    // ---- Skybox ----
    // showSun(true) 会在天上画个太阳圆盘（只有场景里有 SUN 光源时才可见）
    env.skybox = Skybox::Builder()
            .environment(env.skyTexture)
            .showSun(true)
            .build(*engine);

    return true;
}

void destroyEnvironment(Engine* engine, Environment& env) {
    engine->destroy(env.indirectLight);
    engine->destroy(env.skybox);
    engine->destroy(env.iblTexture);
    engine->destroy(env.skyTexture);
    env.indirectLight = nullptr;
    env.skybox        = nullptr;
    env.iblTexture    = nullptr;
    env.skyTexture    = nullptr;
}

// ---------------------------------------------------------------------------
// glTF 模型（gltfio）
//
// 官方 samples/gltf_viewer.cpp 的最小等价物：只留加载 + 渲染，
// 砍掉 FilamentApp / ViewerGui / 那些面板。
//
// 三步（照 AssetLoader.h 顶部注释里的官方用法）：
//    1. createUbershaderProvider + AssetLoader::create + createAsset(bytes)
//    2. ResourceLoader 注册贴图解码器 + loadResources(asset)
//    3. scene->addEntities(asset->getEntities(), asset->getEntityCount())
//
// 为什么只能用 ubershader：另一条路 createJitShaderProvider 要 filamat 在
// **运行时**编 shader（首次加载慢 1~2 秒），而 filamat.lib 有 197 MB，
// 我们没链它。ubershader 是预编译好的，秒开，代价是渲染时多一点分支。
// 这也是 third_party 能砍掉 197 MB 的前提，两条路是绑在一起的。
//
// 生命周期（照抄 gltf_viewer.cpp:913-950 的 cleanup()）：
//    destroyAsset -> destroyMaterials -> delete materials
//    -> delete resourceLoader -> delete 贴图解码器 -> AssetLoader::destroy
// 顺序不能乱：asset 用着 materials 建的材质，解码器又被 resourceLoader 用着。
// ---------------------------------------------------------------------------
struct Model {
    gltfio::AssetLoader*      assetLoader    = nullptr;
    gltfio::MaterialProvider* materials      = nullptr;
    gltfio::ResourceLoader*   resourceLoader = nullptr;
    gltfio::TextureProvider*  stbDecoder     = nullptr;   // image/png + image/jpeg
    gltfio::TextureProvider*  ktxDecoder     = nullptr;   // image/ktx2
    gltfio::FilamentAsset*    asset          = nullptr;
    Aabb                      bounds         = {};        // 模型空间包围盒
    bool                      ready          = false;
};

// 只负责拆，任何一步失败都能安全地部分调用
void destroyModel(Scene* scene, Model& m) {
    if (scene && m.asset) {
        // 官方 AssetLoader.h 示例的顺序：先把实体移出场景，再销毁 asset
        scene->removeEntities(m.asset->getEntities(), m.asset->getEntityCount());
    }
    if (m.assetLoader && m.asset) {
        m.assetLoader->destroyAsset(m.asset);   // 实体/组件/顶点缓冲/贴图
    }
    if (m.materials) {
        m.materials->destroyMaterials();        // ★ 不会自动调用，必须显式
    }
    delete m.materials;      m.materials      = nullptr;
    delete m.resourceLoader; m.resourceLoader = nullptr;
    delete m.stbDecoder;     m.stbDecoder     = nullptr;
    delete m.ktxDecoder;     m.ktxDecoder     = nullptr;
    if (m.assetLoader) {
        gltfio::AssetLoader::destroy(&m.assetLoader);
    }
    m.asset = nullptr;
    m.ready = false;
}

bool loadModel(Engine* engine, Scene* scene, const char* path, Model& m) {
    std::vector<uint8_t> bytes = readFile(path);
    if (bytes.empty()) {
        std::fprintf(stderr, "[fatal] 读不到模型 %s\n", path);
        return false;
    }

    // ---- 1. ubershader 材质提供者 + AssetLoader ----
    m.materials = gltfio::createUbershaderProvider(engine,
            UBERARCHIVE_DEFAULT_DATA, UBERARCHIVE_DEFAULT_SIZE);
    if (!m.materials) {
        std::fprintf(stderr, "[fatal] createUbershaderProvider 失败\n");
        return false;
    }

    gltfio::AssetConfiguration config = {};
    config.engine    = engine;
    config.materials = m.materials;
    // names 留空：不建 NameComponentManager，我们用不到节点名

    m.assetLoader = gltfio::AssetLoader::create(config);
    if (!m.assetLoader) {
        std::fprintf(stderr, "[fatal] AssetLoader::create 失败\n");
        destroyModel(nullptr, m);
        return false;
    }

    m.asset = m.assetLoader->createAsset(bytes.data(),
            static_cast<uint32_t>(bytes.size()));
    if (!m.asset) {
        std::fprintf(stderr, "[fatal] 解析失败（不是合法的 glTF/GLB？）: %s\n", path);
        destroyModel(nullptr, m);
        return false;
    }
    // 源码字节 AssetLoader 已经解析完了，可以放掉
    bytes.clear();
    bytes.shrink_to_fit();

    // ---- 2. 资源加载（几何 + 贴图）----
    gltfio::ResourceConfiguration resConfig = {};
    resConfig.engine = engine;
    resConfig.normalizeSkinningWeights = true;   // 畸形蒙皮权重也兜住
    // 注意：resConfig.gltfPath 在 1.77 已经标了 UTILS_DEPRECATED，且我们只加载
    // 自包含的 .glb（没有外部 .bin / 贴图 URI 要靠它解析），所以不设它 ——
    // 顺带避免 C4996 弃用警告。

    m.resourceLoader = new gltfio::ResourceLoader(resConfig);
    m.stbDecoder     = gltfio::createStbProvider(engine);
    m.ktxDecoder     = gltfio::createKtx2Provider(engine);
    m.resourceLoader->addTextureProvider("image/png",  m.stbDecoder);
    m.resourceLoader->addTextureProvider("image/jpeg", m.stbDecoder);
    m.resourceLoader->addTextureProvider("image/ktx2", m.ktxDecoder);

    // loadResources 在 1.77 是**同步**的，阻塞到贴图解码完成为止。
    // 官方 Viewer 用 asyncBeginLoad + 每帧 asyncUpdateLoad 是为了加载时还能
    // 显示进度条；我们只加载一个模型，同步反而让后面的代码简单得多 ——
    // 不需要轮询、也不存在"还没加载完就渲染"的中间态。
    if (!m.resourceLoader->loadResources(m.asset)) {
        std::fprintf(stderr, "[fatal] loadResources 失败（贴图/缓冲解码出错）\n");
        destroyModel(nullptr, m);
        return false;
    }

    // ---- 包围盒（相机拟合用）----
    // ★ 必须排在 releaseSourceData() **前面**！
    //   recomputeBoundingBoxes() 要真去读 cgltf 里的顶点数据，而
    //   releaseSourceData() 干的正是把那份源码数据释放掉。顺序反了 Filament
    //   会直接抛 Precondition 并终止进程（错误信息：Do not call
    //   releaseSourceData before recomputeBoundingBoxes）。
    //   官方 gltf_viewer.cpp:573-577 也是这个相对顺序。
    //
    //   getBoundingBox()（asset 级）只反映 glTF accessor 里写的 min/max；
    //   recomputeBoundingBoxes()（instance 级）才是把顶点读一遍算出来的，
    //   节点变换也含在内。拟合相机要用后者。
    if (gltfio::FilamentInstance* instance = m.asset->getInstance()) {
        instance->recomputeBoundingBoxes();
        m.bounds = instance->getBoundingBox();
    }

    // 顶点/贴图已经上 GPU，现在可以释放 CPU 侧的 glTF 源码数据了
    m.asset->releaseSourceData();

    // ---- 3. 进场景 ----
    scene->addEntities(m.asset->getEntities(), m.asset->getEntityCount());

    // ---- 3b. 阴影：glTF 的 renderable 默认 castShadows = false ----
    // RenderableManager.h:388 原话 "Controls if this renderable casts shadows,
    // false by default" —— 所以光开 View 的阴影总开关没用，得每个可绘制对象
    // 显式打开，否则阴影贴图里是空的，画面上一点影子都没有。
    // receiveShadows 默认是 true（同文件 :399），写出来只为自明。
    {
        RenderableManager& rm = engine->getRenderableManager();
        const Entity* renderables = m.asset->getRenderableEntities();
        const size_t  count       = m.asset->getRenderableEntityCount();
        for (size_t i = 0; i < count; ++i) {
            RenderableManager::Instance inst = rm.getInstance(renderables[i]);
            rm.setCastShadows(inst, true);
            rm.setReceiveShadows(inst, true);
        }
    }

    if (m.bounds.isEmpty()) {
        // 兜底：给个 1 单位立方体，别让相机跑到无穷远
        m.bounds = Aabb{ float3{ -0.5f }, float3{ 0.5f } };
        std::fprintf(stderr, "[warn] 模型包围盒为空，用默认 1 单位立方体兜底\n");
    }

    m.ready = true;
    return true;
}

// 加载成功后打的那几行（启动和拖放加载共用，方便核对日志）
void printLoaded(const std::string& path, const Model& m) {
    if (!m.ready || !m.asset) {
        return;
    }
    const float3 mn = m.bounds.min;      // Aabb 直接暴露 min/max（getMin 是 Box 的）
    const float3 mx = m.bounds.max;
    std::printf(" [model]    %s\n", path.c_str());
    std::printf(" [stats]    entity=%zu  renderable=%zu  (glTF 层级节点数 / 可绘制数)\n",
            m.asset->getEntityCount(), m.asset->getRenderableEntityCount());
    std::printf(" [bounds]   min=(%.3f %.3f %.3f)  max=(%.3f %.3f %.3f)\n",
            mn.x, mn.y, mn.z, mx.x, mx.y, mx.z);
    std::fflush(stdout);
}

// ---------------------------------------------------------------------------
// 地面（阶段 2）
//
// 一块 1x1 的平板：局部坐标 xz ∈ [-0.5, 0.5]、y = 0、法线朝上。
// 换内容时只改两样东西：
//   * TransformManager 的变换（缩放到内容大小 + 平移到内容脚下）
//   * 材质实例里那些**世界尺度**参数（格距 / 淡出半径）
// 几何和 renderable 都**不重建** —— 拖放换模型时地面几乎零成本。
//
// 网格线、底色、淡出全在 materials/groundGrid.mat 里，这里只管摆位置。
// ---------------------------------------------------------------------------
struct Ground {
    Entity            entity   = {};
    Material*         material = nullptr;
    MaterialInstance* mi       = nullptr;
    VertexBuffer*     vb       = nullptr;
    IndexBuffer*      ib       = nullptr;
    bool              ready    = false;
};

// Filament **没有独立的 normal 属性**：法线是打包进 TANGENTS 的四元数
// （和上面的三角形完全一样：quatf::fromDirectedRotation({0,0,1}, n) -> packSnorm16）。
// 地面的法线全是 +Y，所以四个顶点共用同一个四元数。
struct GroundVertex {
    float3 position;    // offset  0  FLOAT3
    short4 tangents;    // offset 12  SHORT4 normalized（法线四元数）
};
static_assert(sizeof(GroundVertex) == 20, "布局和 attribute offset 必须一致");

// 地面边长 = 包围球半径 × 这个系数。
// ⚠ 相机远平面必须知道这个数（见帧循环里的 camFar），否则地面会被远平面横切一刀。
constexpr float kGroundSideFactor = 6.0f;

// 绕序必须让**朝上**那一面算正面（材质里是 culling : back）：
// 判定法 (b-a) × (c-a) 要指向 +y。反了的话地面从上面看会整块消失。
const uint16_t GROUND_INDICES[6] = { 0, 2, 1,  0, 3, 2 };

// 地面法线（+Y）打包成 Filament 的 TANGENTS 四元数。
// 和三角形的 makeVertex() 里那两行完全一样：从 +Z 转到目标法线。
short4 makeGroundTangents() {
    const quatf q = quatf::fromDirectedRotation(float3{ 0.0f, 0.0f, 1.0f },
                                                float3{ 0.0f, 1.0f, 0.0f });
    return packSnorm16(float4{ q.x, q.y, q.z, q.w });
}

bool createGround(Engine* engine, Scene* scene, Ground& g) {
    const std::vector<uint8_t> matData = readFile("materials/groundGrid.filamat");
    if (matData.empty()) {
        std::fprintf(stderr, "[警告] 读不到 materials/groundGrid.filamat，这一轮不画地面\n");
        return false;
    }

    g.material = Material::Builder()
            .package(matData.data(), matData.size())
            .build(*engine);
    g.mi = g.material->createInstance();

    // ★ 顶点数据必须比这条语句活得久。
    //   BufferDescriptor 的第三个参数（释放回调）传的是 nullptr —— 意思是
    //   "这块内存不归你管"，那就得由我们保证它活到 GPU 真的把数据拷走那一刻。
    //   之前写成局部数组，函数一返回就没了，地面于是变成一堵歪墙 / 干脆消失。
    //   三角形那边用的是全局 const 数组（TRIANGLE_VERTICES），所以一直没这个毛病。
    static const GroundVertex verts[4] = {
        { float3{ -0.5f, 0.0f, -0.5f }, makeGroundTangents() },
        { float3{  0.5f, 0.0f, -0.5f }, makeGroundTangents() },
        { float3{  0.5f, 0.0f,  0.5f }, makeGroundTangents() },
        { float3{ -0.5f, 0.0f,  0.5f }, makeGroundTangents() },
    };

    g.vb = VertexBuffer::Builder()
            .vertexCount(4)
            .bufferCount(1)
            .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT3,  0, sizeof(GroundVertex))
            .attribute(VertexAttribute::TANGENTS, 0, VertexBuffer::AttributeType::SHORT4, 12, sizeof(GroundVertex))
            .normalized(VertexAttribute::TANGENTS)
            .build(*engine);
    g.vb->setBufferAt(*engine, 0,
            VertexBuffer::BufferDescriptor(verts, sizeof(verts), nullptr));

    g.ib = IndexBuffer::Builder()
            .indexCount(6)
            .bufferType(IndexBuffer::IndexType::USHORT)
            .build(*engine);
    g.ib->setBuffer(*engine,
            IndexBuffer::BufferDescriptor(GROUND_INDICES, sizeof(GROUND_INDICES), nullptr));

    g.entity = EntityManager::get().create();
    RenderableManager::Builder(1)
            .boundingBox({ { -0.5f, 0.0f, -0.5f }, { 0.5f, 0.0f, 0.5f } })
            .material(0, g.mi)
            .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, g.vb, g.ib, 0, 6)
            .receiveShadows(true)   // ★ 地面存在的理由就是这个
            .castShadows(false)     // 自己不投阴影，也别把阴影贴图的包围盒撑大
            .build(*engine, g.entity);
    scene->addEntity(g.entity);

    // 之后靠 setTransform 摆位置（变换组件不会自己出现）
    TransformManager& tcm = engine->getTransformManager();
    tcm.create(g.entity);

    g.ready = true;
    return true;
}

void destroyGround(Engine* engine, Scene* scene, Ground& g) {
    if (scene && g.entity) {
        scene->remove(g.entity);
    }
    if (engine && g.entity) {
        engine->destroy(g.entity);      // 连变换组件一起
    }
    if (engine) {
        engine->destroy(g.mi);
        engine->destroy(g.material);
        engine->destroy(g.vb);
        engine->destroy(g.ib);
    }
    g = Ground{};
}

// 地面材质参数（面板上"地面网格"那一栏调的就是这几个）。
// placeGround() 和面板的"脏值应用"共用这一份 —— 分两处写迟早会不一致。
// ⚠ 默认值必须和阶段 2 调出来的那套**逐字一致**，否则 --shot 的基线 md5 会变。
void applyGroundParams(Ground& g, float radius, UiControls& ctl) {
    if (!g.ready) {
        return;
    }

    float spacing;
    if (ctl.groundAutoSpacing) {
        // 格距吸附到 2 的整数次幂：不管模型是大是小，格子看起来都是"整数"
        const float raw = std::max(radius / 6.0f, 1.0e-4f);
        spacing = std::pow(2.0f, std::round(std::log2(raw)));
        ctl.groundSpacing = spacing;   // 回写给面板：勾着"自动"时也看得见真实格距
    } else {
        spacing = std::max(ctl.groundSpacing, 1.0e-4f);
    }

    // 颜色是**线性**空间（不是 sRGB）。
    // alpha 给得比较高：地面太透的话，太阳阴影（差的就是太阳那一份直接光）
    // 会跟天空盒混在一起看不清 —— 而"阴影能落下来"正是这块板子存在的理由。
    g.mi->setParameter("baseColor",   float4{ 0.090f, 0.095f, 0.105f, ctl.groundBaseAlpha });
    g.mi->setParameter("lineColor",   float4{ 0.300f, 0.320f, 0.350f, ctl.groundLineAlpha });
    g.mi->setParameter("gridSpacing", spacing);
    // 淡出半径：地面"最实"的范围。
    // ⚠ 相机就站在离中心 centerDist 的地方（通常 1.8 倍半径左右），
    //   淡出半径如果贴着它，整个前景都是淡出的尾巴 —— 地面看起来就"没画"。
    //   所以这里给到 3 倍半径：模型脚下最实，往外一圈才慢慢化掉。
    //   （远平面必须 > 这个值，见帧循环的 camFar / kGroundSideFactor。）
    g.mi->setParameter("fadeRadius",  radius * ctl.groundFadeScale);
    g.mi->setParameter("fadeStart",   ctl.groundFadeStart);
    g.mi->setParameter("roughness",   ctl.groundRoughness);
}

// 把地面摆到 (center.x, floorY, center.z) 那个位置，边长取包围球半径的 kGroundSideFactor 倍。
void placeGround(Engine* engine, Ground& g, float3 center, float floorY, float radius,
                 UiControls& ctl) {
    if (!g.ready) {
        return;
    }

    const float size = radius * kGroundSideFactor;   // 局部就是 1x1，所以边长直接就是缩放

    TransformManager& tcm = engine->getTransformManager();
    const mat4f xform = mat4f::translation(float3{ center.x, floorY, center.z })
                      * mat4f::scaling(float3{ size, 1.0f, size });
    tcm.setTransform(tcm.getInstance(g.entity), xform);

    applyGroundParams(g, radius, ctl);
}

// ---------------------------------------------------------------------------
// 按包围盒摆相机
//
// 把包围盒的半尺寸投影到相机的 right / up 两轴上，得到它在屏幕上占的半宽
// 半高，再反推距离。比"把包围球塞进视锥"紧得多 —— 包围球用的是半对角线，
// DamagedHelmet 实测要远 1.8 倍，模型在画面里小一圈，大模型更明显。
//
// ★ 单位：fovDegrees 是**度**，和 Camera::setProjection 的口径保持一致。
//   （这里踩过一次：按弧度算却传了 45.0f，结果 tan(22.5 弧度) 是垃圾值；
//     更隐蔽的是 min(fovX, fovY) 里的 fovY=45 是个"巨大的弧度数"，
//     永远赢不了 fovX，竖直方向的约束整个变成死代码。）
// ---------------------------------------------------------------------------
struct CameraFit {
    float3 eye    = {};
    float3 target = {};
    float  near   = 0.1f;
    float  far    = 100.0f;
};

// 长方体沿单位方向 u 的支持函数：投影到 u 上能撑多远
float boxSupport(const float3& halfExtent, const float3& u) {
    return std::abs(halfExtent.x * u.x) + std::abs(halfExtent.y * u.y) +
           std::abs(halfExtent.z * u.z);
}

CameraFit fitCamera(const Aabb& aabb, float aspect, float fovDegrees) {
    CameraFit fit;
    fit.target = aabb.center();

    // 注意：Aabb::extent() 返回的是**半**尺寸 (max-min)/2，不是全长
    float3 half = aabb.extent();
    if (!(length(half) > 0.0f)) {                 // 0 和 NaN 都走这里
        half = float3{ 0.5f };
    }

    // 右上前方的 3/4 视角，正面和侧面的高光都能看到
    const float3 dir = normalize(float3{ 0.55f, 0.42f, 1.0f });

    // 相机基：gaze 是视线方向，right / up 是屏幕的两条轴
    const float3 gaze  = -dir;
    const float3 right = normalize(cross(gaze, float3{ 0.0f, 1.0f, 0.0f }));
    const float3 up    = cross(right, gaze);

    const float halfW = boxSupport(half, right);  // 屏幕上的半宽、半高
    const float halfH = boxSupport(half, up);

    // 距离要同时满足竖直和水平：halfH <= d*tan(fovY/2) 且
    // halfW <= d*tan(fovX/2)，而 tan(fovX/2) = tan(fovY/2) * aspect。
    // 取更严的那一边，宽屏和竖屏就都装得下。
    const float tanY = std::tan(fovDegrees * 0.5f * static_cast<float>(F_PI) / 180.0f);
    const float tanX = tanY * aspect;
    const float distance = std::max(halfH / tanY, halfW / tanX) * 1.05f;   // 5% 留边

    fit.eye = fit.target + dir * distance;

    // 盒子沿视线的半深：近平面别切进模型
    const float halfDepth = boxSupport(half, gaze);
    fit.near = std::max((distance - halfDepth) * 0.5f, 0.001f);
    fit.far  = distance + halfDepth + length(half) * 2.0f;
    return fit;
}

// ---------------------------------------------------------------------------
// 轨道相机（camutils::Manipulator）
//
// ORBIT 模式：左键绕着 targetPosition 转，右键平移，滚轮推拉。
// 官方的用法见 FilamentApp2.cpp:207-214（Builder）和 :1086-1108（事件转发）。
//
// 起始姿态直接喂上面算出来的取景，所以"刚加载完"和手动取景是同一套参数，
// 不会有"加载完先跳一下"的观感。
//
// 确定性：OrbitManipulator 没有重写 update()，而基类的 update() 是空实现
// （camutils/Manipulator.cpp:326），camutils 的 ORBIT 模式**自带阻尼为 0、也没有
// 动画** —— 相机姿态只在收到输入时改变。所以 --shot 的第 1 帧永远等于 home 姿态。
// （我们在外面又加了一层显示层阻尼，同样不改变这一点 —— 见主循环前面那段注释。）
// ---------------------------------------------------------------------------
camutils::Manipulator<float>* buildManipulator(
        const float3& eye, const float3& target, float zoomSpeed, float fovDegrees) {
    return camutils::Manipulator<float>::Builder()
            .viewport(gWidth, gHeight)
            .targetPosition(target.x, target.y, target.z)
            .orbitHomePosition(eye.x, eye.y, eye.z)
            .upVector(0.0f, 1.0f, 0.0f)
            .zoomSpeed(zoomSpeed)
            // ★ orbitSpeed.y 取负号，把竖直方向翻过来。
            //
            //   官方约定（OrbitManipulator.h:113 起）：
            //       delta_theta = (mGrabWinX - x) * orbitSpeed.x   水平，物体跟着鼠标走
            //       delta_phi   = (mGrabWinY - y) * orbitSpeed.y   竖直，相机跟着鼠标走
            //   Win32/SDL 的 y 轴向下，所以默认那套的效果是"鼠标往上拖 = 相机升高 =
            //   俯视看物体顶面"，和 Blender / three.js OrbitControls 的"抓住物体拖"
            //   正好上下相反。
            //
            //   水平方向 Filament 本来就是"物体跟手"（和 OrbitControls 的
            //   rotateLeft 同号，见 three.js OrbitControls.js），所以**只翻 y**。
            //   如果哪天觉得水平也想反，把 x 也取负即可。
            .orbitSpeed(0.01f, -0.01f)              // 默认值是 (0.01, 0.01)
            // 右键拖拉 = 平移。Manipulator.h:112 的默认值本来就是 true，这里显式写出来，
            // 因为**主循环里那份"影子 pivot"（gTrackedPivot）就是靠"右键=平移"才成立的**：
            // 只有 grabBegin(strafe=true) → mGrabState = PANNING 这条路径会搬动 mPivot
            // （OrbitManipulator.h:100-107）。哪天这里改成 false，右键就退化成旋转，
            // 影子 pivot 的更新条件也得跟着一起改。
            .panning(true)
            // fovDegrees 只影响右键平移的手感（射线求交要用视锥），
            // 设成和实际投影一致，平移速度才和视觉对得上。
            .fovDegrees(fovDegrees)
            .build(camutils::Mode::ORBIT);
}

// ---------------------------------------------------------------------------
// 单位方向 ↔ 球坐标（方位角 theta + 仰角 phi）。
//
// 这套参数和 OrbitManipulator 内部用的**完全相同**：它的
//   jumpToBookmark()     dir = (sin θ·cos φ, sin φ, cos θ·cos φ)     （:176-178）
//   getCurrentBookmark() φ = asin(y),  θ = atan2(x, z)               （:137-138）
// 所以在这两个角上插值 = 直接在 manipulator 自己的参数上插值，得到的是**转台**
// 运动：纯水平拖拽时仰角一点都不动，相机始终在同一高度绕模型转圈。
//
// 为什么不按"最短弧 / 大圆"插方向：大圆在跨大角度时会朝极地方向鼓出去。
// 实测一帧甩 400px（约 229°）时，方向沿大圆走，中途仰角从 20.2° 一路鼓到 33.3°
// （eye.y 从 1.143 抬到 1.818）—— 画面会"往上翻"，那不是游戏里"拖住人物转一圈"。
// ---------------------------------------------------------------------------
void toSpherical(const float3& dir, float* theta, float* phi) {
    *theta = std::atan2(dir.x, dir.z);
    *phi   = std::asin(std::max(-1.0f, std::min(1.0f, dir.y)));
}

float3 fromSpherical(float theta, float phi) {
    const float cp = std::cos(phi);
    return float3{ std::sin(theta) * cp, std::sin(phi), std::cos(theta) * cp };
}

// ---------------------------------------------------------------------------
// 三角形几何
//
// 注意 Filament 的一个关键设计：**法线不是独立顶点属性**，
// 而是把 tangent/bitangent/normal 打包成一个四元数，塞进 VertexAttribute::TANGENTS。
// 所以顶点里没有 "normal"，只有 short4 的 tangents（SHORT4 + normalized）。
//
// 用法就是官方那套：
//     quatf  q = quatf::fromDirectedRotation({0,0,1}, normal);
//     short4 t = packSnorm16(float4{q.x, q.y, q.z, q.w});
// ---------------------------------------------------------------------------
struct Vertex {
    float3 position;    // offset  0  FLOAT3
    short4 tangents;    // offset 12  SHORT4 normalized（法线四元数）
    float4 color;       // offset 20  FLOAT4
};
static_assert(sizeof(Vertex) == 36, "顶点布局和 attribute offset 必须对得上");

// 等边三角形（外接圆半径 1，XY 平面，重心在原点）：
//   v0 (1, 0)  红      v1 (-0.5, 0.866) 绿      v2 (-0.5, -0.866) 蓝
// 法线 = 顶点径向方向 和 +Z 五五开，做成"圆角三角形"的平滑着色观感。
// （纯平面三角形法线全是 +Z，会是一整块死平的颜色，看不出 PBR 的明暗过渡）
Vertex makeVertex(float2 posXy, float4 color) {
    const float3 position{ posXy.x, posXy.y, 0.0f };
    const float3 radial   = normalize(position);          // 平面内径向
    const float3 n        = normalize(radial * 0.5f + float3{ 0.0f, 0.0f, 0.5f });

    const quatf  q = quatf::fromDirectedRotation(float3{ 0.0f, 0.0f, 1.0f }, n);
    const short4 t = packSnorm16(float4{ q.x, q.y, q.z, q.w });

    return Vertex{ position, t, color };
}

constexpr float kSqrt3Over2 = 0.86602540378443864676f;

const Vertex TRIANGLE_VERTICES[3] = {
    makeVertex({  1.0f,         0.0f }, { 1.00f, 0.05f, 0.05f, 1.0f }),
    makeVertex({ -0.5f,  kSqrt3Over2 }, { 0.05f, 0.85f, 0.10f, 1.0f }),
    makeVertex({ -0.5f, -kSqrt3Over2 }, { 0.05f, 0.15f, 1.00f, 1.0f }),
};

constexpr uint16_t TRIANGLE_INDICES[3] = { 0, 1, 2 };

// ---------------------------------------------------------------------------
// 截图（--shot <file.bmp>）
//
// 用 Renderer::readPixels 把当前帧读回 CPU，再手写一个 24 位 BMP。
// 用途：不开窗口也能验证渲染结果（以后可以做离屏回归测试）。
// BMP 零依赖，用任意工具转一下 PNG 就能看。
// ---------------------------------------------------------------------------
void writeBmp24(const char* path, const uint8_t* rgba, uint32_t width, uint32_t height) {
    const uint32_t rowBytes = width * 3;
    const uint32_t pad      = (4u - (rowBytes % 4u)) % 4u;
    const uint32_t dataSize = (rowBytes + pad) * height;

    uint8_t header[54] = {};
    header[0] = 'B';
    header[1] = 'M';
    const uint32_t fileSize = 54u + dataSize;
    std::memcpy(header +  2, &fileSize, 4);
    const uint32_t offset = 54u;
    std::memcpy(header + 10, &offset, 4);
    const uint32_t dibSize = 40u;
    std::memcpy(header + 14, &dibSize, 4);
    const int32_t w32 = static_cast<int32_t>(width);
    const int32_t h32 = static_cast<int32_t>(height);   // 正数 = 自下而上
    std::memcpy(header + 18, &w32, 4);
    std::memcpy(header + 22, &h32, 4);
    const uint16_t planes = 1;
    const uint16_t bpp    = 24;
    std::memcpy(header + 26, &planes, 2);
    std::memcpy(header + 28, &bpp, 2);
    std::memcpy(header + 34, &dataSize, 4);
    const int32_t ppm = 2835;
    std::memcpy(header + 38, &ppm, 4);
    std::memcpy(header + 42, &ppm, 4);

    std::ofstream out(path, std::ios::binary);
    if (!out) {
        std::fprintf(stderr, "[shot] 打不开输出文件 %s\n", path);
        return;
    }
    out.write(reinterpret_cast<const char*>(header), 54);

    std::vector<uint8_t> row(rowBytes + pad, 0);
    for (int32_t y = static_cast<int32_t>(height) - 1; y >= 0; --y) {
        const uint8_t* src = rgba + static_cast<size_t>(y) * width * 4;
        for (uint32_t x = 0; x < width; ++x) {
            row[x * 3 + 0] = src[x * 4 + 2];   // B
            row[x * 3 + 1] = src[x * 4 + 1];   // G
            row[x * 3 + 2] = src[x * 4 + 0];   // R
        }
        out.write(reinterpret_cast<const char*>(row.data()), rowBytes + pad);
    }
    std::printf("[shot] 已保存 %s (%ux%u)\n", path, width, height);
    std::fflush(stdout);
}

struct Screenshot {
    const char* path     = nullptr;
    bool        pending  = true;    // 还没发出 readPixels
    bool        finished = false;   // 回调已落盘

    static void onPixels(void* buffer, size_t, void* user) {
        auto* self = static_cast<Screenshot*>(user);
        writeBmp24(self->path, static_cast<const uint8_t*>(buffer),
                static_cast<uint32_t>(gWidth), static_cast<uint32_t>(gHeight));
        std::free(buffer);
        self->finished = true;
    }
};

void printBanner(bool triangleMode, bool envOk, bool contentOk, bool groundOk) {
    std::printf(
        "\n"
        "========================================================\n"
        " ModelViewer —— %s\n"
        "========================================================\n"
        " 窗口 + Engine + 清屏                       [OK]\n"
        " IBL 环境光 + 天空盒                        [%s]\n"
        " 太阳光 (SUN)                              [OK]\n"
        " 后处理 / ACES tone mapping                [OK]\n",
        triangleMode ? "PBR 三角形（调试靶子）" : "GLB 模型查看器",
        envOk ? "OK" : "FAIL");

    if (triangleMode) {
        std::printf(
            " lit 材质 (shadingModel : lit)             [%s]\n"
            " 法线 (TANGENTS 四元数)                     [OK]\n",
            contentOk ? "OK" : "FAIL");
    } else {
        std::printf(
            " gltfio 加载 .glb (ubershader 材质)         [%s]\n"
            " 包围盒自适应相机                            [%s]\n",
            contentOk ? "OK" : "FAIL",
            contentOk ? "OK" : "FAIL");
    }

    std::printf(
        "--------------------------------------------------------\n"
        " 画质: 4x MSAA / SSAO / Bloom / PCF 阴影     [OK]\n"
        " 地面网格（接阴影的板子）                    [%s]\n"
        " 轨道相机 (camutils::Manipulator, ORBIT)      [OK]\n"
        " 阻尼: 惯性平滑 (--damping K)                [OK]\n"
        " 环境: %s\n"
        "--------------------------------------------------------\n"
        " 鼠标: 左键旋转  右键平移  滚轮推拉  R 复位视角\n"
        " 文件: 拖 .glb 到窗口 / F5 重新加载    ESC 退出\n"
        "========================================================\n\n",
        groundOk ? "OK" : "SKIP",
        "assets/ibl/lightroom_14b/lightroom_14b_*.ktx");
}

} // namespace

// ---------------------------------------------------------------------------
// 面板要的一步换算：高度角 / 方位角 -> 太阳方向
//
// 面板上摆的是"高度角 + 方位角"（人的直觉），LightManager 要的是光的**传播**
// 方向。默认 (45°, 36.87°) 算出来正好是官方 Settings.h:265-274 的
// {0.6, -1.0, -0.8} —— 光从左上前方斜着打下来，左肩亮、右后方落影子。
// ---------------------------------------------------------------------------
float3 sunDirectionFromAngles(float elevationDeg, float azimuthDeg) {
    constexpr float kDeg2Rad = 3.14159265358979f / 180.0f;
    const float e = elevationDeg * kDeg2Rad;
    const float a = azimuthDeg   * kDeg2Rad;
    const float3 d{ std::cos(e) * std::sin(a),
                   -std::sin(e),
                   -std::cos(e) * std::cos(a) };
    const float len = length(d);
    return len > 1.0e-6f ? d / len : float3{ 0.0f, -1.0f, 0.0f };
}

int main(int argc, char** argv) {
    // 源码是 UTF-8（/utf-8），控制台默认按 GBK 解释 -> 中文全是乱码。
    // 把它切到 UTF-8，printf 里的中文才能正常显示。
    SetConsoleOutputCP(CP_UTF8);

    // 参数：
    //      [<model.glb> | default|metal|rough]     位置参数
    //      --shot <file.bmp>   --frames <n>   --verbose   --damping <K>
    //
    // 位置参数有两种含义：
    //      default|metal|rough  -> PBR 三角形（阶段 0/1-a/1-b 留下的调试靶子）
    //      其他 / 不给           -> 当成 .glb 路径加载
    const char* positional  = nullptr;
    Screenshot  shot;
    int         framesLimit = 0;      // >0 时渲染这么多帧后自动退出（便于测量/压测）
    // 窗口显示与否：--hidden 强制隐藏，--show 强制显示（覆盖 --shot 的默认隐藏）。
    bool        wantHidden  = false;
    bool        wantShow    = false;
    int         wantUi      = -1;     // 面板显隐：-1 = 没表态（按是不是截图路径定）

    // 面板上的所有旋钮（阶段 3，实现在 src/ui.cpp）。
    // ★ 这里的默认值就是出厂设置，main() 后面那些初始化用的是同一批数 ——
    //   两边必须一致，否则面板显示的数字会和真实渲染状态对不上（见 src/ui.h）。
    UiControls  uiCtl;

    for (int i = 1; i < argc; ++i) {
        if (std::strcmp(argv[i], "--shot") == 0 && i + 1 < argc) {
            shot.path = argv[++i];
        } else if (std::strcmp(argv[i], "--frames") == 0 && i + 1 < argc) {
            framesLimit = std::atoi(argv[++i]);
        } else if (std::strcmp(argv[i], "--damping") == 0 && i + 1 < argc) {
            // 轨道相机阻尼速率 K（1/秒），默认 15 —— 抄的是官方 Manipulator.h:140
            // 给 flightMoveDamping 的推荐值（"a good default is 15"）。
            // 面板上那个"阻尼 K"滑块改的是同一个字段。
            uiCtl.damping = std::max(0.0f, static_cast<float>(std::atof(argv[++i])));
        } else if (std::strcmp(argv[i], "--size") == 0 && i + 1 < argc) {
            // --size 1600x900：窗口/帧缓冲尺寸。默认 1280x720。
            // 隐藏窗口不受屏幕大小限制，所以拿它截高分辨率（或超长面板）的图很方便。
            // 不用 sscanf —— MSVC 会为它报 C4996（本工程开着 /W3，不留这种噪音）。
            const char* s   = argv[++i];
            char*       end = nullptr;
            const int   w   = static_cast<int>(std::strtol(s, &end, 10));
            int         h   = 0;
            if (end != nullptr && (*end == 'x' || *end == 'X')) {
                h = static_cast<int>(std::strtol(end + 1, nullptr, 10));
            }
            if (w > 0 && h > 0) {
                gWidth  = w;
                gHeight = h;
            }
        } else if (std::strcmp(argv[i], "--hidden") == 0) {
            wantHidden = true;
        } else if (std::strcmp(argv[i], "--show") == 0) {
            wantShow = true;
        } else if (std::strcmp(argv[i], "--ui") == 0) {
            wantUi = 1;               // 截图时也把面板画进去
        } else if (std::strcmp(argv[i], "--no-ui") == 0) {
            wantUi = 0;
        } else if (std::strcmp(argv[i], "--verbose") == 0) {
            uiCtl.logCamera = true;   // 面板上"控制台打印相机姿态"那个勾
        } else if (argv[i][0] != '-') {
            positional = argv[i];
        }
    }

    // 面板默认在**交互运行**时打开；截图路径（--shot）默认关掉它 ——
    // 面板是给坐在屏幕前的人用的，而 --shot 是回归基线（那几个 md5 都是在
    // "没有面板"的前提下录的），默认关掉顺带让截图保持干净。
    // 想看带面板的截图就显式加 --ui。
    uiCtl.showPanel = (wantUi >= 0) ? (wantUi != 0) : (shot.path == nullptr);

    // 这两个面板上也能改，直接起个别名指到控件上 ——
    // 这样下面所有读 damping / verbose 的地方一行都不用动，也不会出现两份状态。
    float& damping = uiCtl.damping;
    bool&  verbose = uiCtl.logCamera;

    // --shot 是回归/批处理用的路径：它照样会建真窗口（Filament 的 swapchain 必须
    // 挂在原生窗口上），但默认**不显示**出来 —— 一次验证跑十几遍，屏幕上会反复闪出
    // 模型或三角形。想看着它渲染就加 --show。
    gWindowHidden = wantHidden || (shot.path != nullptr && !wantShow);

    const char* kDefaultModel = "assets/models/DamagedHelmet.glb";
    bool        triangleMode  = false;
    const char* preset        = "default";        // 只在三角形模式里有意义
    // 用 std::string 而不是 const char*：拖放进来的那条路径是运行时拼出来的，
    // 得有人持有它（argv 那份能活到进程结束，拖放那份不能）。
    std::string modelPath     = kDefaultModel;
    if (positional) {
        if (std::strcmp(positional, "default") == 0 ||
            std::strcmp(positional, "metal")   == 0 ||
            std::strcmp(positional, "rough")   == 0) {
            triangleMode = true;
            preset       = positional;
        } else {
            modelPath = positional;
        }
    }

    const std::wstring title = windowTitle(triangleMode, modelPath);

    HWND hwnd = createWindow(GetModuleHandleW(nullptr), title.c_str());
    if (!hwnd) {
        std::fprintf(stderr, "[fatal] 创建窗口失败\n");
        return 1;
    }

    // 登记"这个窗口接受拖放"：不调这一句，系统不会给它发 WM_DROPFILES。（阶段 2）
    DragAcceptFiles(hwnd, TRUE);

    if (verbose) {
        // 读回来的标题必须和想要的一模一样。差一个字符（典型症状：只剩 "M"）
        // 就说明 WndProc 里写成了 DefWindowProcA —— 原因见那里的长注释。
        wchar_t got[256] = {};
        const int n = GetWindowTextW(hwnd, got, 256);
        const bool titleOk = (n == static_cast<int>(title.size())) && (title == got);
        std::printf("[check] 窗口标题 = \"%ls\" 长度 %d（期望 %d）-> %s\n",
                got, n, static_cast<int>(title.size()), titleOk ? "OK" : "FAIL");
        std::fflush(stdout);
    }

    ensureAssetRoot();

    Engine* engine = Engine::create(Engine::Backend::OPENGL);
    if (!engine) {
        std::fprintf(stderr, "[fatal] Engine::create 失败\n");
        DestroyWindow(hwnd);
        return 1;
    }

    // ★ 建 swapchain 之前把客户区尺寸**重新读一遍**，让 gWidth/gHeight 和 swapchain
    //   看到的是同一个数。
    //
    //   原因：Engine::createSwapChain(hwnd) **没有尺寸参数** —— 它自己去问一次窗口
    //   大小。而窗口刚创建出来时未必已经定型（创建过程中送来的那次 WM_SIZE 报的
    //   可能是临时尺寸，窗口真正 show 出来时还会再送一次）。这里如果两边差上几个
    //   像素，就会出两种症状：
    //     · 画面整体平移几像素（swapchain 比视口高几像素 → 内容贴着底边画）；
    //     · --shot 的 md5 偶发抖动（同一个模型、同一个 preset，两次跑出来不一样）
    //       —— 而 md5 是当回归基线用的，这种抖动最要命：它会让人以为改动坏了画面。
    //   取景（resetView 用的 aspect）、投影、视口、readPixels 全都是按 gWidth/gHeight
    //   算的，所以这里统一到"窗口此刻的真实客户区"这一个来源上。
    {
        RECT cr = {};
        if (GetClientRect(hwnd, &cr) && cr.right > 0 && cr.bottom > 0) {
            gWidth  = cr.right;
            gHeight = cr.bottom;
        }
    }

    SwapChain* swapChain = engine->createSwapChain(hwnd);
    Renderer*  renderer  = engine->createRenderer();
    Scene*     scene     = engine->createScene();
    View*      view      = engine->createView();

    Entity cameraEntity = EntityManager::get().create();
    Camera* camera = engine->createCamera(cameraEntity);

    view->setCamera(camera);
    view->setScene(scene);

    // ------------------------------------------------------------------
    // 1. 后处理 —— PBR 的 tone mapping 挂在这上面
    //    关掉它会连 ColorGrading 一起失效，画面立刻变"平"
    // ------------------------------------------------------------------
    view->setPostProcessingEnabled(true);
    view->setAntiAliasing(View::AntiAliasing::FXAA);

    // ------------------------------------------------------------------
    // 1b. 画质开关 —— 逐条抄官方 gltf_viewer 的出厂设置
    //
    //   来源：libs/viewer/src/ViewerGui.cpp:427-453（ViewerGui 构造函数）
    //       mSettings.view.shadowType   = ShadowType::PCF;
    //       mSettings.view.dithering    = Dithering::TEMPORAL;
    //       mSettings.view.antiAliasing = AntiAliasing::FXAA;
    //       mSettings.view.msaa         = { .enabled = true, .sampleCount = 4 };
    //       mSettings.view.ssao.enabled = true;
    //       mSettings.view.bloom.enabled= true;
    //       LightManager::Builder(SUN)...castShadows(true)
    //       view->setAmbientOcclusionOptions({ .upsampling = QualityLevel::HIGH })
    //
    //   ★ 之前那句"这几项默认开着但很贵"是**错的**：Filament 自己的
    //     Options.h 里 bloom / ssao 出厂就是 enabled = false，是官方 viewer
    //     显式打开的。我们照默认关着 = 没阴影、没环境光遮蔽 —— 画面因此
    //     "飘"、不真实。现在按官方口径打开。
    // ------------------------------------------------------------------
    // 4x MSAA：边缘抗锯齿。字段逐个赋值，避开 C++20 指定初始化器的声明顺序约束
    View::MultiSampleAntiAliasingOptions msaa;
    msaa.enabled     = true;
    msaa.sampleCount = 4;
    view->setMultiSampleAntiAliasingOptions(msaa);

    View::AmbientOcclusionOptions ssao;
    ssao.enabled    = true;
    ssao.upsampling = View::QualityLevel::HIGH;      // ViewerGui.cpp:453 也是 HIGH
    view->setAmbientOcclusionOptions(ssao);

    view->setBloomOptions({ .enabled = true });
    view->setDithering(View::Dithering::TEMPORAL);

    // 阴影：总开关在 View，光源那边还要 castShadows(true)，两边缺一不可
    view->setShadowingEnabled(true);
    view->setShadowType(View::ShadowType::PCF);

    // ------------------------------------------------------------------
    // 2. 环境光照
    // ------------------------------------------------------------------
    Environment env;
    const bool envOk = loadEnvironment(engine,
            "assets/ibl/lightroom_14b/lightroom_14b", env);
    // 面板上 IBL / 天空盒是能单独关掉的，所以这两个指针得留着
    //（关掉时就是往 scene 上传 nullptr）。没有 IBL 时的兜底天空盒也要记住，
    // 否则"关掉天空盒再打开"会把兜底那个弄丢。
    Skybox* fallbackSkybox = nullptr;
    if (envOk) {
        scene->setIndirectLight(env.indirectLight);
        scene->setSkybox(env.skybox);
    } else {
        // 没有 IBL 也要能看见东西，退化成纯色天空
        fallbackSkybox = Skybox::Builder().color({ 0.1f, 0.125f, 0.25f, 1.0f }).build(*engine);
        scene->setSkybox(fallbackSkybox);
    }
    Skybox* const skyboxInUse = envOk ? env.skybox : fallbackSkybox;

    // ------------------------------------------------------------------
    // 3. 太阳光
    //    direction 是光的传播方向；这里光从左上前方打过来
    // ------------------------------------------------------------------
    Entity sunEntity = EntityManager::get().create();
    LightManager::Builder(LightManager::Type::SUN)
            .color({ 1.0f, 0.98f, 0.92f })
            // 官方 Settings.h:265-274 的出厂值：intensity = 100000，方向就是 {0.6,-1,-0.8}
            .intensity(100000.0f)                   // SUN 类型单位是 lux
            .direction({ 0.6f, -1.0f, -0.8f })
            .castShadows(true)                      // ★ ViewerGui.cpp:445 也是 true
            .build(*engine, sunEntity);
    scene->addEntity(sunEntity);

    // ------------------------------------------------------------------
    // 4. 内容：默认加载 .glb；传 default|metal|rough 时回退到 PBR 三角形
    //
    // 两条路共用前面搭好的 IBL / 天空盒 / 太阳 / 后处理，只换几何体和材质来源。
    // 三角形留着当"靶子"：模型渲染不对时切过去，就能立刻分辨问题出在
    // 渲染管线还是模型加载。
    // ------------------------------------------------------------------
    Model model;

    Material*         material   = nullptr;   // 以下都只有三角形模式才非空
    MaterialInstance* mi         = nullptr;
    VertexBuffer*     vb         = nullptr;
    IndexBuffer*      ib         = nullptr;
    Entity            renderable{};
    bool              contentOk  = false;

    if (triangleMode) {
        const std::vector<uint8_t> matData = readFile("materials/litTriangle.filamat");
        if (matData.empty()) {
            std::fprintf(stderr, "[fatal] 读不到 materials/litTriangle.filamat\n");
            std::fprintf(stderr, "        先跑一次 cmake --build build --config Release 让它生成\n");
            return 1;
        }

        material = Material::Builder()
                .package(matData.data(), matData.size())
                .build(*engine);

        mi = material->createInstance();
        // PBR 三件套：粗糙度 / 金属度 / 反射率
        if (std::strcmp(preset, "metal") == 0) {
            mi->setParameter("roughness", 0.20f);
            mi->setParameter("metallic",  1.00f);
        } else if (std::strcmp(preset, "rough") == 0) {
            mi->setParameter("roughness", 0.85f);
            mi->setParameter("metallic",  0.00f);
        } else {
            mi->setParameter("roughness", 0.30f);
            mi->setParameter("metallic",  0.00f);
        }
        mi->setParameter("reflectance", 0.5f);

        vb = VertexBuffer::Builder()
                .vertexCount(3)
                .bufferCount(1)
                .attribute(VertexAttribute::POSITION, 0, VertexBuffer::AttributeType::FLOAT3,  0, sizeof(Vertex))
                .attribute(VertexAttribute::TANGENTS, 0, VertexBuffer::AttributeType::SHORT4, 12, sizeof(Vertex))
                .attribute(VertexAttribute::COLOR,    0, VertexBuffer::AttributeType::FLOAT4, 20, sizeof(Vertex))
                .normalized(VertexAttribute::TANGENTS)
                .build(*engine);

        vb->setBufferAt(*engine, 0,
                VertexBuffer::BufferDescriptor(TRIANGLE_VERTICES, sizeof(TRIANGLE_VERTICES), nullptr));

        ib = IndexBuffer::Builder()
                .indexCount(3)
                .bufferType(IndexBuffer::IndexType::USHORT)
                .build(*engine);
        ib->setBuffer(*engine,
                IndexBuffer::BufferDescriptor(TRIANGLE_INDICES, sizeof(TRIANGLE_INDICES), nullptr));

        renderable = EntityManager::get().create();
        RenderableManager::Builder(1)
                .boundingBox({ { -1.2f, -1.2f, -0.2f }, { 1.2f, 1.2f, 0.2f } })
                .material(0, mi)
                .geometry(0, RenderableManager::PrimitiveType::TRIANGLES, vb, ib, 0, 3)
                .culling(false)          // 转到背面时也要可见（Filament 会自动翻法线）
                .receiveShadows(false)
                .castShadows(false)
                .build(*engine, renderable);
        scene->addEntity(renderable);

        contentOk = true;
    } else {
        contentOk = loadModel(engine, scene, modelPath.c_str(), model);
    }

    // 地面（阶段 2）：一块跟着内容走的网格平板，专门用来**接太阳的阴影**。
    // 建不起来也不致命（就是没地面），所以不并进 contentOk 的判定。
    Ground ground;
    createGround(engine, scene, ground);

    printBanner(triangleMode, envOk, contentOk, ground.ready);

    if (triangleMode) {
        std::printf(" [preset]  roughness/metallic = %s\n", preset);
    } else if (contentOk) {
        printLoaded(modelPath, model);
    }
    // ------------------------------------------------------------------
    // 6. 轨道相机 + 帧循环
    // ------------------------------------------------------------------
    // 取景：模型用包围盒拟合的结果，三角形用的是原来那个固定机位。
    // 两个模式都交给同一套 Manipulator，下面每帧只用 getLookAt 驱动相机。
    //
    // ★ 这些量都**不是 const**：阶段 2 的拖放加载会在运行时换内容，换完要按新
    //   包围盒重新拟合。整套复位集中在下面 resetView() 里，启动和每次拖放走同一个出口。
    // 视场角默认 45° —— 这个数现在在 UiControls::fovDeg 里，面板上能调（阶段 3）。
    // 面板改完按 R 才会按新角度重新取景（下面 resetView() 读的就是它）。
    float3 camHomeEye{};
    float3 camHomeTarget{};
    float  camHomeDistance = 1.0f;      // 相机到目标的距离，用来定滚轮速度和近/远平面
    float  camRadius       = 2.0f;      // 包围球半径，兜近/远平面（三角形给个常数）

    // 阻尼状态 = "实际喂给相机的姿态"。用轨道参数（方位角 / 仰角 / 距离）表示；
    // 为什么不能直接存世界坐标的两个点、原点为什么必须用真 pivot，见下面那段长注释。
    // 声明在这里（而不是帧循环前面）是为了让 resetView() 能一并复位它们。
    float3 dampEye     = camHomeEye;      // 实际喂给相机的眼睛位置
    float3 dampTarget  = camHomeTarget;   // 实际喂给相机的注视点
    float  dampTheta   = 0.0f;
    float  dampPhi     = 0.0f;
    float  dampDist    = camHomeDistance;

    // 由当前内容重算取景，并把 Manipulator / home bookmark / 影子 pivot / 阻尼状态
    // 全部复位到"刚加载完"那一刻；顺带把**地面**摆到内容脚下（它必须跟内容一起走，
    // 不然换个模型地面就留在原地了）。启动调一次，每次重载成功再调一次。
    const auto resetView = [&]() {
        if (triangleMode) {
            camHomeEye    = float3{ 0.0f, 0.0f, 3.0f };
            camHomeTarget = float3{ 0.0f, 0.0f, 0.0f };
            camRadius     = 2.0f;
        } else {
            const CameraFit fit = fitCamera(model.bounds,
                    static_cast<float>(gWidth) / static_cast<float>(gHeight), uiCtl.fovDeg);
            camHomeEye    = fit.eye;
            camHomeTarget = fit.target;
            camRadius     = length(model.bounds.extent());
        }
        camHomeDistance = length(camHomeEye - camHomeTarget);

        // 地面跟内容一起挪：模型画在包围盒下沿，三角形画在它自己那个盒子下沿。
        // 半径直接用 camRadius —— 和近/远平面用的是同一个数，两个必须一致
        // （远平面就是按它算的，不一致的话地面又会被裁）。
        if (triangleMode) {
            placeGround(engine, ground, float3{ 0.0f, 0.0f, 0.0f }, -1.2f, camRadius, uiCtl);
        } else {
            placeGround(engine, ground, model.bounds.center(), model.bounds.min.y, camRadius,
                    uiCtl);
        }

        // 滚轮一格 ≈ 移动初始距离的 8%，这样大小不同的模型手感一致
        delete gManipulator;
        gManipulator = buildManipulator(camHomeEye, camHomeTarget,
                camHomeDistance * 0.08f, uiCtl.fovDeg);

        // 存下"初始取景"这份 bookmark 给 R 键复位用。
        // 构造完立刻取：这时 mEye / mPivot 正好是 orbitHomePosition / targetPosition，
        // getCurrentBookmark() 反算出的 phi / theta / distance 就是我们要的 3/4 视角。
        gHomeBookmark = gManipulator->getCurrentBookmark();

        // 影子 pivot 的起点：OrbitManipulator 构造完时 mPivot == targetPosition == 目标中心
        gTrackedPivot = camHomeTarget;
        gPanPivot0    = camHomeTarget;
        gPanEye0      = camHomeEye;
        gPanning      = false;
        gPivotReset   = false;

        // 阻尼状态贴着真值：换完内容的第一帧正好落进"已贴合"那一支、bit-exact 照抄，
        // 于是相机**直接**落在新取景上，不会从旧姿态慢慢飘过去。
        dampEye    = camHomeEye;
        dampTarget = camHomeTarget;
        dampDist   = camHomeDistance;
        toSpherical(normalize(camHomeEye - camHomeTarget), &dampTheta, &dampPhi);
    };

    resetView();

    // ------------------------------------------------------------------
    // 7. 控制面板（阶段 3）
    //
    // 建不起来（缺 materials/uiBlit.filamat）**不致命**：只是没有面板，
    // 渲染和交互一切照旧 —— 所以这里只打印一行，不退出。
    //
    // 面板要一个**专用 View**：filagui::ImGuiHelper 会把传进去的 View 接管掉
    //（换 camera、setScene(它自己的 UI 场景)、BlendMode::TRANSLUCENT），
    // 这样 UI 才能叠在主画面上而不清屏。官方 FilamentApp2.cpp:205 也是这么干的。
    // ------------------------------------------------------------------
    ui::UiLayer uiLayer;
    const bool   uiOk = uiLayer.create(engine, hwnd);
    if (uiOk) {
        uiLayer.setDisplaySize(gWidth, gHeight);
        gUi    = &uiLayer;   // WndProc 用：转发消息 + 查 WantCapture*
        gUiCtl = &uiCtl;     // WndProc 用：F1 翻面板显隐
    } else {
        uiCtl.showPanel = false;   // 没有面板，帧循环里也不用再问
    }

    // 面板"信息"栏里的内容统计：启动时填一次，每次重载成功再填一次
    const auto updateContentInfo = [&]() {
        UiControls::Info& info = uiCtl.info;
        info.isTriangle = triangleMode;
        info.content    = triangleMode ? "PBR 三角形（调试靶子）" : modelPath;
        if (triangleMode) {
            info.entities    = 1;
            info.renderables = 1;
            info.boundsMin[0] = -1.2f; info.boundsMin[1] = -1.2f; info.boundsMin[2] = -0.2f;
            info.boundsMax[0] =  1.2f; info.boundsMax[1] =  1.2f; info.boundsMax[2] =  0.2f;
        } else if (model.ready && model.asset) {
            info.entities    = model.asset->getEntityCount();
            info.renderables = model.asset->getRenderableEntityCount();
            for (int k = 0; k < 3; ++k) {
                info.boundsMin[k] = model.bounds.min[k];
                info.boundsMax[k] = model.bounds.max[k];
            }
        }
    };
    updateContentInfo();

    // ------------------------------------------------------------------
    // 面板 -> 渲染状态
    //
    // 只在 uiCtl.dirty（面板上动了任何**渲染相关**的控件）时跑一遍。
    // 出厂默认值 = main() 上面那一套，所以 --shot 这条路径一次都进不来 ——
    // 四个基线 md5 一个都不会变。
    // 阻尼 K / 视场角 / 日志开关不在里面：那几个帧循环是直接读的。
    // ------------------------------------------------------------------
    bool groundShown = true;   // 地面此刻在不在场景里（别重复 add/remove）
    const auto applyControls = [&]() {
        view->setPostProcessingEnabled(uiCtl.postProcessing);

        View::MultiSampleAntiAliasingOptions msaa;
        msaa.enabled     = uiCtl.msaa;
        msaa.sampleCount = static_cast<uint8_t>(uiCtl.msaaSamples);
        view->setMultiSampleAntiAliasingOptions(msaa);

        // 面板上的 0 = 关、1 = FXAA，正好对上 AntiAliasing 的枚举顺序
        view->setAntiAliasing(uiCtl.aaMode == 0 ? View::AntiAliasing::NONE
                                                : View::AntiAliasing::FXAA);

        View::AmbientOcclusionOptions ssao;
        ssao.enabled    = uiCtl.ssao;
        ssao.upsampling = static_cast<View::QualityLevel>(uiCtl.ssaoQuality);
        view->setAmbientOcclusionOptions(ssao);

        View::BloomOptions bloom;
        bloom.enabled  = uiCtl.bloom;
        bloom.strength = uiCtl.bloomStrength;
        view->setBloomOptions(bloom);

        view->setShadowingEnabled(uiCtl.shadows);
        // 面板上那四项就是按 ShadowType 的枚举顺序排的（见 ui.cpp 的 kShadowTypes）
        view->setShadowType(static_cast<View::ShadowType>(uiCtl.shadowType));
        view->setDithering(uiCtl.dithering ? View::Dithering::TEMPORAL
                                           : View::Dithering::NONE);
        view->setFrustumCullingEnabled(uiCtl.frustumCulling);

        // 环境光：IBL 和天空盒可以单独关（往 scene 上传 nullptr 就是关）
        scene->setIndirectLight(uiCtl.ibl ? env.indirectLight : nullptr);
        scene->setSkybox(uiCtl.skybox ? skyboxInUse : nullptr);

        // 太阳：强度 + 方向
        LightManager& lm = engine->getLightManager();
        const LightManager::Instance sun = lm.getInstance(sunEntity);
        lm.setIntensity(sun, uiCtl.sunIntensity);
        lm.setDirection(sun, sunDirectionFromAngles(uiCtl.sunElevationDeg,
                                                    uiCtl.sunAzimuthDeg));

        // 地面：显隐 + 那几项材质参数
        if (ground.ready) {
            if (uiCtl.groundVisible != groundShown) {
                if (uiCtl.groundVisible) {
                    scene->addEntity(ground.entity);
                } else {
                    scene->remove(ground.entity);
                }
                groundShown = uiCtl.groundVisible;
            }
            applyGroundParams(ground, camRadius, uiCtl);
        }
    };

    if (verbose) {
        std::printf("[camera] home eye=(%.3f %.3f %.3f) target=(%.3f %.3f %.3f) 距离=%.3f\n",
                camHomeEye.x, camHomeEye.y, camHomeEye.z,
                camHomeTarget.x, camHomeTarget.y, camHomeTarget.z, camHomeDistance);
    }

    std::printf(" [usage]    modelviewer.exe [<model.glb> | default|metal|rough]\n");
    std::printf("                          [--shot out.bmp] [--frames N] [--verbose] [--damping K]\n");
    std::printf("                          [--show | --hidden]   （--shot 默认隐藏窗口）\n");
    std::printf("                          [--size 1600x900]     （默认 1280x720）\n");
    std::printf("                          [--ui | --no-ui]      （控制面板显隐；--shot 默认关）\n");
    std::printf(" [鼠标]     左键旋转   右键平移   滚轮推拉   R 键复位视角   ESC 退出\n");
    std::printf(" [键盘]     F5 重新加载当前文件（导出覆盖后重看一眼，不用重启）\n");
    std::printf("            F1 开关左上角控制面板（画质 / 光照 / 地面 / 相机 / 调试）\n");
    if (uiOk) {
        std::printf(" [面板]     %s\n",
                uiCtl.showPanel ? "已打开（点面板上的勾选框即时生效）"
                                : "本轮不显示 —— 加 --ui，或运行时按 F1");
    } else {
        std::printf(" [面板]     不可用（原因见上一行），其余功能不受影响\n");
    }
    std::printf(" [拖放]     把 .glb 拖到窗口上即可加载（要自包含的 .glb，暂不支持外部 .bin/贴图）\n\n");

    if (!contentOk) {
        std::fprintf(stderr, "[fatal] 内容加载失败，退出\n");
        return 1;
    }

    MSG msg = {};
    uint64_t frameCount = 0;
    // --verbose 用：上一次打出来的相机姿态，用来只在真的动了的时候才打日志
    float3 lastCamEye    = float3{ 1e9f };
    float3 lastCamTarget = float3{ 1e9f };

    // ------------------------------------------------------------------
    // 轨道相机的阻尼（惯性平滑）
    //
    // 官方 camutils 的 ORBIT 模式**没有**任何阻尼：Manipulator::update() 是空实现
    // （libs/camutils/src/Manipulator.cpp:326），官方 FilamentApp2 里那句
    // .flightMoveDamping(15.0)（FilamentApp2.cpp:212）只作用于 FREE_FLIGHT。
    // 所以"拖动带一点迟滞、松手还会滑一小段"得我们自己加 —— **不需要额外的库**，
    // 就是下面这一小段指数平滑。
    //
    // 做法：Manipulator 照旧是"输入真值"，它的内部状态一点没动
    // （grabBegin / grabUpdate / scroll 的数学全是官方原装），我们只是把
    // **喂给相机的姿态**平滑一下：
    //      alpha = 1 - exp(-K*dt)      按时间常数收敛，跟帧率无关
    // 不用固定 alpha：帧率一变手感就变了。也不用 alpha = K*dt：dt 稍大就会超过 1，
    // 那会过冲（镜头甩过头再荡回来）。
    //
    // ★ 平滑必须做在**轨道参数**（方向 + 距离）上，不能直接插值世界坐标的
    //   eye / 注视点。两个世界坐标点之间的线性插值走的是**弦**：甩得猛的时候
    //   （一帧之内转 100° 以上）弦从球**里面**抄近路，轨道半径被削掉一大截，
    //   镜头就一头"钻进模型里"—— 这就是"左右晃会穿过模型"的原因
    //   （实测一帧甩 400px ≈ 229°，半径从 3.309 掉到 2.617，-21%，正好穿过模型外圈）。
    //
    //   改成"方位角 / 仰角 + 距离"这套轨道参数插值之后，眼睛恒在半径 dampDist
    //   的球面上，几何上不可能穿模，轨迹也是真正绕 pivot 的圆弧 —— 就是 Blender /
    //   游戏里"拖住人物转一圈"的手感：模型钉在画面正中，永远不翻身。
    //
    // ★ 这个原点必须是**真正的 pivot**，不能写死成模型中心。没平移过时两者恰好相等
    //   （OrbitManipulator.h:46 `mPivot = mTarget = props.targetPosition`，而
    //   targetPosition 喂的就是模型包围盒中心；K=0 时实测半径全程恒等于 3.3090，
    //   一点不差），但**右键平移会把 pivot 从模型中心整个搬走**。搬走之后还拿模型
    //   中心当原点，半径和朝向就全错了 —— "右键拖一下、再左右拖就穿模"正是这么来的。
    //   所以下面一律用主循环里那份影子 pivot（见 gTrackedPivot 的注释）。
    //
    // 为什么不用 camutils 自带的 Bookmark::interpolate()：
    //   Bookmark 的字段是 private，只有几个 manipulator 类是 friend
    //   （camutils/Bookmark.h:57-72），外部既读不到 phi/theta/distance 也写不进去，
    //   没法拿它当"被平滑的中间态"。官方那套插值是给"在两个存好的 bookmark 之间
    //   飞过去"用的，不是给连续拖拽做阻尼的。
    //
    // K 越大跟得越紧；K=0 就是完全 1:1 直接跟手（等于关掉）。
    //
    // dampEye / dampTarget / dampTheta / dampPhi / dampDist 这五个**声明在上面**
    // 第 6 节的开头（resetView() 旁边）：拖放加载换内容时，resetView() 要能顺手
    // 把它们一起复位到新取景，所以不能等到这儿才声明。
    double lastFrameMs = nowMs();         // 上一帧时刻，用来算 dt
    // 面板上显示的帧耗时（指数平滑，见帧循环里那一段）
    float  smoothedFrameMs = 0.0f;
    // 隐藏窗口截图时的等待起点（<0 = 还没开始等），见 beginFrame 失败那一支
    double gHiddenShotWaitStartMs = -1.0;

    while (gRunning) {
        while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE)) {
            TranslateMessage(&msg);
            DispatchMessage(&msg);
        }
        if (!gRunning) {
            break;
        }

        // ---- 面板上的按钮（一次性动作）----
        // 都走和键盘完全同一条路，不另开分支：重新加载 == F5，复位视角 == R
        if (uiCtl.requestReload) {
            uiCtl.requestReload = false;
            gReloadPending      = true;
        }
        if (uiCtl.requestReset && gManipulator) {
            uiCtl.requestReset = false;
            gManipulator->jumpToBookmark(gHomeBookmark);
            gPivotReset = true;
        }

        // ---- 面板上动过渲染相关的控件：整套设置重新落一遍 ----
        if (uiCtl.dirty) {
            applyControls();
            uiCtl.dirty = false;
        }

        // ------------------------------------------------------------------
        // 重载内容（阶段 2）：拖放加载 + F5 重新加载
        //
        // WndProc 只把路径抄进 gDropPath（F5 只置一个标志），真正换内容放在这里
        // 做（理由见 gDropPath 旁边的注释）：此时上一帧已经完整渲染完，没有
        // "拆到一半被消息打断"的风险。
        //
        // ★ 顺序是"先加载新的、成功了再拆旧的"：loadModel() 只有完全成功之后才
        //   scene->addEntities()（失败路径都在那之前就把 entity 收拾干净了），
        //   所以拿一个临时 Model 去试，失败时当前内容一点没动 —— 拖进来一个坏
        //   文件（或者 F5 时磁盘上的文件被删了），画面保持原样，只多一行报错。
        //   两个模型同时挂在场景里只有这一帧之前的一瞬间，渲染开始前旧的就已经
        //   被移走了，看不见。
        // ------------------------------------------------------------------
        if (gDropPending || gReloadPending) {
            const bool  fromDrop = gDropPending;
            const char* tag      = fromDrop ? "drop" : "reload";
            gDropPending   = false;
            gReloadPending = false;
            const std::string target = fromDrop ? gDropPath : modelPath;

            Model fresh;
            if (loadModel(engine, scene, target.c_str(), fresh)) {
                if (triangleMode) {
                    // 从"三角形调试靶子"切到模型：把三角形那套资源拆掉
                    engine->destroy(renderable);
                    engine->destroy(mi);
                    engine->destroy(material);
                    engine->destroy(vb);
                    engine->destroy(ib);
                    triangleMode = false;
                } else {
                    destroyModel(scene, model);   // 旧模型的实体/缓冲/材质
                }
                model     = fresh;                // Model 是纯指针结构，直接搬
                modelPath = target;
                updateContentInfo();              // 面板"信息"栏跟着换
                resetView();                      // 相机按新包围盒重新就位

                std::printf("\n[%s] 加载 %s\n", tag, target.c_str());
                printLoaded(modelPath, model);
                if (verbose) {
                    std::printf("[camera] home eye=(%.3f %.3f %.3f) target=(%.3f %.3f %.3f) 距离=%.3f\n",
                            camHomeEye.x, camHomeEye.y, camHomeEye.z,
                            camHomeTarget.x, camHomeTarget.y, camHomeTarget.z, camHomeDistance);
                }
                std::fflush(stdout);

                SetWindowTextW(hwnd, windowTitle(triangleMode, modelPath).c_str());
                // 相机刚被整体搬走，让 --verbose 立刻打一行新的姿态
                lastCamEye    = float3{ 1e9f };
                lastCamTarget = float3{ 1e9f };
            } else {
                std::fprintf(stderr, "[%s] 加载失败，保持当前内容不变：%s\n",
                        tag, target.c_str());
                std::fflush(stderr);
            }
        }

        const uint32_t w = static_cast<uint32_t>(gWidth);
        const uint32_t h = static_cast<uint32_t>(gHeight);
        const float aspect = static_cast<float>(w) / static_cast<float>(h);

        view->setViewport({ 0, 0, w, h });

        // 相机姿态来自轨道相机；投影每帧现算，近/远平面跟着推拉距离走
        // （推近了不收近平面会 z-fighting，拉远了不放大远平面会切掉模型）。
        float3 camEye, camTarget, camUp;
        gManipulator->getLookAt(&camEye, &camTarget, &camUp);

        // ---- 轨道中心（影子 pivot）----
        // 见 gTrackedPivot 的注释。只有右键平移会搬动它，而且位移量恰好等于 eye 的
        // 位移量（OrbitManipulator.h:104-105：eye / target / pivot 同步平移）；
        // R 键复位时它跟着 mPivot 一起回到模型中心。
        // 用"起点 + 位移"这种绝对形式，而不是逐帧累加，免得长时间拖拽后攒出漂移。
        if (gPanning) {
            gTrackedPivot = gPanPivot0 + (camEye - gPanEye0);
        } else if (gPivotReset) {
            gTrackedPivot = camHomeTarget;
        }
        gPivotReset = false;
        const float3 pivot = gTrackedPivot;

        // ---- 阻尼：把上面的"输入真值"平滑成实际喂给相机的姿态 ----
        // 见主循环前面那段注释（为什么自己加、为什么不用 Bookmark::interpolate）。
        const double nowFrameMs = nowMs();
        const float  dt = std::max(0.0f,
                static_cast<float>((nowFrameMs - lastFrameMs) * 0.001));
        lastFrameMs = nowFrameMs;

        // 已经贴上了（或者 K=0 关掉了）就**完全照抄**真值。
        // 必须是完全照抄，不能"平滑一下但值几乎一样"：--shot 的第 1 帧就是靠
        // 这条分支和 home 姿态 bit-exact，md5 才能继续当回归基线用。
        if (damping <= 0.0f ||
            length2(dampEye - camEye) + length2(dampTarget - camTarget) < 1e-10f) {
            dampEye    = camEye;
            dampTarget = camTarget;
            // 轨道参数也同步回真值，下次真开始动的时候起点才是对的
            const float3 v = camEye - pivot;
            dampDist = length(v);
            toSpherical(dampDist > 1e-6f ? v / dampDist : float3{ 0.0f, 0.0f, 1.0f },
                    &dampTheta, &dampPhi);
        } else {
            // 卡顿（窗口被拖走 / 长时间被盖住）时 dt 会很大，这时直接贴合，
            // 别让镜头慢悠悠地"飘"过去。
            const float alpha = dt < 0.25f ? 1.0f - std::exp(-damping * dt) : 1.0f;

            // ★ 只在**轨道参数**上平滑：方位角 / 仰角 / 距离
            //   （原因见主循环前面那段注释 —— 直接插值世界坐标的两个点走的是弦，
            //    甩得猛就会抄近路穿进模型里）。
            const float3 vTrue = camEye - pivot;
            const float  dTrue = length(vTrue);
            const float3 uTrue = dTrue > 1e-6f ? vTrue / dTrue
                                               : float3{ 0.0f, 0.0f, 1.0f };
            float thetaTrue, phiTrue;
            toSpherical(uTrue, &thetaTrue, &phiTrue);

            dampDist += (dTrue - dampDist) * alpha;
            dampPhi  += (phiTrue - dampPhi) * alpha;
            // theta 是 2π 周期的：先取离当前值最近的那个代表元，不然跨 ±π
            //（比如从 +179° 转到 -179°）会"绕远路"整整转一圈回去。
            const float kTwoPi = 2.0f * 3.14159265358979f;
            float dTheta = thetaTrue - dampTheta;
            dTheta -= kTwoPi * std::round(dTheta / kTwoPi);
            dampTheta += dTheta * alpha;
            dampTheta -= kTwoPi * std::round(dampTheta / kTwoPi);   // 归一，别越滚越大

            const float3 uDamp = fromSpherical(dampTheta, dampPhi);
            dampEye    = pivot + uDamp * dampDist;
            // 注视点恒在眼睛正前方 1.0 处，和真值同构
            // （OrbitManipulator.h:181: mTarget = mEye + dir * ±1.0）：
            // 相机永远**正对 pivot**，转的过程中模型不会从画面正中跑掉。
            // 滚轮推到"翻过中心"之后真值的符号会反过来（mFlipped），这里跟着它。
            const float flip = dot(camTarget - camEye, uTrue) > 0.0f ? 1.0f : -1.0f;
            dampTarget = dampEye + uDamp * flip;
            // "上"方向跟着平滑后的视线重算，不能用真值那份：竖直方向甩的时候
            // 两者的夹角就是滞后角，混用会让画面在追赶过程中短暂歪一下（roll）。
            const float3 gaze  = normalize(dampTarget - dampEye);
            const float3 right = cross(gaze, float3{ 0.0f, 1.0f, 0.0f });
            if (length2(right) > 1e-8f) {
                camUp = cross(normalize(right), gaze);
            }
        }

        // ★ 别拿 length(camEye - camTarget) 当"距离"！
        //   jumpToBookmark() 故意把 mTarget 放在 mEye 正前方**恰好 1 个单位**
        //   （OrbitManipulator.h:181: mTarget = mEye + dir * ±1.0），所以那个长度
        //   恒等于 1.0，推拉到哪儿都一样。用它算远平面会固定成 1+radius*4 ≈ 7.6，
        //   滚轮往外拉几格模型就被整个裁没了。
        //
        //   也不用 bookmark.orbit.distance —— 那个字段是 private（只有 manipulator
        //   几个类是 friend），API 本来就只开放 getLookAt。
        //
        //   换个思路更直接：**模型不动，动的是相机**。所以拿"相机到模型包围球心
        //   的距离"就能把包围球整个框进近/远平面，跟 pivot 怎么被平移无关。
        const float3 camSphereCenter = camHomeTarget;          // 世界坐标下的包围球心
        const float  centerDist = length(dampEye - camSphereCenter);

        // 最近的面在 centerDist - radius，最远的在 centerDist + radius。
        // 近平面取最近面的一成（推近了也不会切到模型），
        // 远平面留 1.5 倍半径的余量。
        //
        // ★ 远平面还必须把**地面**装进去：地面从相机脚下一直铺到地平线（边长
        //   kGroundSideFactor 倍半径），只按模型算的话会在半路横切一刀，
        //   画面上出现一条莫名其妙的直边（地面被裁掉的地方露出天空盒）。
        //   多出来的这点深度范围对 reversed-Z 的深度精度没有影响。
        const float camNear = std::max((centerDist - camRadius) * 0.1f, camRadius * 0.001f);
        const float camFar  = centerDist + camRadius * 1.5f
                            + camRadius * kGroundSideFactor * 0.5f;
        // 视场角来自面板（默认 45°，和以前一样）。这条路径每帧都跑，
        // 所以拖动"视场角"滑块是即时生效的；要按新角度重新取景再按 R。
        camera->setProjection(uiCtl.fovDeg, aspect, camNear, camFar);
        // 注意这里喂的是 damp*（平滑后的姿态），不是上面的 cam*（Manipulator 真值）。
        // 旋转 / 平移 / 推拉 / R 键复位全都过这一道，所以它们一起变柔和了。
        camera->lookAt(dampEye, dampTarget, camUp);

        // --verbose 时把相机的实际移动打出来。只在姿态真的变了才打 ——
        // 否则每帧一行会刷屏。这是验证鼠标事件确实喂进 Manipulator 的手段。
        if (verbose) {
            if (length2(dampEye - lastCamEye) > 1e-6f ||
                length2(dampTarget - lastCamTarget) > 1e-6f) {
                std::printf("[camera] frame=%llu  eye=(%.3f %.3f %.3f)  raw=(%.3f %.3f %.3f)  到模型=%.3f  near=%.3f far=%.3f\n",
                        static_cast<unsigned long long>(frameCount),
                        dampEye.x, dampEye.y, dampEye.z,
                        camEye.x, camEye.y, camEye.z, centerDist, camNear, camFar);
                std::fflush(stdout);
                lastCamEye    = dampEye;
                lastCamTarget = dampTarget;
            }
        }

        if (triangleMode) {
            // 绕 Y 轴慢慢转，让 IBL 的高光扫过表面。
            // 用**帧号**而不是墙上时间：这样 --shot 永远截在第 1 帧（角度 0），
            // 三角形也就成了可复现的回归基线（时间驱动的旋转每次截图角度都不同，
            // 实测两次跑的 md5 就不一样）。代价是转速随帧率变 —— 调试靶子可以接受，
            // 模型那条路本来就是静态角度。
            auto& tcm = engine->getTransformManager();
            tcm.setTransform(tcm.getInstance(renderable),
                    mat4f::rotation(static_cast<float>(frameCount) * 0.006f,
                            float3{ 0.0f, 1.0f, 0.0f }));
        }

        // ------------------------------------------------------------------
        // 控制面板：先填只读信息，再让它生成这一帧的 ImGui 命令
        //
        // ★ 顺序是"填信息 -> render(生成命令) -> beginFrame -> render(面板 View)"。
        //   官方 FilamentApp2.cpp:572 那句注释说得很清楚：不管 Filament 这一帧
        //   要不要跳过，ImGui 的命令都得先生成一遍。
        // ------------------------------------------------------------------
        if (uiOk && uiCtl.showPanel) {
            // 帧耗时做个指数平滑，不然数字跳得没法看
            const float frameMsNow = static_cast<float>(dt * 1000.0);
            smoothedFrameMs += (frameMsNow - smoothedFrameMs) * 0.1f;

            UiControls::Info& info = uiCtl.info;
            info.frameMs   = smoothedFrameMs;
            info.fps       = smoothedFrameMs > 0.01f ? 1000.0f / smoothedFrameMs : 0.0f;
            info.width     = gWidth;
            info.height    = gHeight;
            info.frameIndex = frameCount;
            // 上一帧视锥内实际画了多少个可绘制对象（用来看剔除的效果）
            info.visibleRenderables = view->getVisibleRenderableCount();

            info.eye[0]    = dampEye.x;    info.eye[1]    = dampEye.y;    info.eye[2]    = dampEye.z;
            info.target[0] = dampTarget.x; info.target[1] = dampTarget.y; info.target[2] = dampTarget.z;
            info.pivot[0]  = pivot.x;      info.pivot[1]  = pivot.y;      info.pivot[2]  = pivot.z;
            info.distToCenter  = centerDist;
            info.nearZ         = camNear;
            info.farZ          = camFar;
            info.radius        = camRadius;
            info.groundReady   = ground.ready;
            info.groundSpacing = uiCtl.groundSpacing;

            uiLayer.setDisplaySize(gWidth, gHeight);
            uiLayer.render(dt, uiCtl);
        }

        if (renderer->beginFrame(swapChain)) {
            renderer->render(view);

            // 控制面板叠在主画面上面。★ 必须是**第二个** view：
            //   ImGuiHelper 把它设成 BlendMode::TRANSLUCENT，它只叠加、不清屏，
            //   主画面的内容原样保留（官方 FilamentApp2.cpp:695-697 也是这个顺序）。
            if (uiOk && uiCtl.showPanel) {
                renderer->render(uiLayer.view());
            }

            // 截图：必须在 beginFrame 之后、endFrame 之前发出。
            // 放在两遍渲染**之后** —— 默认不画面板时和以前逐像素一致，
            // 加 --ui 时能把面板一起截进来。
            if (shot.pending && shot.path) {
                shot.pending = false;
                const size_t size = static_cast<size_t>(w) * h * 4;
                renderer->readPixels(0, 0, w, h,
                        backend::PixelBufferDescriptor(
                                std::malloc(size), size,
                                backend::PixelDataFormat::RGBA,
                                backend::PixelDataType::UBYTE,
                                &Screenshot::onPixels, &shot));
            }

            renderer->endFrame();
        } else {
            // beginFrame 返回 false = 这一帧被跳过（窗口被遮挡/最小化、有异步读回没完成等）。
            // 此时必须让出 CPU，否则这个循环会以每秒几百万次的速度空转烧满一个核
            // —— 实测过 12ms 里空转 8.7 万次的惨状。
            //
            // ★ 隐藏窗口 + --shot 时加一道保险：个别驱动对"从不显示的窗口"就是不出帧，
            //   那样 --shot 会无声地卡死。等够 10 秒就把窗口显示出来重试，并且**说一声**，
            //   别留下一个查不出原因的挂起。
            if (shot.path && gWindowHidden) {
                if (gHiddenShotWaitStartMs < 0.0) {
                    gHiddenShotWaitStartMs = nowMs();
                } else if (nowMs() - gHiddenShotWaitStartMs > 10000.0) {
                    std::fprintf(stderr,
                            "[shot] 隐藏窗口 10 秒没出帧（驱动不出帧），改成显示窗口重试\n");
                    std::fflush(stderr);
                    ShowWindow(hwnd, SW_SHOW);
                    gWindowHidden = false;
                    gHiddenShotWaitStartMs = -1.0;
                }
            }
            Sleep(1);
            continue;
        }

        ++frameCount;

        if (framesLimit > 0 && frameCount >= framesLimit) {
            gRunning = false;
        }

        // 截图落盘后立刻退出进程，跳过 Filament 的清理。
        //
        // 原因（实测数据，见 README）：readPixels 是异步的。如果读回在销毁 Renderer
        // 之前就已经完成，Engine::destroy(Renderer*) 里那句 FENCE_WAIT_FOR_EVER 会
        // 卡住 8~11 秒；反过来，如果读回还挂在队列里、让它在 teardown 期间完成，
        // 整个清理只要 ~140ms。与其跟这个行为较劲，不如直接退出：
        // 进程马上就死了，操作系统会回收资源，而且 BMP 早就写完落盘了。
        if (shot.path && shot.finished) {
            std::printf("[shot] 完成于 T=%.1f ms，直接退出（跳过清理）\n", nowMs());
            std::fflush(stdout);
            std::_Exit(0);
        }
    }

    // ------------------------------------------------------------------
    // 7. 清理
    //
    // ★ 第一件事：立刻把窗口隐藏掉。
    //
    //   用户按下 X / ESC 之后，我们还要花时间销毁一堆 GPU 资源。这段时间里
    //   窗口是"活着但不再响应消息"的状态，Windows 会把它画成白板 + 标题栏挂
    //   "未响应"，看起来就像"关不掉、在等清理"。
    //
    //   ShowWindow(SW_HIDE) 是瞬间返回的，而且绝对安全 —— 窗口对象还在，
    //   Filament 内部持有的 HWND 仍然有效，只是不在屏幕上显示了。
    //
    //   这里不能直接 DestroyWindow：后面 destroy(renderer) / destroy(swapChain)
    //   还会用到这个 HWND（销毁 GL context 时要用它的 DC），提前销毁会让
    //   Filament 拿到野指针。真正的 DestroyWindow 放在下面。
    //
    // 销毁顺序抄自官方 FilamentApp2.cpp:744-784 的 shutdown()：
    //     场景资源 -> 相机/View -> Renderer -> SwapChain -> DestroyWindow
    //     -> Scene -> Engine::destroy
    // 也就是官方同样把窗口放在 Engine::destroy 之前销毁。
    // ------------------------------------------------------------------
    Stopwatch sw;
    ShowWindow(hwnd, SW_HIDE);
    const double hiddenAt = sw.ms();

    const auto step = [&sw, verbose](const char* name, auto fn) {
        const double t0 = sw.ms();
        fn();
        if (verbose) {
            std::printf("[shutdown] %-24s %8.1f ms   累计 %8.1f ms\n",
                    name, sw.ms() - t0, sw.ms());
            std::fflush(stdout);
        }
    };

    // ★ 模型资源必须最先拆：它用着 materials 建的材质，而且实体得在
    //   scene 还在的时候就移出去。顺序和 destroyModel() 完全一致，
    //   这里展开写只是为了能用 step() 打出每一步的耗时。
    if (!triangleMode) {
        step("scene entities",    [&] {
            scene->removeEntities(model.asset->getEntities(), model.asset->getEntityCount());
        });
        step("asset",             [&] { model.assetLoader->destroyAsset(model.asset); });
        step("materials",         [&] { model.materials->destroyMaterials(); });
        step("material provider", [&] { delete model.materials;      model.materials      = nullptr; });
        step("resource loader",   [&] { delete model.resourceLoader; model.resourceLoader = nullptr; });
        step("stb decoder",       [&] { delete model.stbDecoder;     model.stbDecoder     = nullptr; });
        step("ktx2 decoder",      [&] { delete model.ktxDecoder;     model.ktxDecoder     = nullptr; });
        step("asset loader",      [&] { gltfio::AssetLoader::destroy(&model.assetLoader); });
    } else {
        step("renderable",        [&] { engine->destroy(renderable); });
        step("material instance", [&] { engine->destroy(mi); });
        step("material",          [&] { engine->destroy(material); });
        step("vertex buffer",     [&] { engine->destroy(vb); });
        step("index buffer",      [&] { engine->destroy(ib); });
    }
    step("ground",            [&] { destroyGround(engine, scene, ground); });
    step("sun light",         [&] { engine->destroy(sunEntity); });
    step("indirect light",    [&] { engine->destroy(env.indirectLight); });
    step("skybox",            [&] { engine->destroy(env.skybox); });
    step("fallback skybox",   [&] { if (fallbackSkybox) engine->destroy(fallbackSkybox); });
    step("ibl texture",       [&] { engine->destroy(env.iblTexture); });
    step("skybox texture",    [&] { engine->destroy(env.skyTexture); });
    step("manipulator",       [&] { delete gManipulator; gManipulator = nullptr; });
    step("camera",            [&] {
        engine->destroyCameraComponent(cameraEntity);
        EntityManager::get().destroy(cameraEntity);
    });
    // 面板：拆掉 ImGui（上下文/字体/顶点缓冲）+ 它那个专用 View。
    // 排在 main view 前面只是为了顺手，两个 View 之间没有依赖。
    step("ui panel",          [&] {
        gUi    = nullptr;   // 先断开 WndProc 的入口，免得拆到一半还有消息进来
        gUiCtl = nullptr;
        uiLayer.destroy(engine);
    });
    step("view",              [&] { engine->destroy(view); });
    step("renderer",          [&] { engine->destroy(renderer); });
    step("swapchain",         [&] { engine->destroy(swapChain); });

    // ★ 窗口在这里就消失，后面的慢活用户看不见
    step("DestroyWindow",     [&] { DestroyWindow(hwnd); });

    step("scene",             [&] { engine->destroy(scene); });
    step("Engine::destroy",   [&] { Engine::destroy(&engine); });

    std::printf("[shutdown] 清理耗时 %.0f ms（窗口在第 %.0f ms 就消失了）\n",
            sw.ms(), hiddenAt);
    std::fflush(stdout);
    return 0;
}
