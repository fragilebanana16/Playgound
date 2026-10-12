#include <sb7.h>
#include <shader.h>
#include <vmath.h>
#include <string>
#include <fstream>
#include <vector>
#include <iostream>
// ---------- 着色器日志打印（保留你原有的） ----------
static void print_shader_log(GLuint shader)
{
    std::string str;
    GLint len;

    glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &len);
    if (len != 0)
    {
        str.resize(len);
        glGetShaderInfoLog(shader, len, NULL, &str[0]);
    }

#ifdef _WIN32
    OutputDebugStringA(str.c_str());
#endif
}

class interleaved_app : public sb7::application
{
    void init() override
    {
        static const char title[] = "OpenGL - Interleaved DSA";
        sb7::application::init();
        memcpy(info.title, title, sizeof(title));
    }

    // ---------- 新增：保存 Program 为二进制文件 ----------
    bool saveProgramBinary(GLuint prog, const std::string& path)
    {
        GLint binaryLength = 0;
        glGetProgramiv(prog, GL_PROGRAM_BINARY_LENGTH, &binaryLength);
        if (binaryLength <= 0)
        {
            OutputDebugStringA("该 Program 不支持导出二进制（可能驱动不支持）\n");
            return false;
        }

        std::vector<char> buffer(binaryLength);
        GLenum format = 0;
        GLsizei written = 0;

        glGetProgramBinary(prog, binaryLength, &written, &format, buffer.data());

        std::ofstream file(path, std::ios::out | std::ios::binary);
        if (!file) return false;

        // 格式：[ GLenum format ] [ GLsizei length ] [ 二进制数据 ]
        file.write(reinterpret_cast<const char*>(&format), sizeof(GLenum));
        file.write(reinterpret_cast<const char*>(&written), sizeof(GLsizei));
        file.write(buffer.data(), written);

        return true;
    }

    // ---------- 新增：从二进制文件加载 Program ----------
    GLuint loadProgramBinary(const std::string& path)
    {
        std::ifstream file(path, std::ios::in | std::ios::binary | std::ios::ate);
        if (!file) return 0;

        std::streamsize size = file.tellg();
        file.seekg(0, std::ios::beg);
        if (size < (std::streamsize)(sizeof(GLenum) + sizeof(GLsizei))) return 0;

        std::vector<char> fileData(size);
        if (!file.read(fileData.data(), size)) return 0;

        GLenum format = 0;
        GLsizei length = 0;
        std::memcpy(&format, fileData.data(), sizeof(GLenum));
        std::memcpy(&length, fileData.data() + sizeof(GLenum), sizeof(GLsizei));

        const char* binaryData = fileData.data() + sizeof(GLenum) + sizeof(GLsizei);

        GLuint prog = glCreateProgram();
        glProgramBinary(prog, format, binaryData, length);

        GLint ok = 0;
        glGetProgramiv(prog, GL_LINK_STATUS, &ok);
        if (!ok)
        {
            OutputDebugStringA("加载二进制失败（显卡或驱动可能不同），将回退到源码编译\n");
            glDeleteProgram(prog);
            return 0;
        }

        OutputDebugStringA("成功从二进制加载 Program\n");
        return prog;
    }

    // ---------- 新增：根据显卡信息生成唯一的缓存文件名 ----------
    std::string makeCacheFileName()
    {
        const char* vendor   = (const char*)glGetString(GL_VENDOR);
        const char* renderer = (const char*)glGetString(GL_RENDERER);
        if (!vendor)   vendor = "unknown_vendor";
        if (!renderer) renderer = "unknown_renderer";

        // 将字符串中不合法的文件名字符替换为下划线
        auto sanitize = [](std::string s) {
            for (char& c : s)
                if (!isalnum((unsigned char)c) && c != '_' && c != '-') c = '_';
            return s;
        };

        return "cache_" + sanitize(vendor) + "_" + sanitize(renderer) + ".bin";
    }

    virtual void startup() override
    {
        AllocConsole();
        freopen("CONOUT$", "w", stdout);
        freopen("CONOUT$", "w", stderr);
        // ============ 1. 尝试从二进制加载 ============
        std::string cacheFile = makeCacheFileName();
        program = loadProgramBinary(cacheFile);

        // ============ 2. 如果加载失败，才走源码编译路径 ============
        if (program == 0)
        {
            GLuint vs = sb7::shader::load("./shaders/main.vs.glsl", GL_VERTEX_SHADER, true);
            GLuint fs = sb7::shader::load("./shaders/main.fs.glsl", GL_FRAGMENT_SHADER, true);

            program = glCreateProgram();

            glCompileShader(fs);
            print_shader_log(fs);

            glCompileShader(vs);
            print_shader_log(vs);

            glAttachShader(program, vs);
            glAttachShader(program, fs);

            glLinkProgram(program);
            glDeleteShader(vs);
            glDeleteShader(fs);

            // 编译成功后，顺手保存为二进制
            saveProgramBinary(program, cacheFile);
            std::cout << "From source\n";
        } else {
             std::cout << "From binary Program\n";
        }

        // ============ 3. 纹理初始化（保持你原有逻辑） ============
        glGenTextures(1, &texture);
        glBindTexture(GL_TEXTURE_2D, texture);

        glTexStorage2D(GL_TEXTURE_2D,
                       8,
                       GL_RGBA32F,
                       256, 256);

        float* data = new float[256 * 256 * 4];
        generate_texture(data, 256, 256);

        glTexSubImage2D(GL_TEXTURE_2D,
                        0,
                        0, 0,
                        256, 256,
                        GL_RGBA,
                        GL_FLOAT,
                        data);

        delete[] data;

        // ============ 4. VAO ============
        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);
    }

    virtual void render(double currentTime) override
    {
        static const GLfloat bg[] = { 0.1f, 0.1f, 0.1f, 1.0f };
        glClearBufferfv(GL_COLOR, 0, bg);

        glUseProgram(program);
        glDrawArrays(GL_TRIANGLES, 0, 3);
    }

    virtual void shutdown() override
    {
        glDeleteTextures(1, &texture);
        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    void generate_texture(float* data, int width, int height)
    {
        int x, y;

        for (y = 0; y < height; y++)
        {
            for (x = 0; x < width; x++)
            {
                data[(y * width + x) * 4 + 0] = (float)((x & y) & 0xFF) / 255.0f;
                data[(y * width + x) * 4 + 1] = (float)((x | y) & 0xFF) / 255.0f;
                data[(y * width + x) * 4 + 2] = (float)((x ^ y) & 0xFF) / 255.0f;
                data[(y * width + x) * 4 + 3] = 1.0f;
            }
        }
    }

private:
    GLuint program = 0;
    GLuint vao = 0;
    GLuint texture = 0;
};

DECLARE_MAIN(interleaved_app);