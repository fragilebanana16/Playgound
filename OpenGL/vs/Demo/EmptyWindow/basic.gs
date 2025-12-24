#version 330 core
layout(points) in;
layout(triangle_strip, max_vertices = 6) out;

void main() {
    vec4 c = gl_in[0].gl_Position;
    float R = 0.2;

    // 三角形
    gl_Position = c;
    EmitVertex();
    gl_Position = c + vec4(R, 0.0, 0.0, 0.0);
    EmitVertex();
    gl_Position = c + vec4(0.0, R, 0.0, 0.0);
    EmitVertex();

    EndPrimitive();
}
