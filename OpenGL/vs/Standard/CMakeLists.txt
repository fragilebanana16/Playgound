cmake_minimum_required(VERSION 3.10)
project(triangle)

set(CMAKE_CXX_STANDARD 11)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 依赖库统一使用 OpenGL\libraries（与 Demo 一致），不引用 SuperBible7 的 extern/lib
set(OPENGL_ROOT ${CMAKE_CURRENT_LIST_DIR}/../..)

# 可执行文件输出到当前示例目录下的 bin/
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/bin)

include_directories(${OPENGL_ROOT}/libraries/Include)
link_directories(${OPENGL_ROOT}/libraries/Libs)

# ---------------- triangle ----------------
add_executable(triangle
    main.cpp
    ${CMAKE_CURRENT_LIST_DIR}/../Demo/glad.c
)

set_property(TARGET triangle PROPERTY DEBUG_POSTFIX _d)

target_link_libraries(triangle
    glfw3
    opengl32
)
