#include <sb7.h>

class singlepoint_app : public sb7::application
{
    void init()
    {
        static const char title[] = "OpenGL SuperBible - Shadertoy Port";

        sb7::application::init();

        memcpy(info.title, title, sizeof(title));
    }

    virtual void startup()
    {
        // 顶点着色器：用一个覆盖全屏的大点，把 gl_Position 直接放在 NDC 中心，
        // 并让 gl_PointSize 覆盖整个视口（最大点大小有限制，见下方说明）
        static const char * vs_source[] =
        {
            "#version 420 core                             \n"
            "uniform vec2 iResolution;                     \n"
            "void main(void)                               \n"
            "{                                             \n"
            "    gl_Position = vec4(0.0, 0.0, 0.0, 1.0);   \n"
            "    gl_PointSize = max(iResolution.x, iResolution.y); \n"
            "}                                             \n"
        };

        // 片段着色器：把 Shadertoy 的 mainImage 逻辑搬进来
        static const char * fs_source[] =
        {
            "#version 420 core                             \n"
            "                                              \n"
            "uniform vec2  iResolution;                    \n"
            "uniform float iTime;                          \n"
            "out vec4 fragColor;                           \n"
            "                                              \n"
            "#define PI     3.1415926535897921284           \n"
            "#define REP    25                              \n"
            "#define d2r(x) (x * PI / 180.0)                \n"
            "#define WBCOL  (vec3(0.5, 0.7,  1.7))          \n"
            "#define WBCOL2 (vec3(0.15, 0.8, 1.7))          \n"
            "#define ZERO   (min(int(iTime),0))             \n"  // 注意：原版 ZERO 依赖 iFrame，这里用 0
            "                                              \n"
            "float hash( vec2 p ) {                        \n"
            "    float h = dot( p, vec2( 127.1, 311.7 ) ); \n"
            "    return fract( sin( h ) * 458.325421) * 2.0 - 1.0; \n"
            "}                                             \n"
            "                                              \n"
            "float noise( vec2 p ) {                       \n"
            "    vec2 i = floor( p );                      \n"
            "    vec2 f = fract( p );                      \n"
            "    f = f * f * ( 3.0 - 2.0 * f );            \n"
            "    return mix(                               \n"
            "        mix( hash( i + vec2( 0.0, 0.0 ) ), hash( i + vec2( 1.0, 0.0 ) ), f.x ), \n"
            "        mix( hash( i + vec2( 0.0, 1.0 ) ), hash( i + vec2( 1.0, 1.0 ) ), f.x ), \n"
            "        f.y                                   \n"
            "    );                                        \n"
            "}                                             \n"
            "                                              \n"
            "vec2 rot(vec2 p, float a) {                   \n"
            "    return vec2(                              \n"
            "        p.x * cos(a) - p.y * sin(a),          \n"
            "        p.x * sin(a) + p.y * cos(a));         \n"
            "}                                             \n"
            "                                              \n"
            "float nac(vec3 p, vec2 F, vec3 o) {           \n"
            "    const float R = 0.0001;                   \n"
            "    p += o;                                   \n"
            "    return length(max(abs(p.xy)-vec2(F),0.0)) - R; \n"
            "}                                             \n"
            "                                              \n"
            "float by(vec3 p, float F, vec3 o) {           \n"
            "    const float R = 0.0001;                   \n"
            "    p += o;                                   \n"
            "    return length(max(abs(mod(p.xy, 3.0))-F,0.0)) - R; \n"
            "}                                             \n"
            "                                              \n"
            "float recta(vec3 p, vec3 F, vec3 o) {         \n"
            "    const float R = 0.0001;                   \n"
            "    p += o;                                   \n"
            "    return length(max(abs(p)-F,0.0)) - R;     \n"
            "}                                             \n"
            "                                              \n"
            "float map1(vec3 p, float scale) {             \n"
            "    float G = 0.50;                           \n"
            "    float F = 0.50 * scale;                   \n"
            "    float t =  nac(p, vec2(F,F), vec3( G,  G, 0.0)); \n"
            "    t = min(t, nac(p, vec2(F,F), vec3( G, -G, 0.0))); \n"
            "    t = min(t, nac(p, vec2(F,F), vec3(-G,  G, 0.0))); \n"
            "    t = min(t, nac(p, vec2(F,F), vec3(-G, -G, 0.0))); \n"
            "    return t;                                 \n"
            "}                                             \n"
            "                                              \n"
            "float map2(vec3 p) {                          \n"
            "    float t = map1(p, 0.9);                   \n"
            "    t = max(t, recta(p, vec3(1.0, 1.0, 0.02), vec3(0.0, 0.0, 0.0))); \n"
            "    return t;                                 \n"
            "}                                             \n"
            "                                              \n"
            "float gennoise(vec2 p) {                      \n"
            "    float d = 0.5;                            \n"
            "    mat2 h = mat2( 1.6, 1.2, -1.2, 1.6 );     \n"
            "    float color = 0.0;                        \n"
            "    for( int i = 0; i < 2; i++ ) {            \n"
            "        color += d * noise( p * 5.0 + iTime); \n"
            "        p *= h;                               \n"
            "        d /= 2.0;                             \n"
            "    }                                         \n"
            "    return color;                             \n"
            "}                                             \n"
            "                                              \n"
            "void main(void)                               \n"
            "{                                             \n"
            "    vec4 outColor = vec4(0.0);                \n"
            "    vec2 fragCoord = gl_FragCoord.xy;         \n"
            "    for(int count = 0 ; count < 2; count++) { \n"
            "        vec2 uv = -1.0 + 2.0 * ( fragCoord.xy / iResolution.xy ); \n"
            "        uv *= 1.4;                            \n"
            "        uv.x += hash(uv.xy + iTime + float(count)) / 512.0; \n"
            "        uv.y += hash(uv.yx + iTime + float(count)) / 512.0; \n"
            "        vec3 dir = normalize(vec3(uv * vec2(iResolution.x / iResolution.y, 1.0), 1.0 + sin(iTime) * 0.01)); \n"
            "        dir.xz = rot(dir.xz, d2r(70.0));       \n"
            "        dir.xy = rot(dir.xy, d2r(90.0));       \n"
            "        vec3 pos    = vec3(-0.1 + sin(iTime * 0.3) * 0.1, 2.0 + cos(iTime * 0.4) * 0.1, -3.5); \n"
            "        vec3  col   = vec3(0.0);              \n"
            "        float t     = 0.0;                    \n"
            "        float M     = 1.002;                  \n"
            "        float bsh   = 0.01;                   \n"
            "        float dens  = 0.0;                    \n"
            "        for(int i = ZERO ; i < REP * 24; i++) { \n"
            "            float temp = map1(pos + dir * t, 0.6); \n"
            "            if(temp < 0.2) {                  \n"
            "                col += WBCOL * 0.005 * dens;  \n"
            "            }                                 \n"
            "            t += bsh * M;                     \n"
            "            bsh *= M;                         \n"
            "            dens += 0.025;                    \n"
            "        }                                     \n"
            "        t = 0.0;                              \n"
            "        float y = 0.0;                        \n"
            "        for(int i = ZERO ; i < REP; i++) {    \n"
            "            float temp = map2(pos + dir * t); \n"
            "            if(temp < 0.025) {                \n"
            "                col += WBCOL2 * 0.5;          \n"
            "            }                                 \n"
            "            t += temp;                        \n"
            "            y++;                              \n"
            "        }                                     \n"
            "        col += ((2.0 + uv.x) * WBCOL2) + (y / (25.0 * 50.0)); \n"
            "        col += gennoise(dir.xz) * 0.5;        \n"
            "        col *= 1.0 - uv.y * 0.5;              \n"
            "        col *= vec3(0.05);                    \n"
            "        col  = pow(col, vec3(0.717));         \n"
            "        outColor += vec4(col, 1.0 / (t));     \n"
            "    }                                         \n"
            "    fragColor = outColor / vec4(2.0);         \n"
            "}                                             \n"
        };

        program = glCreateProgram();
        GLuint fs = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fs, 1, fs_source, NULL);
        glCompileShader(fs);

        GLuint vs = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vs, 1, vs_source, NULL);
        glCompileShader(vs);

        glAttachShader(program, vs);
        glAttachShader(program, fs);

        glLinkProgram(program);

        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);
    }

    virtual void render(double currentTime)
    {
        // 背景清成黑色，shader 会覆盖全屏
        const GLfloat clear_color[] = { 0.0f, 0.0f, 0.0f, 1.0f };
glClearBufferfv(GL_COLOR, 0, clear_color);

        glUseProgram(program);

        // 传 uniform
        glUniform2f(glGetUniformLocation(program, "iResolution"),
                    (float)info.windowWidth, (float)info.windowHeight);
        glUniform1f(glGetUniformLocation(program, "iTime"),
                    (float)currentTime);

        glPointSize((float)info.windowWidth);  // 尽量大
        glDrawArrays(GL_POINTS, 0, 1);
    }

    virtual void shutdown()
    {
        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    GLuint          program;
    GLuint          vao;
};

DECLARE_MAIN(singlepoint_app)