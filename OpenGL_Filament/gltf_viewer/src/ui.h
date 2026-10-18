// ============================================================================
//  ui.h —— 阶段 3：ImGui 控制面板
//
//  分工（这是本文件存在的全部理由）：
//    * ui.cpp 只负责**画面板**和 ImGui 的生命周期，一行渲染代码都不碰；
//    * main.cpp 每帧读下面的 UiControls，自己决定要不要把它落到 View / Scene /
//      Light / 地面材质上。
//
//  面板改值 -> UiControls 里的字段变了 -> main.cpp 发现 ctl.dirty 就把整套
//  设置重新应用一遍。用一个 dirty 布尔而不是逐字段比较，是因为 ImGui 的每个
//  控件本来就会返回"这一帧被改过没有"，顺手或一下最省事。
//
//  ★ UiControls 的**默认值必须和 main.cpp 的出厂设置逐字一致**（都是照官方
//    gltf_viewer 抄的那一套）。因为脏值只由"用户动了控件"触发，默认值对不上
//    的话，面板显示的数字就和真实渲染状态不符。
//
//  为什么单独一个 View：filagui::ImGuiHelper 会**接管**传给它的那个 View ——
//  换掉它的 camera、setScene(自己的 UI 场景)、setBlendMode(TRANSLUCENT)，
//  好让 UI 叠在已经画好的主画面上。官方 FilamentApp2.cpp:205 也是专门建了一个
//  "UI View"，然后每帧 render(主 View) 之后再 render(UI View)。
// ============================================================================
#pragma once

#ifndef NOMINMAX
#define NOMINMAX
#endif
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#include <windows.h>

#include <cstddef>
#include <cstdint>
#include <string>

namespace filament { class Engine; class View; }
namespace filagui { class ImGuiHelper; }
struct ImGuiContext;

// ---------------------------------------------------------------------------
// 面板上的旋钮 + 面板显示的只读信息
// ---------------------------------------------------------------------------
struct UiControls {
    // ===== 画质（对应 View 上那批 set*）=====
    // 默认值来源：libs/viewer/src/ViewerGui.cpp:427-453（官方 gltf_viewer 构造函数）
    bool  postProcessing  = true;     // 后处理。★ ACES tone mapping 挂在这上面，关掉画面会"平"
    bool  msaa            = true;
    int   msaaSamples     = 4;       // 4 / 8
    int   aaMode          = 1;       // 0 = 关, 1 = FXAA（和 MSAA 可以叠加）
    bool  ssao            = true;
    int   ssaoQuality     = 2;       // 0..3 = LOW / MEDIUM / HIGH / ULTRA（官方是 HIGH）
    bool  bloom           = true;
    float bloomStrength   = 0.10f;   // BloomOptions::strength 的出厂值
    bool  shadows         = true;
    int   shadowType      = 0;       // 0=PCF 1=PCSS 2=VSM 3=DPCF
    bool  dithering       = true;    // TEMPORAL（官方默认）
    bool  frustumCulling  = true;

    // ===== 光照 =====
    bool  ibl             = true;    // ⚠ 关掉 = 只剩太阳直接光，画面会黑一大截（调试用）
    bool  skybox          = true;    // 天空盒（也是 IBL 的可视化）
    float sunIntensity    = 100000.0f;   // lux（SUN 就是这个量级）
    // 太阳方向用高度角 / 方位角给，比直接摆 xyz 向量直观。
    // 默认 (45°, 36.87°) 反算出来正是官方 Settings.h:265-274 的 {0.6,-1,-0.8}。
    float sunElevationDeg = 45.0f;
    float sunAzimuthDeg   = 36.87f;

    // ===== 地面网格（阶段 2 那块板子）=====
    // 默认值来源：main.cpp 的 placeGround()（阶段 2 调出来的那套）
    bool  groundVisible   = true;
    bool  groundAutoSpacing = true;  // 勾上 = 格距按模型半径吸附到 2 的整数次幂
    float groundSpacing   = 0.25f;   // 取消自动时生效（世界单位）
    float groundBaseAlpha = 0.72f;   // 底色不透明度（太透就看不清阴影）
    float groundLineAlpha = 0.95f;   // 网格线不透明度
    float groundFadeScale = 3.0f;    // 淡出半径 = 包围球半径 × 这个
    float groundFadeStart = 0.25f;   // 从哪一个比例开始淡出
    float groundRoughness = 0.85f;

