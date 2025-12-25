#version 330 core
in vec2 TexCoord;
out vec4 FragColor;
uniform vec2 iResolution;
uniform float iTime;

void main() {
    vec2 fragCoord = TexCoord;
    float HORIZON = 1.0;
    vec2 uv = fragCoord;
    vec3 color;
    if (uv.y < HORIZON) {
        vec2 uv2 = uv;
        uv2.y -= (iTime * 0.8);

        vec3 gray = vec3(0.2);
        vec3 black = vec3(0.0);
        vec3 yellow = vec3(1.0, 0.9, 0.4);

        vec2 center = vec2(0.5, 0.5);
        float d = distance(center + 1.0, uv * 2.5);

        float pulseHorizon = clamp(sin(iTime), 0.0, 0.5);
        float vignetteHorizon = smoothstep(0.4 + pulseHorizon, 2.99, d);

        float pulse = clamp(sin(iTime), 0.0, 0.5);
        float vignetteCenter = smoothstep(0.4 + pulse, 2.99, d);

        color = mix(gray, black, vignetteCenter);

        float lineWidth = 0.01;
        float lineSeparation = 0.01;

        float leftLineWhite = 0.1 - lineSeparation / 2.0 - lineWidth;
        float rightLineWhite = 0.9 + lineSeparation / 2.0 - lineWidth;

        float leftLine = center.x - lineSeparation / 2.0 - lineWidth;
        float rightLine = center.x + lineSeparation / 2.0 + lineWidth;

        float lineLength = lineWidth * 20.0;
        float lineSpace = lineWidth * 20.0;

        if (abs(uv2.x - leftLineWhite) < lineWidth)
            color = mix(vec3(1.0), black, vignetteCenter * 0.8);

        if (abs(uv2.x - rightLineWhite) < lineWidth)
            color = mix(vec3(1.0), black, vignetteCenter * 0.8);

        if (abs(uv2.x - leftLine) < lineWidth)
            color = mix(yellow, black, vignetteCenter * 0.8);

        float dash = mod((uv2.y - center.y + lineWidth), lineLength + lineSpace);
        if (abs(uv2.x - rightLine) < lineWidth && dash < lineLength)
            color = mix(yellow, black, vignetteCenter * 0.8);

        FragColor = vec4(color, 1.0);
        FragColor -= vignetteHorizon * 0.20;
    } else {
        FragColor = vec4(vec3(0.0), 1.0);
    }
}
