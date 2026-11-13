#include <glad/glad.h>
#include <GLFW/glfw3.h>
#include <glm/glm.hpp>
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <imgui.h>
#include <imgui_impl_glfw_gl3.h>

#include <iostream>
#include <cmath>

// ---------------------------------------------------------------------------
// Shaders (inline)
// ---------------------------------------------------------------------------
const char* vertexShaderSource = R"(
#version 430
layout (location=0) in vec3 position;
uniform mat4 mv_matrix;
uniform mat4 proj_matrix;
uniform vec3 color;
out vec4 varyingColor;
void main(void)
{
    gl_Position = proj_matrix * mv_matrix * vec4(position, 1.0);
    varyingColor = vec4(color, 1.0);
}
)";

const char* fragmentShaderSource = R"(
#version 430
in vec4 varyingColor;
out vec4 color;
void main(void)
{
    color = varyingColor;
}
)";

// ---------------------------------------------------------------------------
// Global state
// ---------------------------------------------------------------------------
GLuint shaderProgram = 0;
GLuint VAO = 0, VBO = 0;
GLint  mvLoc = -1, projLoc = -1, colorLoc = -1;

int   gWidth = 800, gHeight = 600;
float gAspect = 800.0f / 600.0f;

// frustum parameters (adjusted from ImGui)
float gNear = 0.001f;
float gFar  = 1000.0f;
float gFov  = 50.0f;

// cube B offset relative to cube A
float gOffsetX = 0.6f;
float gOffsetY = 0.6f;
float gOffsetZ = 0.0002f;

// camera looks at the cubes from an angle so that the overlapping faces are
// not fronto-parallel: the depth then varies across the faces, which is what
// makes z-fighting visible instead of a single wrong winner.
const glm::vec3 CAMERA_POS(4.0f, 2.5f, 4.0f);
const glm::vec3 CAMERA_TARGET(0.3f, 0.3f, 0.0f);
const float CUBE_DISTANCE = 5.9f;   // approx. camera distance to the cubes

// 2x2x2 cube centred on the origin: 36 vertices / 12 triangles
static const float CUBE_VERTICES[108] =
{
    -1.0f,  1.0f, -1.0f, -1.0f, -1.0f, -1.0f,  1.0f, -1.0f, -1.0f,
     1.0f, -1.0f, -1.0f,  1.0f,  1.0f, -1.0f, -1.0f,  1.0f, -1.0f,
     1.0f, -1.0f, -1.0f,  1.0f, -1.0f,  1.0f,  1.0f,  1.0f, -1.0f,
     1.0f, -1.0f,  1.0f,  1.0f,  1.0f,  1.0f,  1.0f,  1.0f, -1.0f,
     1.0f, -1.0f,  1.0f, -1.0f, -1.0f,  1.0f,  1.0f,  1.0f,  1.0f,
    -1.0f, -1.0f,  1.0f, -1.0f,  1.0f,  1.0f,  1.0f,  1.0f,  1.0f,
    -1.0f, -1.0f,  1.0f, -1.0f, -1.0f, -1.0f, -1.0f,  1.0f,  1.0f,
    -1.0f, -1.0f, -1.0f, -1.0f,  1.0f, -1.0f, -1.0f,  1.0f,  1.0f,
    -1.0f, -1.0f,  1.0f,  1.0f, -1.0f,  1.0f,  1.0f, -1.0f, -1.0f,
     1.0f, -1.0f, -1.0f, -1.0f, -1.0f, -1.0f, -1.0f, -1.0f,  1.0f,
    -1.0f,  1.0f, -1.0f,  1.0f,  1.0f, -1.0f,  1.0f,  1.0f,  1.0f,
     1.0f,  1.0f,  1.0f, -1.0f,  1.0f,  1.0f, -1.0f,  1.0f, -1.0f
};

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* window);

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
void setupVertices()
{
    glGenVertexArrays(1, &VAO);
    glBindVertexArray(VAO);

    glGenBuffers(1, &VBO);
    glBindBuffer(GL_ARRAY_BUFFER, VBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(CUBE_VERTICES), CUBE_VERTICES, GL_STATIC_DRAW);

    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 0, 0);
    glEnableVertexAttribArray(0);

    glBindVertexArray(0);
}

