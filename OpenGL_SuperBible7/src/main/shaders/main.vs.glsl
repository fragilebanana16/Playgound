#version 430 core

layout (location = 0) in vec3 aPos;

out vec3 vColor;

void main()
{
    vColor = aPos * 0.5 + 0.5;   // 用位置当颜色，方便看
    gl_Position = vec4(aPos, 1.0);
}