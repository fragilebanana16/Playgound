#version 330 core
out vec4 FragColor;
uniform float time;
uniform vec2 iResolution;
in vec2 TexCoords;
in vec3 Normal;  
in vec3 FragPos;  

void main() {
	vec2 uv = gl_FragCoord.xy;
	if(gl_FrontFacing)
        FragColor = vec4(0.70, 0.90, 0.85, 1);  // 浅青绿
    else
        FragColor = vec4(0.95, 0.90, 0.75, 1);  // 米黄
}