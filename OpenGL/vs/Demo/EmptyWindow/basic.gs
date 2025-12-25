#version 330 core
layout(triangles) in;
layout(line_strip, max_vertices = 6) out;
uniform float time;
uniform mat4 projection;

in VS_OUT {
    vec3 color;
    vec3 normal;
    vec3 posView;
} gs_in[];

out vec3 fColor;
const float MAGNITUDE = 1.4;

vec4 explode(vec3 position, vec3 normal)
{
    float magnitude = 2.0;
    vec3 direction = normal * ((sin(time) + 1.0) / 2.0) * magnitude; 
    return projection * (vec4(position, 1.0) + vec4(direction, 0.0));
}

void GenerateLine(int index)
{
    fColor = gs_in[index].color;

    // 爆炸后的顶点位置
    vec4 explodedPos = explode(gs_in[index].posView, gs_in[index].normal);

    // 起点：爆炸后的顶点
    gl_Position = explodedPos;
    EmitVertex();

    // 终点：爆炸后的顶点 + 法线方向
    gl_Position = explodedPos + vec4(gs_in[index].normal, 0.0) * MAGNITUDE;
    EmitVertex();

    EndPrimitive();
}

void main() {    
    GenerateLine(0); // 第一个顶点法线
    GenerateLine(1); // 第二个顶点法线
    GenerateLine(2); // 第三个顶点法线
}
