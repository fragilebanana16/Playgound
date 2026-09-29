#version 410 core

layout (vertices = 3) out;

uniform float uTessLevel = 5.0;   // ← 接收 CPU 传来的值
uniform float uTessLevelOut = 5.0;   
void main(void)
{
    if (gl_InvocationID == 0)
    {
        gl_TessLevelInner[0] = uTessLevel;
        gl_TessLevelOuter[0] = uTessLevelOut;
        gl_TessLevelOuter[1] = uTessLevelOut;
        gl_TessLevelOuter[2] = uTessLevelOut;
    }
    gl_out[gl_InvocationID].gl_Position = gl_in[gl_InvocationID].gl_Position;
}