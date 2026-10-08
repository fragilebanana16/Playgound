#include <sb7.h>
#include <shader.h>

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

        program = glCreateProgram();
        glAttachShader(program, vs);
        glAttachShader(program, fs);
        glLinkProgram(program);
        glDeleteShader(vs);
        glDeleteShader(fs);

        static const GLfloat vertices[] = {
            -0.8f, -0.8f, 0.0f,   1.0f, 0.0f, 0.0f,
             0.8f, -0.8f, 0.0f,   0.0f, 1.0f, 0.0f,
             0.0f,  0.8f, 0.0f,   0.0f, 0.0f, 1.0f
        };

        const GLsizei stride = 6 * sizeof(float);

        glCreateBuffers(1, &vbo);
        glCreateVertexArrays(1, &vao);

        glNamedBufferData(vbo, sizeof(vertices), vertices, GL_STATIC_DRAW);

        glVertexArrayVertexBuffer(vao, 0, vbo, 0, stride);

        glVertexArrayAttribFormat(vao, 0, 3, GL_FLOAT, GL_FALSE, 0);
        glVertexArrayAttribBinding(vao, 0, 0);
        glEnableVertexArrayAttrib(vao, 0);

        glVertexArrayAttribFormat(vao, 1, 3, GL_FLOAT, GL_FALSE, 3 * sizeof(float));
        glVertexArrayAttribBinding(vao, 1, 0);
        glEnableVertexArrayAttrib(vao, 1);

        glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
    }

    virtual void render(double currentTime) override
    {
        static const GLfloat bg[] = { 0.1f, 0.1f, 0.1f, 1.0f };
        glClearBufferfv(GL_COLOR, 0, bg);

        glUseProgram(program);
        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, 3);
    }

    virtual void shutdown() override
    {
        glDeleteBuffers(1, &vbo);
        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    GLuint program;
    GLuint vao;
    GLuint vbo;
};

DECLARE_MAIN(interleaved_app);