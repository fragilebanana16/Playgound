#include <sb7.h>
#include <shader.h>   // sb7::shader::load

class singlepoint_app : public sb7::application
{
    void init()
    {
        static const char title[] = "OpenGL SuperBible - Main";

        sb7::application::init();

        memcpy(info.title, title, sizeof(title));
    }

    virtual void startup()
    {
        GLuint vs = sb7::shader::load("./shaders/main.vs.glsl", GL_VERTEX_SHADER, true);
        GLuint fs = sb7::shader::load("./shaders/main.fs.glsl", GL_FRAGMENT_SHADER, true);

        program = glCreateProgram();
        glAttachShader(program, vs);
        glAttachShader(program, fs);
        glLinkProgram(program);

        glDeleteShader(vs);
        glDeleteShader(fs);

        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);
    }

    virtual void render(double currentTime)
    {
        static const GLfloat black[] = { 0.0f, 0.0f, 0.0f, 1.0f };
        glClearBufferfv(GL_COLOR, 0, black);

        glUseProgram(program);
        GLfloat attrib[] = { (float)sin(currentTime) * 0.5f, 0.0f, 0.0f, 0.0f };
        GLfloat attribColor[] = { (float)sin(currentTime) * 0.5f, 0.5f, 0.5f, 0.0f };
        glVertexAttrib4fv(0, attrib);
        glVertexAttrib4fv(1, attribColor);
        glDrawArrays(GL_TRIANGLES, 0, 3);
    }

    virtual void shutdown()
    {
        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    GLuint program;
    GLuint vao;
};

DECLARE_MAIN(singlepoint_app)