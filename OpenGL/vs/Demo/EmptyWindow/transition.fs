#version 330 core

in vec3 vWorldPos;
in vec3 vModelPos;
in vec2 aUV;
out vec4 FragColor;

uniform vec3 fromColor; // 这次过渡的起始颜色 
uniform vec3 toColor; // 这次过渡的目标颜色
uniform float t;         // 0→1 的过渡参数
uniform float width;     // 边缘柔和宽度

void main()
{
    float normalized = vModelPos.z + 0.5; // 映射到 [0,1]
    normalized = 1.0 - normalized;
    vec3 color = mix(toColor, fromColor, step(t, normalized));
    FragColor = vec4(color, 1.0);
}
