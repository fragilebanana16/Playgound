#version 330 core
out vec4 FragColor;
uniform float time;
uniform vec2 iResolution;
in vec2 TexCoords;
in vec3 Normal;  
in vec3 FragPos;  

void main() {
	vec2 uv = gl_FragCoord.xy;
    FragColor = vec4(0.95, 0.90, 0.0, 1);
}