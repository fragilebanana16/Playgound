#version 330 core
layout(triangles) in;
layout(triangle_strip, max_vertices = 5) out;
uniform float time;
uniform mat4 projection;

in VS_OUT {
    vec3 color;
    vec3 normal;
    vec3 posView;
} gs_in[];

out vec3 fColor;

vec4 explode(vec3 position, vec3 normal)
{
    float magnitude = 2.0;
    vec3 direction = normal * ((sin(time / 2.0) + 1.0) / 4.0) * magnitude; 
    return projection * (vec4(position, 1.0) + vec4(direction, 0.0));
}

void build_house()
{    
    fColor = gs_in[0].color;
    gl_Position = explode(gs_in[0].posView, gs_in[0].normal);
    EmitVertex();   
    gl_Position = explode(gs_in[1].posView, gs_in[1].normal);
    EmitVertex();
    gl_Position = explode(gs_in[2].posView, gs_in[2].normal);
    EmitVertex();
    EndPrimitive();
}

void main() {    
    build_house();
}
