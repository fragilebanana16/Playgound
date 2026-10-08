#include <sb7.h>
#include <shader.h>
#include <vmath.h>

#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>

class spinning_cube_app : public sb7::application
{
    void init()
    {
        static const char title[] = "OpenGL SuperBible - Spinning Cube";
        sb7::application::init();
        memcpy(info.title, title, sizeof(title));
    }

    virtual void startup()
    {

        GLuint vs = sb7::shader::load("./shaders/main.vs.glsl", GL_VERTEX_SHADER,   true);
        GLuint fs = sb7::shader::load("./shaders/main.fs.glsl", GL_FRAGMENT_SHADER, true);

        program = glCreateProgram();
        glAttachShader(program, vs);
        glAttachShader(program, fs);
        glLinkProgram(program);

        glDeleteShader(vs);
        glDeleteShader(fs);


        mv_location   = glGetUniformLocation(program, "mv_matrix");
        proj_location = glGetUniformLocation(program, "proj_matrix");


        static const GLfloat vertex_positions[] =
        {

            -0.25f,  0.25f, -0.25f,
            -0.25f, -0.25f, -0.25f,
             0.25f, -0.25f, -0.25f,
             0.25f, -0.25f, -0.25f,
             0.25f,  0.25f, -0.25f,
            -0.25f,  0.25f, -0.25f,


            -0.25f,  0.25f,  0.25f,
             0.25f,  0.25f,  0.25f,
             0.25f, -0.25f,  0.25f,
             0.25f, -0.25f,  0.25f,
            -0.25f, -0.25f,  0.25f,
            -0.25f,  0.25f,  0.25f,


            -0.25f,  0.25f,  0.25f,
            -0.25f,  0.25f, -0.25f,
            -0.25f, -0.25f, -0.25f,
            -0.25f, -0.25f, -0.25f,
            -0.25f, -0.25f,  0.25f,
            -0.25f,  0.25f,  0.25f,


             0.25f,  0.25f,  0.25f,
             0.25f, -0.25f,  0.25f,
             0.25f, -0.25f, -0.25f,
             0.25f, -0.25f, -0.25f,
             0.25f,  0.25f, -0.25f,
             0.25f,  0.25f,  0.25f,


            -0.25f,  0.25f, -0.25f,
             0.25f,  0.25f, -0.25f,
             0.25f,  0.25f,  0.25f,
             0.25f,  0.25f,  0.25f,
            -0.25f,  0.25f,  0.25f,
            -0.25f,  0.25f, -0.25f,


            -0.25f, -0.25f, -0.25f,
            -0.25f, -0.25f,  0.25f,
             0.25f, -0.25f,  0.25f,
             0.25f, -0.25f,  0.25f,
             0.25f, -0.25f, -0.25f,
            -0.25f, -0.25f, -0.25f
        };


        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);

        glGenBuffers(1, &vbo);
        glBindBuffer(GL_ARRAY_BUFFER, vbo);
        glBufferData(GL_ARRAY_BUFFER,
                     sizeof(vertex_positions),
                     vertex_positions,
                     GL_STATIC_DRAW); // GL_STATIC_DRAW: only use once
 
        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, NULL); // location = 0, xyz 3 , stride 3, offset null
        glEnableVertexAttribArray(0);

        glBindVertexArray(0);


        aspect = (float)info.windowWidth / (float)info.windowHeight;
        if (aspect <= 0.0f) aspect = 1.0f;
        proj_matrix = vmath::perspective(50.0f, aspect, 0.1f, 1000.0f); // degree, near, far


        glEnable(GL_DEPTH_TEST);


        glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);


        IMGUI_CHECKVERSION();
        ImGui::CreateContext();
        ImGuiIO& io = ImGui::GetIO(); (void)io;
        io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;
        ImGui::StyleColorsDark();

        GLFWwindow* win = glfwGetCurrentContext();
        ImGui_ImplGlfw_InitForOpenGL(win, true);
        ImGui_ImplOpenGL3_Init("#version 410");
    }

    virtual void render(double currentTime)
    {

        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        static const GLfloat bg[] = { 0.0f, 0.0f, 0.0f, 1.0f };
        glClearBufferfv(GL_COLOR, 0, bg);

        static const GLfloat one = 1.0f;
        glClearBufferfv(GL_DEPTH, 0, &one);

        static float rotSpeed  = 1.0f;
        static bool  wireframe = false;

        ImGui::Begin("Spinning Cube Controls");
        ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);
        ImGui::SliderFloat("Rotation Speed", &rotSpeed, 0.0f, 5.0f);
        ImGui::Checkbox("Wireframe", &wireframe);
        ImGui::End();

        glPolygonMode(GL_FRONT_AND_BACK, wireframe ? GL_LINE : GL_FILL);

        glUseProgram(program);

        float f = (float)currentTime * (float)M_PI * 0.1f * rotSpeed;

        vmath::mat4 mv_matrix =
            vmath::translate(0.0f, 0.0f, -4.0f) *

            vmath::rotate((float)currentTime * 45.0f * rotSpeed, 0.0f, 1.0f, 0.0f) *
            vmath::rotate((float)currentTime * 81.0f * rotSpeed, 1.0f, 0.0f, 0.0f);

        glUniformMatrix4fv(mv_location,   1, GL_FALSE, mv_matrix);
        glUniformMatrix4fv(proj_location, 1, GL_FALSE, proj_matrix);

        glBindVertexArray(vao);
        glDrawArrays(GL_TRIANGLES, 0, 36);
        glBindVertexArray(0);

        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
    }

    virtual void onResize(int w, int h)
    {
        sb7::application::onResize(w, h);
        aspect = (float)info.windowWidth / (float)info.windowHeight;
        if (aspect <= 0.0f) aspect = 1.0f;
        proj_matrix = vmath::perspective(50.0f, aspect, 0.1f, 1000.0f);
    }

    virtual void shutdown()
    {
        ImGui_ImplOpenGL3_Shutdown();
        ImGui_ImplGlfw_Shutdown();
        ImGui::DestroyContext();

        glDeleteBuffers(1, &vbo);
        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    GLuint program = 0;
    GLuint vao = 0;
    GLuint vbo = 0;

    GLint  mv_location = -1;
    GLint  proj_location = -1;

    float  aspect = 1.0f;
    vmath::mat4 proj_matrix;
};

DECLARE_MAIN(spinning_cube_app)