unsigned int buildShader(GLenum type, const char* source)
{
    unsigned int shader = glCreateShader(type);
    glShaderSource(shader, 1, &source, NULL);
    glCompileShader(shader);

    int success;
    char infoLog[512];
    glGetShaderiv(shader, GL_COMPILE_STATUS, &success);
    if (!success)
    {
        glGetShaderInfoLog(shader, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::COMPILATION_FAILED\n" << infoLog << std::endl;
    }
    return shader;
}

void init(GLFWwindow* window)
{
    unsigned int vs = buildShader(GL_VERTEX_SHADER, vertexShaderSource);
    unsigned int fs = buildShader(GL_FRAGMENT_SHADER, fragmentShaderSource);

    shaderProgram = glCreateProgram();
    glAttachShader(shaderProgram, vs);
    glAttachShader(shaderProgram, fs);
    glLinkProgram(shaderProgram);

    int success;
    char infoLog[512];
    glGetProgramiv(shaderProgram, GL_LINK_STATUS, &success);
    if (!success)
    {
        glGetProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
    }
    glDeleteShader(vs);
    glDeleteShader(fs);

    mvLoc    = glGetUniformLocation(shaderProgram, "mv_matrix");
    projLoc  = glGetUniformLocation(shaderProgram, "proj_matrix");
    colorLoc = glGetUniformLocation(shaderProgram, "color");

    glfwGetFramebufferSize(window, &gWidth, &gHeight);
    gAspect = (float)gWidth / (float)gHeight;

    setupVertices();
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------
void drawCube(const glm::vec3& color, const glm::mat4& model, const glm::mat4& view, const glm::mat4& proj)
{
    glUniformMatrix4fv(mvLoc,   1, GL_FALSE, glm::value_ptr(view * model));
    glUniformMatrix4fv(projLoc, 1, GL_FALSE, glm::value_ptr(proj));
    glUniform3fv(colorLoc, 1, glm::value_ptr(color));

    glBindVertexArray(VAO);
    glDrawArrays(GL_TRIANGLES, 0, 36);
    glBindVertexArray(0);
}

void display()
{
    glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

    glm::mat4 proj = glm::perspective(glm::radians(gFov), gAspect, gNear, gFar);
    glm::mat4 view = glm::lookAt(CAMERA_POS, CAMERA_TARGET, glm::vec3(0.0f, 1.0f, 0.0f));

    glUseProgram(shaderProgram);
    glEnable(GL_DEPTH_TEST);
    glDepthFunc(GL_LEQUAL);

    // cube A (red)
    drawCube(glm::vec3(1.0f, 0.25f, 0.25f), glm::mat4(1.0f), view, proj);

    // cube B (green), offset so that it overlaps cube A
    glm::mat4 modelB = glm::translate(glm::mat4(1.0f), glm::vec3(gOffsetX, gOffsetY, gOffsetZ));
    drawCube(glm::vec3(0.25f, 1.0f, 0.35f), modelB, view, proj);
}

// ---------------------------------------------------------------------------
// ImGui controls
// ---------------------------------------------------------------------------
void drawImGui()
{
    ImGui::Begin("Z-Fighting Test");

    ImGui::Text("Two overlapping cubes - inspect the overlap region");
    ImGui::Separator();

    float logNear = std::log10(gNear);
    if (ImGui::SliderFloat("Near (log10)", &logNear, -5.0f, 1.0f, "%.3f"))
        gNear = std::pow(10.0f, logNear);

    float logFar = std::log10(gFar);
    if (ImGui::SliderFloat("Far (log10)", &logFar, 0.0f, 5.0f, "%.3f"))
        gFar = std::pow(10.0f, logFar);

    ImGui::SliderFloat("FOV (degrees)", &gFov, 20.0f, 120.0f, "%.1f");
    ImGui::SliderFloat("Cube offset X", &gOffsetX, -1.0f, 1.0f, "%.3f");
    ImGui::SliderFloat("Cube offset Y", &gOffsetY, -1.0f, 1.0f, "%.3f");
    ImGui::SliderFloat("Cube offset Z", &gOffsetZ, 0.0f, 0.01f, "%.5f");

    // keep the frustum valid
    if (gFar < gNear * 1.01f)
        gFar = gNear * 1.01f;

    ImGui::Separator();
    ImGui::Text("near = %.6f   far = %.2f", gNear, gFar);
    ImGui::Text("far / near = %.1f", gFar / gNear);

    // approximate world-space depth resolution of a 24-bit depth buffer
    // dz ~= z^2 * (f - n) / (2 * f * n * 2^24)
    float dz = (CUBE_DISTANCE * CUBE_DISTANCE) * (gFar - gNear)
             / (2.0f * gFar * gNear * 16777216.0f);
    ImGui::Text("depth resolution @ z=%.0f: %.6f", CUBE_DISTANCE, dz);
    ImGui::Text("cube z separation: %.5f", gOffsetZ);

    bool fighting = (gOffsetZ < dz);
    ImGui::TextColored(fighting ? ImVec4(1.0f, 0.3f, 0.3f, 1.0f) : ImVec4(0.3f, 1.0f, 0.3f, 1.0f),
                       fighting ? "STATUS: Z-FIGHTING" : "STATUS: CLEAN");

    ImGui::Separator();
    if (ImGui::Button("Reset to defaults"))
    {
        gNear = 0.001f; gFar = 1000.0f; gFov = 50.0f;
        gOffsetX = 0.6f; gOffsetY = 0.6f; gOffsetZ = 0.0002f;
    }
    ImGui::SameLine();
    ImGui::TextDisabled("Tip: larger Near / smaller Far -> better depth precision");

    ImGui::End();
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
int main()
{
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    GLFWwindow* window = glfwCreateWindow(gWidth, gHeight, "Z-Fighting Test - Standard", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }
    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);

    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }

    // ImGui
    ImGui::CreateContext();
    ImGui_ImplGlfwGL3_Init(window, true);
    ImGui::StyleColorsDark();

    init(window);

    while (!glfwWindowShouldClose(window))
    {
        processInput(window);

        ImGui_ImplGlfwGL3_NewFrame();
        drawImGui();

        display();

        ImGui::Render();
        ImGui_ImplGlfwGL3_RenderDrawData(ImGui::GetDrawData());

        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    ImGui_ImplGlfwGL3_Shutdown();
    ImGui::DestroyContext();

    glDeleteVertexArrays(1, &VAO);
    glDeleteBuffers(1, &VBO);
    glDeleteProgram(shaderProgram);

    glfwDestroyWindow(window);
    glfwTerminate();
    return 0;
}

void processInput(GLFWwindow* window)
{
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
}

void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    gWidth = width;
    gHeight = height;
    gAspect = (float)width / (float)height;
    glViewport(0, 0, width, height);
}
