# ============================================================================
#  ModelViewer —— 基于 Filament 的最小 GLB 模型查看器
#
#  路线 A：只依赖官方预编译 Release 包（filament 核心 + gltfio），
#          窗口用自己的 Win32。不引入 FilamentApp。
#
#  阶段 3 起多了一个控制面板，用的是官方那一套 **ImGui + filagui**：
#      third_party\imgui\     ImGui 1.92.5 核心 4 个 cpp + Win32 输入后端
#      src\filagui\           从 libs/filagui 拷来的胶水层（ImGui 顶点 -> Filament）
#  渲染仍然全归 Filament：它们只把 ImGui 的 draw list 翻成 VertexBuffer /
#  MaterialInstance，再挂到一个专门的 UI View 上（见 src\ui.cpp）。
#
#  依赖全部在 third_party\ 里（自包含，来源见 third_party\README.md）：
#      third_party\filament-v1.77.3-windows\   官方预编译包（裁剪版，25 个库）
#      third_party\filament-extra-include\     release 包没带的补充头
#      third_party\imgui\                      ImGui 1.92.5 核心（见上面）
#
#  （SDL2 没有放进来 —— 本工程用裸 Win32 建窗口，不链接 SDL2。）
#
#  这个文件里**没有任何绝对路径**，工程可以整个拷到别的机器直接编。
#
#  用法：
#      cmake -G "Visual Studio 17 2022" -A x64 -S . -B build
#      cmake --build build --config Release
#      或直接跑 build.bat
#
#  可覆盖的 cache 变量：
#      -DFILAMENT_DIST=<预编译包根目录>         默认 third_party\filament-v1.77.3-windows
#      -DFILAMENT_EXTRA_INCLUDE=<补充头根目录>  默认 third_party\filament-extra-include
# ============================================================================
cmake_minimum_required(VERSION 3.19)

# 本工程只支持 Release / RelWithDebInfo。
#   third_party 里只有 /MT 的 Release 库，Debug(/MTd) 会 LNK2038 链不上。
#   RelWithDebInfo 同样是 /MT、_ITERATOR_DEBUG_LEVEL=0，可以安全链接，
#   需要调试自己代码的时候用它（第三方库保持 Release，跑得快）。
set(CMAKE_CONFIGURATION_TYPES "Release;RelWithDebInfo" CACHE STRING
    "支持的构建配置" FORCE)

