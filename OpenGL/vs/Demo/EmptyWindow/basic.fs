#version 330 core
out vec4 FragColor;
uniform float time;

in vec2 vPos;
void main() {
	float r = sin(time + vPos.x * 5.0) * 0.5 + 0.5; 
	float g = sin(time + vPos.y * 5.0) * 0.5 + 0.5; 
	float b = sin(time * 0.5) * 0.5 + 0.5; 
	FragColor = vec4(r, g, b, 1.0);
}