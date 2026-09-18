cmake_minimum_required(VERSION 3.10)
project(singlepoint)

set(CMAKE_CXX_STANDARD 11)

set(ROOT_DIR ${CMAKE_CURRENT_LIST_DIR}/../..)

# 可执行文件输出到当前示例目录下的 bin/
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY ${CMAKE_CURRENT_LIST_DIR}/bin)

include_directories(
    ${ROOT_DIR}/include
    ${ROOT_DIR}/extern/glfw-3.0.4/include
    ${ROOT_DIR}/src/sb7
)

link_directories(${ROOT_DIR}/lib)

add_library(sb7 STATIC
    ${ROOT_DIR}/src/sb7/sb7.cpp
    ${ROOT_DIR}/src/sb7/sb7color.cpp
    ${ROOT_DIR}/src/sb7/sb7ktx.cpp
    ${ROOT_DIR}/src/sb7/sb7object.cpp
    ${ROOT_DIR}/src/sb7/sb7shader.cpp
    ${ROOT_DIR}/src/sb7/sb7textoverlay.cpp
    ${ROOT_DIR}/src/sb7/gl3w.c
)

add_executable(singlepoint WIN32 singlepoint.cpp)
set_property(TARGET singlepoint PROPERTY DEBUG_POSTFIX _d)

target_link_libraries(singlepoint
    sb7
    optimized glfw3
    debug glfw3_d
    opengl32
)