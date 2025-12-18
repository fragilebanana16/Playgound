#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec2 aTexCoords;
layout (location = 2) in vec3 aColor;  // 顶点颜色

out vec2 TexCoords;
out vec3 ourColor; // 传给片段着色器
uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main()
{
    TexCoords = aTexCoords;    
	ourColor = aColor;
    gl_Position = projection * view * model * vec4(aPos, 1.0f);
}