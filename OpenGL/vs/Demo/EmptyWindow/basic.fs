#version 330 core
out vec4 FragColor;
uniform float time;
uniform vec2 iResolution;

in vec2 vPos;
void main() {
	vec2 uv = gl_FragCoord.xy;
	if (uv.x < iResolution.x * 0.5) {
		// 左半屏
		if (uv.y < iResolution.y * 0.5)
			FragColor = vec4(1, 0, 0, 1);   // 左下：红
		else
			FragColor = vec4(0, 1, 0, 1);   // 左上：绿
	} else {
		// 右半屏
		if (uv.y < iResolution.y * 0.5)
			FragColor = vec4(0, 0, 1, 1);   // 右下：蓝
		else
			FragColor = vec4(1, 1, 0, 1);   // 右上：黄
	}
}