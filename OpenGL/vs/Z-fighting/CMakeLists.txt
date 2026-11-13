cmake_minimum_required(VERSION 3.10)
project(triangle)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 依赖库统一使用 OpenGL\libraries（与 Demo 一致），不引用 SuperBible7 的 extern/lib
set(OPENGL_ROOT ${CMAKE_CURRENT_LIST_DIR}/../..)

# 可执行文件输出到当前示例目录下的 bin/
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/bin)

include_directories(${OPENGL_ROOT}/libraries/Include)
# ImGui 直接复用 Demo 工程里的源码（其后端已改用 glad）
include_directories(${CMAKE_CURRENT_LIST_DIR}/../Demo/Lighting/imgui)
link_directories(${OPENGL_ROOT}/libraries/Libs)

set(IMGUI_DIR ${CMAKE_CURRENT_LIST_DIR}/../Demo/Lighting/imgui)

# ---------------- triangle ----------------
add_executable(triangle
    main.cpp
    ${CMAKE_CURRENT_LIST_DIR}/../Demo/glad.c
    ${IMGUI_DIR}/imgui.cpp
    ${IMGUI_DIR}/imgui_draw.cpp
    ${IMGUI_DIR}/imgui_demo.cpp
    ${IMGUI_DIR}/imgui_impl_glfw_gl3.cpp
)

set_property(TARGET triangle PROPERTY DEBUG_POSTFIX _d)

target_link_libraries(triangle
    glfw3
    opengl32
)
