#version 330 core
layout(triangles) in;
layout(triangle_strip, max_vertices = 5) out;

uniform float time;

in VS_OUT {
    vec3 color;
} gs_in[];

out vec3 fColor;

vec4 explode(vec4 position, vec3 normal)
{
    float magnitude = 2.0;
    vec3 direction = normal * ((sin(time) + 1.0) / 2.0) * magnitude; 
    return position + vec4(direction, 0.0);
}

vec3 GetNormal()
{
   vec3 a = vec3(gl_in[0].gl_Position) - vec3(gl_in[1].gl_Position);
   vec3 b = vec3(gl_in[2].gl_Position) - vec3(gl_in[1].gl_Position);
   return normalize(cross(a, b));
}

void build_house(vec4 position)
{    
    fColor = gs_in[0].color;
	vec3 normal = GetNormal();
    gl_Position = explode(gl_in[0].gl_Position, normal);
    EmitVertex();   
    gl_Position = explode(gl_in[1].gl_Position, normal);
    EmitVertex();
    gl_Position = explode(gl_in[2].gl_Position, normal);
    EmitVertex();
    EndPrimitive();
}

void main() {    
    build_house(gl_in[0].gl_Position);
}
