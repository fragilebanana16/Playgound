#include <sb7.h>
#include <shader.h>
#include <vmath.h>
#include <string>
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

    virtual void startup() override
    {
        GLuint vs = sb7::shader::load("./shaders/main.vs.glsl", GL_VERTEX_SHADER, true);
        GLuint fs = sb7::shader::load("./shaders/main.fs.glsl", GL_FRAGMENT_SHADER, true);

        // Generate a name for the texture
        glGenTextures(1, &texture);

        // Now bind it to the context using the GL_TEXTURE_2D binding point
        glBindTexture(GL_TEXTURE_2D, texture);

        // Specify the amount of storage we want to use for the texture
        glTexStorage2D(GL_TEXTURE_2D,   // 2D texture
                       8,               // 8 mipmap levels
                       GL_RGBA32F,      // 32-bit floating-point RGBA data
                       256, 256);       // 256 x 256 texels

        // Define some data to upload into the texture
        float * data = new float[256 * 256 * 4];

        // generate_texture() is a function that fills memory with image data
        generate_texture(data, 256, 256);

        // Assume the texture is already bound to the GL_TEXTURE_2D target
        glTexSubImage2D(GL_TEXTURE_2D,  // 2D texture
                        0,              // Level 0
                        0, 0,           // Offset 0, 0
                        256, 256,       // 256 x 256 texels, replace entire image
                        GL_RGBA,        // Four channel data
                        GL_FLOAT,       // Floating point data
                        data);          // Pointer to data

        // Free the memory we allocated before - \GL now has our data
        delete [] data;

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
    void generate_texture(float * data, int width, int height)
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
    GLuint program;
    GLuint vao;
    GLuint texture;
};

DECLARE_MAIN(interleaved_app);