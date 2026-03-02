#version 330 core

in vec3 vWorldPos;
in vec3 vModelPos;
out vec4 FragColor;

uniform vec3 fromColor;
uniform vec3 toColor;
uniform float t;         // 0~1 过渡
uniform float width;     // 可选柔和宽度

//------------------------------------------------------------
// 下面是 hex transition 所需的函数（已裁剪为可用版本）
//------------------------------------------------------------

#define HEXTILE_SIZE 0.05
#define RANDOMNESS   0.75

float hash(vec2 co) {
    return fract(sin(dot(co, vec2(12.9898,58.233))) * 13758.5453);
}

float tanh_approx(float x) {
    float x2 = x*x;
    return clamp(x*(27.0 + x2)/(27.0+9.0*x2), -1.0, 1.0);
}

vec2 hextile(inout vec2 p) {
    const vec2 sz  = vec2(1.0, sqrt(3.0));
    const vec2 hsz = 0.5 * sz;

    vec2 p1 = mod(p, sz) - hsz;
    vec2 p2 = mod(p - hsz, sz) - hsz;
    vec2 p3 = dot(p1, p1) < dot(p2, p2) ? p1 : p2;

    vec2 n = ((p3 - p + hsz) / sz);
    p = p3;

    n -= vec2(0.5);
    return round(n * 2.0) / 2.0;
}

float hex(vec2 p, float r) {
    p.xy = p.yx;
    const vec3 k = vec3(-sqrt(3.0/4.0), 1.0/2.0, 1.0/sqrt(3.0));
    p = abs(p);
    p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
    p -= vec2(clamp(p.x, -k.z*r, k.z*r), r);
    return length(p) * sign(p.y);
}

vec3 hexTransition(vec2 p, vec3 from, vec3 to, float m)
{
    m = clamp(m, 0.0, 1.0);

    const float hz = HEXTILE_SIZE;
    const float rz = RANDOMNESS;

    vec2 hp = p / hz;
    vec2 hn = hextile(hp) * hz * -vec2(-1.0, sqrt(3.0));
    float r = hash(hn + 123.4);

    float sz = 0.45 * (0.5 + 0.5 * tanh_approx((rz*r + hn.x + hn.y - 3.0 + m*6.0) * 2.0));
    float hd = (hex(hp, sz) - 0.1 * sz) * hz;

    float mm = smoothstep(-0.01, 0.01, -hd);
    mm = mix(0.0, mm, smoothstep(0.0, 0.1, m));
    mm = mix(mm, 1.0, smoothstep(0.9, 1.0, m));

    return mix(from, to, mm);
}

//------------------------------------------------------------
// 主函数：使用 hexTransition 替代 step(t, normalized)
//------------------------------------------------------------

void main()
{
    // 用模型空间 XY 作为 hex pattern 输入
    vec2 p = vWorldPos.xy;

    // 计算 hex 过渡
    vec3 color = hexTransition(p, fromColor, toColor, t);

    FragColor = vec4(color, 1.0);
}
