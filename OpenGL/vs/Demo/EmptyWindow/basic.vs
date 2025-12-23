#version 330 core
uniform int gridSize;
uniform float time;

out vec2 vPos;
void main() {
    int id = gl_VertexID;

    // 将 gl_VertexID 映射到二维坐标
    int x = id % gridSize;
    int y = id / gridSize;

    // 映射到 [-1, 1] 区域
    float fx = (float(x) / float(gridSize - 1)) * 2.0 - 1.0;
    float fy = (float(y) / float(gridSize - 1)) * 2.0 - 1.0;
    vPos = vec2(fx, fy);
	
	float wave = sin(fx * 10.0 + time * 3.0) * 0.1;
    gl_Position = vec4(fx, fy + wave, 0.0, 1.0);

    gl_PointSize = 10.0;
}
