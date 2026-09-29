cmake_minimum_required(VERSION 3.10)
project(main)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../..)

# 可执行文件输出到当前示例目录下的 bin/
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/bin)

include_directories(
    ${ROOT_DIR}/include
    ${ROOT_DIR}/extern/glfw-3.0.4/include
    ${ROOT_DIR}/src/sb7
    ${ROOT_DIR}/extern/imgui
    ${ROOT_DIR}/extern/imgui/backends
    ${ROOT_DIR}/extern/glm 
)

link_directories(${ROOT_DIR}/lib)

# ---------------- sb7 ----------------
add_library(sb7 STATIC
    ${ROOT_DIR}/src/sb7/sb7.cpp
    ${ROOT_DIR}/src/sb7/sb7color.cpp
    ${ROOT_DIR}/src/sb7/sb7ktx.cpp
    ${ROOT_DIR}/src/sb7/sb7object.cpp
    ${ROOT_DIR}/src/sb7/sb7shader.cpp
    ${ROOT_DIR}/src/sb7/sb7textoverlay.cpp
    ${ROOT_DIR}/src/sb7/gl3w.c
)

# ---------------- imgui ----------------
add_library(imgui STATIC
    ${ROOT_DIR}/extern/imgui/imgui.cpp
    ${ROOT_DIR}/extern/imgui/imgui_draw.cpp
    ${ROOT_DIR}/extern/imgui/imgui_tables.cpp
    ${ROOT_DIR}/extern/imgui/imgui_widgets.cpp
    ${ROOT_DIR}/extern/imgui/imgui_demo.cpp
    ${ROOT_DIR}/extern/imgui/backends/imgui_impl_glfw.cpp
    ${ROOT_DIR}/extern/imgui/backends/imgui_impl_opengl3.cpp
)

target_compile_definitions(imgui PRIVATE GLFW_EXPOSE_NATIVE_WGL)
# ---------------- main ----------------
add_executable(main WIN32 main.cpp)

add_custom_command(TARGET main POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
        ${CMAKE_CURRENT_SOURCE_DIR}/shaders
        $<TARGET_FILE_DIR:main>/shaders
)

set_property(TARGET main PROPERTY DEBUG_POSTFIX _d)

target_link_libraries(main
    sb7
    imgui
    optimized glfw3
    debug glfw3_d
    opengl32
)