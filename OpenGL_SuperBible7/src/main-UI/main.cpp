#include <sb7.h>
#include <shader.h>   // sb7::shader::load

// ---- ImGui ----
#include <imgui.h>
#include <imgui_impl_glfw.h>
#include <imgui_impl_opengl3.h>

class tessellated_app : public sb7::application
{
    void init()
    {
        static const char title[] = "OpenGL SuperBible - Tessellation";

        sb7::application::init();

        memcpy(info.title, title, sizeof(title));
    }

    virtual void startup()
    {
        // ---------------- 着色器 ----------------
        GLuint vs  = sb7::shader::load("./shaders/main.vs.glsl",  GL_VERTEX_SHADER,          true);
        GLuint tcs = sb7::shader::load("./shaders/main.tcs.glsl", GL_TESS_CONTROL_SHADER,    true);
        GLuint tes = sb7::shader::load("./shaders/main.tes.glsl", GL_TESS_EVALUATION_SHADER, true);
        GLuint fs  = sb7::shader::load("./shaders/main.fs.glsl",  GL_FRAGMENT_SHADER,        true);

        program = glCreateProgram();
        glAttachShader(program, vs);
        glAttachShader(program, tcs);
        glAttachShader(program, tes);
        glAttachShader(program, fs);
        glLinkProgram(program);

        glDeleteShader(vs);
        glDeleteShader(tcs);
        glDeleteShader(tes);
        glDeleteShader(fs);

        glGenVertexArrays(1, &vao);
        glBindVertexArray(vao);

        glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);

        // ---------------- ImGui 初始化 ----------------
        IMGUI_CHECKVERSION();
        ImGui::CreateContext();
        ImGuiIO& io = ImGui::GetIO(); (void)io;
        io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;

        ImGui::StyleColorsDark();
GLFWwindow* win = glfwGetCurrentContext();
        ImGui_ImplGlfw_InitForOpenGL(win , true);
        ImGui_ImplOpenGL3_Init("#version 410");
    }

    virtual void render(double currentTime)
    {
        // ---------------- ImGui 新帧 ----------------
        ImGui_ImplOpenGL3_NewFrame();
        ImGui_ImplGlfw_NewFrame();
        ImGui::NewFrame();

        // ---------------- 清屏 ----------------
        static const GLfloat green[] = { 0.0f, 0.25f, 0.0f, 1.0f };
        glClearBufferfv(GL_COLOR, 0, green);

        // ---------------- 用程序 ----------------
        glUseProgram(program);

        // ---------------- ImGui 控件 ----------------
        static float tessLevel = 5.0f;
        static bool  showDemo  = false;

        ImGui::Begin("Tessellation Controls");
        ImGui::Text("FPS: %.1f", ImGui::GetIO().Framerate);
        ImGui::SliderFloat("Tess Level", &tessLevel, 1.0f, 16.0f);
        ImGui::Checkbox("Show Demo Window", &showDemo);
        ImGui::End();

        if (showDemo)
            ImGui::ShowDemoWindow(&showDemo);

        // ---------------- 设置 uniform（必须在 draw 之前） ----------------
        GLint loc = glGetUniformLocation(program, "uTessLevel");
        if (loc >= 0)
            glUniform1f(loc, tessLevel);

        // ---------------- 画 3D ----------------
        glDrawArrays(GL_PATCHES, 0, 3);

        // ---------------- 渲染 ImGui ----------------
        ImGui::Render();
        ImGui_ImplOpenGL3_RenderDrawData(ImGui::GetDrawData());
    }

    virtual void shutdown()
    {
        // ---------------- 关闭 ImGui ----------------
        ImGui_ImplOpenGL3_Shutdown();
        ImGui_ImplGlfw_Shutdown();
        ImGui::DestroyContext();

        glDeleteVertexArrays(1, &vao);
        glDeleteProgram(program);
    }

private:
    GLuint          program;
    GLuint          vao;
};

DECLARE_MAIN(tessellated_app)