project(ModelViewer CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# ---------------------------------------------------------------------------
# 1. 定位依赖 —— 全部在本工程 third_party\ 下，不需要任何绝对路径
# ---------------------------------------------------------------------------
set(FILAMENT_DIST "${CMAKE_CURRENT_SOURCE_DIR}/third_party/filament-v1.77.3-windows"
    CACHE PATH "Filament 预编译发行包根目录")

set(FILAMENT_EXTRA_INCLUDE "${CMAKE_CURRENT_SOURCE_DIR}/third_party/filament-extra-include"
    CACHE PATH "release 包未包含的补充头目录（cgltf / filabridge / utils）")

if (NOT EXISTS "${FILAMENT_DIST}/include/filament/Engine.h")
    message(FATAL_ERROR
        "找不到 Filament 发行包：${FILAMENT_DIST}\n"
        "  该目录下应包含 include/filament/Engine.h。\n"
        "  跑一下 tools\\vendor-deps.ps1 重建 third_party。")
endif()
message(STATUS "FILAMENT_DIST = ${FILAMENT_DIST}")

# 只有一套库：mt = Release + /MT（静态）
set(FL_LIBDIR "${FILAMENT_DIST}/lib/x86_64/mt")

# ---------------------------------------------------------------------------
# 2. 依赖库清单
#    ★ 这个清单必须和 tools\vendor-deps.ps1 里的 $Libs 保持一致 ——
#      脚本按它决定往 third_party 里拷哪些 .lib。
#
#    另外：MSVC 只拉取真正被引用到的 .lib 成员，所以这里可以一次性列全，
#          不会让最终 exe 无谓变大。后续阶段如果要砍掉某功能，从这里删即可。
# ---------------------------------------------------------------------------
# --- Filament 核心引擎 ---
set(FL_CORE
    filament            # 引擎主体 Engine/Scene/View/Renderer/Material/...
    backend             # 后端抽象层
    bluegl              # OpenGL 后端
    bluevk              # Vulkan 后端（不用 Vulkan 时可删；删了记得别调 Backend::VULKAN）
    filabridge          # 引擎内部桥接（部分 public API 依赖）
    filaflat            # 材质包 / flatbuffer 读取（运行时解析 .filamat）
    smol-v              # SPIR-V 压缩
    utils               # Path / EntityManager / NameComponentManager / getopt
    geometry            # 切线空间等几何工具
    ibl                 # ibl::Cubemap —— 解析 .ktx 环境贴图
    image               # LinearImage / Ktx1Bundle
    zstd                # 材质包压缩
    abseil
)

# --- glTF / 模型与贴图加载（阶段 1-c 已用上）---
set(FL_GLTF
    gltfio_core         # AssetLoader / ResourceLoader / MaterialProvider
    uberarchive         # 预编译 PBR ubershader 归档（UBERARCHIVE_DEFAULT_DATA）
    uberzlib
    ktxreader           # .ktx2 贴图
    stb                 # png / jpeg 解码
    imageio-lite
    meshoptimizer       # 顶点优化
    mikktspace          # 缺切线时自动生成
    basis_transcoder    # ktx2 里的 basis/uastc 解码
    dracodec            # draco 压缩网格
)

# --- 工具库（阶段 1-d 开始用）---
set(FL_EXTRA
    camutils            # camutils::Manipulator —— 现成的轨道相机，不用自己写
    getopt              # 官方参数解析（暂时没用上，留给后续和官方代码对齐）
)

# --- 体检：缺库就给人话提示，而不是让连接器报 LNK1104 ---
foreach(_l ${FL_CORE} ${FL_GLTF} ${FL_EXTRA})
    if (NOT EXISTS "${FL_LIBDIR}/${_l}.lib")
        message(FATAL_ERROR
            "third_party 里缺少库：${FL_LIBDIR}/${_l}.lib\n"
            "  跑一下 tools\\vendor-deps.ps1 重建 third_party。")
    endif()
endforeach()

set(FL_LIB_PATHS "")
foreach(_l ${FL_CORE} ${FL_GLTF} ${FL_EXTRA})
    list(APPEND FL_LIB_PATHS "${FL_LIBDIR}/${_l}.lib")
endforeach()

# ---------------------------------------------------------------------------
# 3. 头文件搜索路径
# ---------------------------------------------------------------------------
set(FL_INCLUDE_DIRS "${FILAMENT_DIST}/include")

# release 包只装了公共头，这些私有头要从源码树抽出来补上（已放在 third_party 里）
foreach(_d cgltf filabridge utils)
    if (NOT EXISTS "${FILAMENT_EXTRA_INCLUDE}/${_d}")
        message(FATAL_ERROR
            "缺补充头目录：${FILAMENT_EXTRA_INCLUDE}/${_d}\n"
            "  跑一下 tools\\vendor-deps.ps1 重建 third_party。")
    endif()
    list(APPEND FL_INCLUDE_DIRS "${FILAMENT_EXTRA_INCLUDE}/${_d}")
endforeach()

# ---------------------------------------------------------------------------
# 4. 材质编译
#    官方 samples/CMakeLists.txt:68-80 就是这么干的：调 matc 把 .mat 编成 .filamat。
#    我们照抄这个做法，不自己写材质系统。
# ---------------------------------------------------------------------------
set(MATC "${FILAMENT_DIST}/bin/matc.exe")
if (NOT EXISTS "${MATC}")
    message(FATAL_ERROR "找不到 matc.exe: ${MATC}")
endif()

set(MATERIAL_SRC_DIR "${CMAKE_CURRENT_SOURCE_DIR}/materials")
set(MATERIAL_OUT_DIR "${CMAKE_CURRENT_BINARY_DIR}/materials")
file(MAKE_DIRECTORY "${MATERIAL_OUT_DIR}")

# litTriangle.mat —— 调试三角形用的 lit 材质
# groundGrid.mat  —— 阶段 2 的地面网格（接太阳阴影的那块板子）
# uiBlit.mat      —— 阶段 3 的控制面板：ImGui 的 2D 贴图（filagui 用它画 UI）
set(MATERIAL_SRCS
    litTriangle.mat
    groundGrid.mat
    uiBlit.mat
)
set(MATERIAL_BINS "")

foreach(_mat ${MATERIAL_SRCS})
    get_filename_component(_name "${_mat}" NAME_WE)
    set(_out "${MATERIAL_OUT_DIR}/${_name}.filamat")
    add_custom_command(
        OUTPUT  "${_out}"
        COMMAND "${MATC}" -a opengl -a vulkan -o "${_out}" "${MATERIAL_SRC_DIR}/${_mat}"
        MAIN_DEPENDENCY "${MATERIAL_SRC_DIR}/${_mat}"
        COMMENT "编译材质 ${_mat} -> ${_name}.filamat"
    )
    list(APPEND MATERIAL_BINS "${_out}")
endforeach()

add_custom_target(modelviewer-materials DEPENDS ${MATERIAL_BINS})

# ---------------------------------------------------------------------------
# 5. 目标
#
#  ImGui 核心：这 4 个 cpp 就是官方要求的最小集合（imgui_demo.cpp 用不到）。
#  imgui_impl_win32.cpp 是官方输入后端，只把 WM_* 翻成 ImGui 事件，**不画东西**；
#  手写键位映射迟早会在字符输入 / IME / 滚轮 / DPI 上翻车，不如直接用官方的。
#  filagui 是 Filament 自己的胶水层：把 ImGui 的 draw list 翻成 Filament 的
#  VertexBuffer + MaterialInstance（见 src/ui.cpp 的注释）。
# ---------------------------------------------------------------------------
set(IMGUI_DIR  "${CMAKE_CURRENT_SOURCE_DIR}/third_party/imgui")
set(FILAGUI_DIR "${CMAKE_CURRENT_SOURCE_DIR}/src/filagui")

add_executable(modelviewer
    src/main.cpp
    src/ui.cpp                          # 阶段 3：控制面板（只画面板，不碰渲染状态）

    "${IMGUI_DIR}/imgui.cpp"
    "${IMGUI_DIR}/imgui_draw.cpp"
    "${IMGUI_DIR}/imgui_tables.cpp"
    "${IMGUI_DIR}/imgui_widgets.cpp"
    "${IMGUI_DIR}/imgui_impl_win32.cpp"

    "${FILAGUI_DIR}/ImGuiHelper.cpp"    # ImGui draw list -> Filament 对象
    "${FILAGUI_DIR}/ImGuiExtensions.cpp"
)

# 材质必须先编好
add_dependencies(modelviewer modelviewer-materials)

# filagui 是从 libs/filagui 原样考来的：它自带的 C4244 / C4267（窄化转换）和
# fopen 的 C4996 是官方代码里就有的，不去改它，就地压掉，免得把编译输出刷满。
# （/D_CRT_SECURE_NO_WARNINGS 是为我们那处读 .filamat 的改动加的。）
set_source_files_properties(
    "${FILAGUI_DIR}/ImGuiHelper.cpp"
    "${FILAGUI_DIR}/ImGuiExtensions.cpp"
    PROPERTIES COMPILE_OPTIONS "/D_CRT_SECURE_NO_WARNINGS;/wd4244;/wd4267"
)

# 用自己的 main()（控制台子系统），printf 直接可见，方便调试。
# （若以后改成无控制台窗口，这里设 TRUE；但那会看不到 printf 输出。）
set_target_properties(modelviewer PROPERTIES WIN32_EXECUTABLE FALSE)

# 必须与预编译库一致：/MT（Debug 配置已被上面的 CMAKE_CONFIGURATION_TYPES 去掉，
# 所以这里不需要 $<CONFIG:Debug> 分支）
set_property(TARGET modelviewer PROPERTY MSVC_RUNTIME_LIBRARY "MultiThreaded")

# SYSTEM：希望把 Filament 头文件当系统头，抑制它们内部的 C4244/C4267 噪音。
# 注意 CMake 3.22 的 VS 生成器不会把它转成 /external:I，所以要手动补一遍。
target_include_directories(modelviewer SYSTEM PRIVATE ${FL_INCLUDE_DIRS})

# 自己的头：ui.cpp 里是 `#include <filagui/ImGuiHelper.h>`（和官方写法一致），
# 所以要把 src\ 本身放进搜索路径；imgui 的头在 third_party\imgui。
target_include_directories(modelviewer PRIVATE
    "${CMAKE_CURRENT_SOURCE_DIR}/src"
    "${IMGUI_DIR}"
)

target_link_libraries(modelviewer PRIVATE
    ${FL_LIB_PATHS}
    opengl32    # OpenGL 后端
    gdi32 user32 shell32
    # shlwapi：gltfio 的 ResourceLoader 用了 utils::Path 解析资源路径，
    # 而 utils::Path::isAbsolute() 调的是 shlwapi 的 PathIsRelativeA。
    # 只画三角形时不会拉进 Path.cpp.obj，接上 gltfio 才会暴露出来（LNK2019）。
    shlwapi
)

if (MSVC)
    # source 文件是 UTF-8（含中文注释），不加 /utf-8 会有一堆 C4819
    target_compile_options(modelviewer PRIVATE /utf-8 /W3)

    # CMake 3.22 的 VS 生成器忽略 SYSTEM，手动把 Filament 头目录标成 external，
    # 这样它们内部的模板警告不会糊满输出，而自己代码里的警告照样保留。
    foreach(_d ${FL_INCLUDE_DIRS})
        target_compile_options(modelviewer PRIVATE "/external:I${_d}")
    endforeach()
    target_compile_options(modelviewer PRIVATE /external:anglebrackets /external:W0)

    # RelWithDebInfo 下链接器会为预编译 .lib 里的每个 .obj 找 PDB，而官方包不发布 PDB，
    # 于是刷出上百条 LNK4099（"未找到 filament.pdb"）。它只说明第三方没带调试信息，
    # 不影响调试自己的代码，屏蔽掉以保持输出干净。
    # （Release 不开 /DEBUG，本来就不会出现，加着无害。）
    target_link_options(modelviewer PRIVATE /ignore:4099)
endif()

# ---------------------------------------------------------------------------
# 6. 把 assets/ 和编译好的 .filamat 拷到 exe 旁边
#    这样程序里可以直接用 "assets/..." 和 "materials/..." 相对路径，
#    从哪个工作目录启动都不怕。
# ---------------------------------------------------------------------------
add_custom_command(TARGET modelviewer POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CMAKE_CURRENT_SOURCE_DIR}/assets"
            "$<TARGET_FILE_DIR:modelviewer>/assets"
    COMMAND ${CMAKE_COMMAND} -E make_directory
            "$<TARGET_FILE_DIR:modelviewer>/materials"
    COMMAND ${CMAKE_COMMAND} -E copy_if_different
            ${MATERIAL_BINS}
            "$<TARGET_FILE_DIR:modelviewer>/materials/"
    COMMENT "复制 assets / 材质 到可执行文件目录")

# ---------------------------------------------------------------------------
# 7. 面板汉字体检（见 tools/check-ui-glyphs.ps1）
#    src/ui.cpp 里的 kPanelGlyphs 必须覆盖面板用到的所有 CJK 字符 —— 漏一个
#    前缀 ImGui 就把它静默画成 "?"（常见 2500 汉字表里没有"帧""锥""幂"这类字，
#    踩过）。所以链接完之后自动跑一遍：缺字就让构建**失败**，不给静默的机会。
#    改了面板文案后重新生成那张表：
#        powershell -File tools\check-ui-glyphs.ps1 -Print
# ---------------------------------------------------------------------------
find_program(POWERSHELL_EXE NAMES powershell pwsh)
if(POWERSHELL_EXE)
    add_custom_command(TARGET modelviewer POST_BUILD
        COMMAND "${POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass
                -File "${CMAKE_CURRENT_SOURCE_DIR}/tools/check-ui-glyphs.ps1"
        COMMENT "面板汉字体检（kPanelGlyphs 覆盖检查）")
else()
    message(WARNING "找不到 powershell，跳过面板汉字体检（tools/check-ui-glyphs.ps1）")
endif()
