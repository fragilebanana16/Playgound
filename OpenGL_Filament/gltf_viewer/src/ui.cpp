// ============================================================================
//  ui.cpp —— 阶段 3：ImGui 控制面板（实现）
//
//  这里**不出现任何渲染逻辑**：面板只管读写 UiControls（见 ui.h 的分工说明）。
//  唯一碰 Filament 的地方是最下面那个 UiLayer —— 它负责 ImGui 需要的那个
//  专用 View，以及把 ImGui 的 draw list 交给 filagui::ImGuiHelper 去画。
//
//  ImGui 的渲染路径（官方原装，一行没改）：
//      ImGui::Render() 出的 draw list
//        -> filagui::ImGuiHelper 打包成 VertexBuffer / IndexBuffer
//        -> 每个 draw command 一个 MaterialInstance（materials/uiBlit.filamat）
//        -> 挂在 ImGuiHelper 自己的 Scene 上
//        -> 主画面画完后，renderer->render(UI View) 叠上去
// ============================================================================
#include "ui.h"

#include <imgui.h>
#include <imgui_impl_win32.h>

// ★ 官方 1.92 的 imgui_impl_win32.h **只声明了 DPI / alpha 那几个辅助函数**，
//   消息处理函数没在里面（官方的 example_win32_* 也是自己在主程序里声明的），
//   所以这里照着 imgui_impl_win32.cpp:615 的原样再声明一次。
extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(
        HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

#include <filament/Engine.h>
#include <filament/View.h>
#include <filament/Viewport.h>

#include <filagui/ImGuiHelper.h>

#include <utils/Path.h>

#include <cmath>
#include <cstdio>
#include <string>

using namespace filament;

namespace ui {

namespace {

// ---------------------------------------------------------------------------
// 字体
//
// ImGui 自带的字体（ProggyClean）**只有 ASCII** —— 面板里的中文会显示成一排 "?"。
// 所以从系统字体目录挑一个中文字体来用：
//   * 不往仓库里塞十几 MB 的字体文件，任何 Windows 都自带这几个；
//   * 一个都找不到就退回 ImGui 自带字体（面板照样能用，只是中文看不见），
//     不会因为"少个字体"就跑不起来。
// 字模范围 = 常用汉字（约 2500 个）+ 基本拉丁 + 下面这一串补漏。
// 17px 下一张 2K 贴图就够。
// ---------------------------------------------------------------------------
const char* const kCjkFontCandidates[] = {
    "C:/Windows/Fonts/msyh.ttc",     // 微软雅黑（Win7 起自带）
    "C:/Windows/Fonts/simhei.ttf",   // 黑体
    "C:/Windows/Fonts/Deng.ttf",     // 等线
};

// ★ 面板会用到的 CJK / 全角字符，**全部**列在这里（不只是"常用 2500 汉字"表里没有的）。
//   少一个字的后果是 ImGui 把它画成一个 "?" —— 而且是静默的，所以：
//     * 下面有一道运行时自检（verifyFontCoverage），缺哪个字模就按 U+XXXX 打到控制台；
//     * 构建时还有一道体检（tools\check-ui-glyphs.ps1，POST_BUILD 跑）：
//       它把本文件所有**字符串字面量**里的 CJK / 全角字符抠出来，只要有一个不在这串里
//       就**让构建失败**。所以改了面板文案**必须**重跑一次生成、把这串更新掉。
//
//   生成办法（就是下面这串）：
//     powershell -File tools\check-ui-glyphs.ps1 -Print
//   那个脚本先用状态机把注释剥掉、再抠字面量 —— 不能用正则直接扫：本文件注释里
//   也有引号，一个引号就能把后面的字面量配对全带偏（踩过）。也不要
//   `Get-Content -Raw`：PS 5.1 会按 ANSI 读无 BOM 的 UTF-8，中文直接打碎。
//
//   下面这串是这么抠出来的（按码点排序，含"帧""锥""幂"这类常用表里没有的）。
const char* const kPanelGlyphs =
        "、。一丁上下不与两个中串为主举久么之也了于些以件价任份会位体何侧信候先光免全关其内再写出函别到制前剔剩加动包化升半印去取变叠口只可台右吃名后含启吸周命和响回围固图在地场块型基境处复够大天太失好姿字存它完官定实容宽对射小少就尼局左己已布带帧常幂平序底废度建弃强当影径很得循心必态性息惯成截所手才打找把抖抗折抠拉拿持挂指按挺掉接控推撑收改放效数整文新方时明映是显景有期未本机来松板构枚果染查栅标栏样格框模次止正段每汉没泛消淡清渲源滑滚漏点照状环现理生用画留的盒直相看真码示离种移空窄窗第等签算类粗糊糙线组经绘给编缺网置而耗背能自致色范蔽藏行补表被裁要见视角认让设试话说读调败质贵起越跑距跟路转轮软载边过返还这进退透逐造遍遮那都采里重量针锥键锯长间阳阴阻附除随隐集面顺须高黑默齿（），：；";

// ★ 这份 ranges 的生命周期要挺到**图集建好**为止：ImGuiHelper 是在它自己的
//   构造函数（也就是下面 AddFontFromFileTTF 返回之后）才调 GetTexDataAsRGBA32()
//   真正去栅格化的，而 ImFontConfig 里存的是这个数组的**指针**。所以放全局。
ImVector<ImWchar> gFontRanges;

// 建完字体逐字查一遍：kPanelGlyphs 里每个字都得有字模。
// 缺字直接在控制台点名（用 U+XXXX，免得被控制台编码吃掉）。
void verifyFontCoverage(ImFont* font) {
    std::string missing;
    char        buf[16];
    for (const unsigned char* p = reinterpret_cast<const unsigned char*>(kPanelGlyphs);
            *p != 0; ) {
        unsigned int cp;
        if (p[0] < 0x80)      { cp = p[0];                                     p += 1; }
        else if (p[0] < 0xE0) { cp = ((p[0] & 0x1Fu) << 6) | (p[1] & 0x3Fu);   p += 2; }
        else                  { cp = ((p[0] & 0x0Fu) << 12) | ((p[1] & 0x3Fu) << 6)
                                     | (p[2] & 0x3Fu);                         p += 3; }
        if (!font->IsGlyphInFont(static_cast<ImWchar>(cp))) {
            std::snprintf(buf, sizeof(buf), "U+%04X ", cp);
            missing += buf;
        }
    }
    if (!missing.empty()) {
        std::printf("[ui] 字体里缺这些字模（会显示成 ?）：%s\n", missing.c_str());
        std::fflush(stdout);
    }
}

void addUiFont(ImGuiIO& io) {
    // 常用汉字 + 基本拉丁，再把手写的那串补漏加进去
    ImFontGlyphRangesBuilder builder;
    builder.AddRanges(io.Fonts->GetGlyphRangesChineseSimplifiedCommon());
    builder.AddText(kPanelGlyphs);
    builder.BuildRanges(&gFontRanges);

    for (const char* path : kCjkFontCandidates) {
        if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES) {
            continue;
        }
        ImFont* font = io.Fonts->AddFontFromFileTTF(path, 17.0f, nullptr,
                gFontRanges.Data);
        if (font != nullptr) {
            std::printf("[ui] 面板字体：%s（%d 段字模范围）\n", path, gFontRanges.Size / 2);
            std::fflush(stdout);
            verifyFontCoverage(font);
            return;
        }
    }
    io.Fonts->AddFontDefault();
    std::printf("[ui] 没找到中文字体，面板退回 ImGui 自带字体（中文会显示成 ?）\n");
    std::fflush(stdout);
}

// 顺序必须和 filament::ShadowType 的枚举顺序一致（Options.h: PCF=0, VSM=1,
// DPCF=2(已废弃), PCSS=3）—— 面板存的就是这个整数。
const char* const kSsaoQualities[] = { "LOW", "MEDIUM", "HIGH（官方默认）", "ULTRA" };
const char* const kShadowTypes[]   = {
        "PCF（官方默认）", "VSM", "DPCF（已废弃→PCSS）", "PCSS（软阴影，贵）" };

}  // namespace

// ---------------------------------------------------------------------------
// 面板本体
// ---------------------------------------------------------------------------
void drawPanel(UiControls& c) {
    const ImGuiIO& io = ImGui::GetIO();

    // 固定侧边栏：位置和大小每帧都强制设一遍，ImGui 的 .ini 布局持久化对它
    // 没有任何影响（io.IniFilename 在 create() 里也直接关掉了），截图可复现。
    ImGui::SetNextWindowPos(ImVec2(0.0f, 0.0f), ImGuiCond_Always);
    ImGui::SetNextWindowSize(ImVec2(kPanelWidth, io.DisplaySize.y), ImGuiCond_Always);
    ImGui::SetNextWindowBgAlpha(0.88f);

    const ImGuiWindowFlags flags =
            ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoResize |
            ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoCollapse |
            ImGuiWindowFlags_NoBringToFrontOnFocus | ImGuiWindowFlags_NoSavedSettings;

    if (!ImGui::Begin("ModelViewer 控制面板", nullptr, flags)) {
        ImGui::End();
        return;
    }

    // 面板改过任何"渲染状态"控件就置一次 dirty（见 ui.h 的说明）。
    // 阻尼 / 视场角 / 面板显隐是主循环直接读的，不算渲染状态，所以不置。
    bool dirty = false;

    // 滑块 / 下拉框的宽度。ImGui 默认给窗口宽度的 65%（340 → 221px），
    // 留给右边标签的位置就不够了 —— "淡出半径（× 半径）"这种会被裁掉半个字。
    // 收窄到 150px，本面板所有标签都能完整显示。
    ImGui::PushItemWidth(150.0f);

    ImGui::PushStyleColor(ImGuiCol_Text, ImVec4(1.0f, 0.84f, 0.42f, 1.0f));
    ImGui::TextUnformatted("ModelViewer 控制面板");
    ImGui::PopStyleColor();
    ImGui::SameLine();
    ImGui::TextDisabled("(F1 隐藏)");
    ImGui::Separator();

    // =====================================================================
    // 信息（只读）
    // =====================================================================
    if (ImGui::CollapsingHeader("信息", ImGuiTreeNodeFlags_DefaultOpen)) {
        const UiControls::Info& i = c.info;
        if (i.frameMs > 0.01f) {
            ImGui::Text("%.2f ms/帧   %.0f FPS", i.frameMs, i.fps);
        } else {
            // --shot 是在第一帧上截的，那时候还没有"上一帧"可算
            ImGui::TextDisabled("（第 1 帧，还没有帧耗时）");
        }
        ImGui::TextDisabled("%d x %d   第 %llu 帧   %s",
                i.width, i.height,
                static_cast<unsigned long long>(i.frameIndex), i.backend);
        ImGui::Spacing();

        ImGui::TextDisabled("内容");
        ImGui::SameLine();
        if (i.isTriangle) {
            ImGui::TextUnformatted(i.content.c_str());
        } else {
            // 路径可能很长，折行显示，别把面板撑宽
            ImGui::TextWrapped("%s", i.content.c_str());
        }
        ImGui::TextDisabled("实体 %zu   可绘制 %zu（视锥内 %d）",
                i.entities, i.renderables, i.visibleRenderables);
        ImGui::TextDisabled("包围盒 (%.3f %.3f %.3f) ~ (%.3f %.3f %.3f)",
                i.boundsMin[0], i.boundsMin[1], i.boundsMin[2],
                i.boundsMax[0], i.boundsMax[1], i.boundsMax[2]);
        ImGui::Spacing();

        ImGui::TextDisabled("相机");
        ImGui::Text("eye    (%.3f %.3f %.3f)", i.eye[0], i.eye[1], i.eye[2]);
        ImGui::Text("look   (%.3f %.3f %.3f)", i.target[0], i.target[1], i.target[2]);
        ImGui::Text("pivot  (%.3f %.3f %.3f)", i.pivot[0], i.pivot[1], i.pivot[2]);
        ImGui::Text("距离 %.3f   半径 %.3f", i.distToCenter, i.radius);
        ImGui::Text("near %.3f   far %.3f", i.nearZ, i.farZ);
        ImGui::Spacing();

        if (i.groundReady) {
            ImGui::TextDisabled("地面  格距 %.3f", i.groundSpacing);
        } else {
            ImGui::TextDisabled("地面  未启用");
        }

        if (ImGui::Button("重新加载当前文件 (F5)")) {
            c.requestReload = true;
        }
    }

    // =====================================================================
    // 画质
    // =====================================================================
    if (ImGui::CollapsingHeader("画质", ImGuiTreeNodeFlags_DefaultOpen)) {
        dirty |= ImGui::Checkbox("后处理（ACES tone mapping）", &c.postProcessing);
        if (ImGui::IsItemHovered()) {
            ImGui::SetTooltip("关掉画面会变\"平\"：ACES 色调映射、Bloom、SSAO、FXAA 全挂在这上面");
        }

        ImGui::SeparatorText("抗锯齿");
        ImGui::RadioButton("关##aa", &c.aaMode, 0);
        ImGui::SameLine();
        ImGui::RadioButton("FXAA", &c.aaMode, 1);
        dirty |= ImGui::Checkbox("MSAA", &c.msaa);
        ImGui::SameLine();
        ImGui::BeginDisabled(!c.msaa);
        dirty |= ImGui::RadioButton("4x", &c.msaaSamples, 4);
        ImGui::SameLine();
        dirty |= ImGui::RadioButton("8x", &c.msaaSamples, 8);
        ImGui::EndDisabled();
        ImGui::SameLine();
        ImGui::TextDisabled("(FXAA 与 MSAA 可叠加)");

        ImGui::SeparatorText("后处理效果");
        dirty |= ImGui::Checkbox("SSAO（环境光遮蔽）", &c.ssao);
        ImGui::BeginDisabled(!c.ssao);
        dirty |= ImGui::Combo("升采样质量", &c.ssaoQuality, kSsaoQualities, 4);
        ImGui::EndDisabled();

        dirty |= ImGui::Checkbox("Bloom（泛光）", &c.bloom);
        ImGui::BeginDisabled(!c.bloom);
        dirty |= ImGui::SliderFloat("强度##bloom", &c.bloomStrength, 0.0f, 1.0f, "%.2f");
        ImGui::EndDisabled();

        ImGui::SeparatorText("阴影");
        dirty |= ImGui::Checkbox("太阳阴影", &c.shadows);
        ImGui::BeginDisabled(!c.shadows);
        dirty |= ImGui::Combo("类型##shadow", &c.shadowType, kShadowTypes, 4);
        ImGui::EndDisabled();
        ImGui::TextDisabled("(阴影还要光源 castShadows，两边缺一不可)");

        ImGui::SeparatorText("其它");
        dirty |= ImGui::Checkbox("抖动 Dithering（消除色带）", &c.dithering);
        dirty |= ImGui::Checkbox("视锥剔除", &c.frustumCulling);
    }

    // =====================================================================
    // 光照
    // =====================================================================
    if (ImGui::CollapsingHeader("光照")) {
        dirty |= ImGui::Checkbox("IBL（环境光）", &c.ibl);
        if (ImGui::IsItemHovered()) {
            ImGui::SetTooltip("关掉只剩太阳直接光，背光面会全黑 —— 可以拿它对照看间接光的影响");
        }
        dirty |= ImGui::Checkbox("天空盒", &c.skybox);

        ImGui::SeparatorText("太阳");
        dirty |= ImGui::SliderFloat("强度（lux）", &c.sunIntensity, 1000.0f, 200000.0f, "%.0f");
        dirty |= ImGui::SliderFloat("高度角", &c.sunElevationDeg, 1.0f, 89.0f, "%.1f°");
        dirty |= ImGui::SliderFloat("方位角", &c.sunAzimuthDeg, 0.0f, 360.0f, "%.1f°");
        ImGui::TextDisabled("默认 (45°, 36.87°) = 官方那个 {0.6,-1,-0.8}");
    }

    // =====================================================================
    // 地面网格（阶段 2-b）
    // =====================================================================
    if (ImGui::CollapsingHeader("地面网格")) {
        dirty |= ImGui::Checkbox("显示地面", &c.groundVisible);
        dirty |= ImGui::Checkbox("格距跟随模型大小（吸附到 2 的幂）", &c.groundAutoSpacing);
        ImGui::BeginDisabled(c.groundAutoSpacing);
        dirty |= ImGui::SliderFloat("格距", &c.groundSpacing, 0.01f, 4.0f, "%.3f", ImGuiSliderFlags_Logarithmic);
        ImGui::EndDisabled();

        dirty |= ImGui::SliderFloat("淡出半径（× 半径）", &c.groundFadeScale, 0.5f, 8.0f, "%.2f");
        dirty |= ImGui::SliderFloat("淡出起点", &c.groundFadeStart, 0.0f, 1.0f, "%.2f");
        dirty |= ImGui::SliderFloat("底面不透明度", &c.groundBaseAlpha, 0.0f, 1.0f, "%.2f");
        dirty |= ImGui::SliderFloat("网格线不透明度", &c.groundLineAlpha, 0.0f, 1.0f, "%.2f");
        dirty |= ImGui::SliderFloat("粗糙度", &c.groundRoughness, 0.0f, 1.0f, "%.2f");
        ImGui::TextDisabled("太透的话太阳阴影会糊在天空盒里看不清");
    }

    // =====================================================================
    // 相机
    // =====================================================================
    if (ImGui::CollapsingHeader("相机", ImGuiTreeNodeFlags_DefaultOpen)) {
        // 这两个是主循环每帧直接读的，不置 dirty
        ImGui::SliderFloat("阻尼 K", &c.damping, 0.0f, 60.0f, "%.1f");
        if (ImGui::IsItemHovered()) {
            ImGui::SetTooltip("松手后的惯性：越小心越\"重\"，0 = 完全手跟手（等价于 --damping 0）");
        }
        ImGui::SliderFloat("视场角", &c.fovDeg, 20.0f, 90.0f, "%.0f°");
        ImGui::TextDisabled("改视场角不会自动重新取景，按 R 复位才按新角度重算");

        if (ImGui::Button("复位视角 (R)")) {
            c.requestReset = true;
        }
        ImGui::SameLine();
        ImGui::TextDisabled("左键转 / 右键平移 / 滚轮推拉");
    }

    // =====================================================================
    // 调试
    // =====================================================================
    if (ImGui::CollapsingHeader("调试")) {
        ImGui::Checkbox("控制台打印相机姿态（--verbose）", &c.logCamera);
        ImGui::Checkbox("显示本面板 (F1)", &c.showPanel);
        ImGui::Spacing();
        ImGui::TextDisabled("截图：--shot out.bmp（默认不画面板；");
        ImGui::TextDisabled("加 --ui 把面板一起截进来）");
    }

    if (dirty) {
        c.dirty = true;
    }

    ImGui::PopItemWidth();
    ImGui::End();
}

// ---------------------------------------------------------------------------
// UiLayer
// ---------------------------------------------------------------------------
bool UiLayer::create(Engine* engine, HWND hwnd) {
    mEngine = engine;

    // 面板材质：和 litTriangle / groundGrid 一样走 matc -> materials/*.filamat。
    // 先探一下再建上下文 —— 缺文件时干干净净地放弃 UI，而不是让 ImGuiHelper
    // 在构造函数里 assert。
    if (GetFileAttributesA("materials/uiBlit.filamat") == INVALID_FILE_ATTRIBUTES) {
        std::fprintf(stderr,
                "[ui] 读不到 materials/uiBlit.filamat，这一轮不画控制面板\n"
                "     （先跑一次 cmake --build build --config Release 让 matc 生成它）\n");
        return false;
    }

    mView = engine->createView();

    // 自己建 ImGui 上下文，好把字体（中文）在 filagui 建图集**之前**装进去。
    // ImGuiHelper 的构造函数支持外部传入 context，这是它的公开用法之一。
    ImGui::CreateContext();
    mContext = ImGui::GetCurrentContext();
    ImGuiIO& io = ImGui::GetIO();
    addUiFont(io);

    mHelper = new filagui::ImGuiHelper(engine, mView,
            // 传一个不存在的路径：字体已经由 addUiFont() 装好了，
            // ImGuiHelper 那句 AddFontFromFileTTF 就会跳过（它自己会判断 isFile()）。
            utils::Path("<ui-font-loaded-by-caller>"),
            mContext);

    // 官方把窗口位置/大小存到用户配置目录（Path::getUserSettingsDirectory()）。
    // 我们的面板是固定侧边栏，位置每帧强制设定，存下来的布局没有意义 ——
    // 关掉它还能让工程不往系统里写文件。
    io.IniFilename = nullptr;

    if (!ImGui_ImplWin32_InitForOpenGL(hwnd)) {
        std::fprintf(stderr, "[ui] ImGui_ImplWin32_InitForOpenGL 失败，这一轮不画控制面板\n");
        return false;
    }
    mWin32Ok = true;
    mReady   = true;
    return true;
}

void UiLayer::destroy(Engine* engine) {
    if (mWin32Ok) {
        // 必须排在 ImGuiHelper 析构（它会 DestroyContext）之前
        ImGui_ImplWin32_Shutdown();
        mWin32Ok = false;
    }
    // ImGuiHelper 析构里会 DestroyContext + 拆掉自己的 Scene / 材质 / 顶点缓冲
    delete mHelper;
    mHelper = nullptr;
    mContext = nullptr;
    if (engine && mView) {
        engine->destroy(mView);   // UI 专用 View（ImGuiHelper 只是借用，不拥有）
    }
    mView  = nullptr;
    mReady = false;
}

// ★ 这两个函数要防一手"上下文已经没了"：ImGui::GetIO() 在没有当前上下文时
//   只会 IM_ASSERT 一句（Release 下 assert 是空的），然后解引用空指针崩掉。
bool UiLayer::wantsMouse() const noexcept {
    return mContext != nullptr && ImGui::GetIO().WantCaptureMouse;
}

bool UiLayer::wantsKeyboard() const noexcept {
    return mContext != nullptr && ImGui::GetIO().WantCaptureKeyboard;
}

void UiLayer::feedMessage(HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam) {
    if (!mReady) {
        return;
    }
    // 官方 Win32 后端：鼠标位置/按键/滚轮、键盘（扫描码映射）、字符输入、
    // WM_SETCURSOR、DPI 变化，全在里面。它只填 ImGuiIO，不画任何东西。
    ImGui_ImplWin32_WndProcHandler(hwnd, msg, wParam, lParam);
}

void UiLayer::setDisplaySize(int width, int height) {
    if (!mReady) {
        return;
    }
    mWidth  = width;
    mHeight = height;

    // setDisplaySize 同时会按尺寸设好 UI 相机的正交投影
    //（flipVertical 用默认的 false —— 官方 FilamentAppGui.cpp:346 也是这么调的）
    mHelper->setDisplaySize(width, height, 1.0f, 1.0f);

    // UI 要和主画面一样铺满整个窗口（官方 FilamentApp2.cpp:1064 每次 resize 都设）
    mView->setViewport({ 0, 0, static_cast<uint32_t>(width), static_cast<uint32_t>(height) });
}

void UiLayer::render(float dtSeconds, UiControls& c) {
    if (!mReady) {
        return;
    }
    ImGui::SetCurrentContext(mContext);

    // 输入状态（鼠标位置 / 按键）—— 官方后端每帧刷新一次，要排在 NewFrame 之前
    ImGui_ImplWin32_NewFrame();

    // ImGuiHelper::render 内部会 NewFrame -> 回调画控件 -> Render -> 翻成 Filament 对象
    mHelper->render(dtSeconds, [&c](Engine*, View*) {
        drawPanel(c);
    });
}

}  // namespace ui