    // ===== 相机 / 交互 =====
    float damping         = 15.0f;   // 阻尼速率 K（--damping）；0 = 完全手跟手
    float fovDeg          = 45.0f;   // 视场角。改了**不会**自动重新取景，按 R 才重算
    bool  requestReset    = false;   // 「复位视角」按钮（等价于按 R）
    bool  requestReload   = false;   // 「重新加载」按钮（等价于按 F5）

    // ===== 面板自身 / 调试 =====
    bool  showPanel       = true;    // F1 切换；--shot 默认关（见 main.cpp 的参数解析）
    bool  logCamera       = false;   // 等价于 --verbose：把每帧相机姿态打到控制台
    bool  dirty           = false;   // 面板动过任何控件 -> main.cpp 重新应用整套设置

    // ===== 只读信息（main.cpp 每帧填，面板只显示）=====
    struct Info {
        float  frameMs      = 0.0f;      // 平滑后的每帧耗时
        float  fps          = 0.0f;
        int    width        = 0;
        int    height       = 0;
        const char* backend = "OpenGL";
        uint64_t frameIndex = 0;

        std::string content;             // 模型路径，或 "PBR 三角形（调试靶子）"
        bool   isTriangle   = false;
        size_t entities     = 0;
        size_t renderables  = 0;
        int    visibleRenderables = 0;   // View::getVisibleRenderableCount()（上一帧）
        float  boundsMin[3] = { 0, 0, 0 };
        float  boundsMax[3] = { 0, 0, 0 };

        float  eye[3]       = { 0, 0, 0 };
        float  target[3]    = { 0, 0, 0 };
        float  pivot[3]     = { 0, 0, 0 };
        float  distToCenter = 0.0f;
        float  nearZ        = 0.0f;
        float  farZ         = 0.0f;
        float  radius       = 0.0f;

        bool   groundReady  = false;
        float  groundSpacing = 0.0f;     // 实际生效的格距（自动时是算出来的那个）
    } info;
};

namespace ui {

// 面板宽度（像素）。固定侧边栏：位置/大小每帧都强制设一遍，
// 于是 ImGui 的布局持久化（.ini）对它没有任何影响，截图可复现。
constexpr float kPanelWidth = 340.0f;

// 画面板。只读 / 写 UiControls，不接触 Filament。
void drawPanel(UiControls& c);

// ---------------------------------------------------------------------------
// ImGui 那一套生命周期 + 输入，封装成一个对象
//
// 用法（见 main.cpp）：
//      UiLayer ui;
//      if (ui.create(engine, hwnd)) { ... }
//      // WndProc 里：gUi->feedMessage(hwnd, msg, wParam, lParam);
//      // 每帧：     ui.setDisplaySize(w, h);  ui.render(dt, ctl);
//      // 渲染：     renderer->render(mainView);  renderer->render(ui.view());
//      // 退出：     ui.destroy(engine);
// ---------------------------------------------------------------------------
class UiLayer {
public:
    // 建 ImGui 上下文 + 字体 + 专用 View + Win32 后端。
    // 读不到 materials/uiBlit.filamat 时返回 false（并在 stderr 说明原因），
    // 此时 ready() 为 false，调用方跳过所有 UI 代码即可 —— 不致命。
    bool create(filament::Engine* engine, HWND hwnd);

    // 必须排在 Engine::destroy 之前（和 View 同一条规矩）
    void destroy(filament::Engine* engine);

    bool  ready() const noexcept { return mReady; }

    // 交给 renderer->render() 叠在主画面上的那个 View
    filament::View* view() const noexcept { return mView; }

    // 鼠标/键盘该给面板还是给相机（官方 FilamentApp2.cpp:509 就是这么用的）
    bool wantsMouse() const noexcept;
    bool wantsKeyboard() const noexcept;

    // WndProc 收到消息后原样转发一份过来（交给官方 Win32 后端翻成 ImGui 事件）
    void feedMessage(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam);

    // 窗口尺寸变了要告诉 ImGui（它同时也定 UI View 的正交投影和视口）
    void setDisplaySize(int width, int height);

    // 每帧一次：生成 ImGui 命令 + 把 UI 场景填好，之后 renderer->render(view())
    void render(float dtSeconds, UiControls& c);

private:
    filament::Engine*      mEngine   = nullptr;
    filament::View*        mView     = nullptr;
    filagui::ImGuiHelper*  mHelper   = nullptr;
    ImGuiContext*          mContext  = nullptr;   // 本工程自己建的 ImGui 上下文
    bool                   mWin32Ok  = false;
    bool                   mReady    = false;
    int                    mWidth    = 0;
    int                    mHeight   = 0;
};

}  // namespace ui
