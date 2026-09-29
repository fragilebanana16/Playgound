#version 410 core

layout (vertices = 3) out;

uniform float uTessLevel = 5.0;   // ← 接收 CPU 传来的值

void main(void)
{
    if (gl_InvocationID == 0)
    {
        gl_TessLevelInner[0] = uTessLevel;
        gl_TessLevelOuter[0] = uTessLevel;
        gl_TessLevelOuter[1] = uTessLevel;
        gl_TessLevelOuter[2] = uTessLevel;
    }
    gl_out[gl_InvocationID].gl_Position = gl_in[gl_InvocationID].gl_Position;
}