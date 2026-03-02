#include <glad/glad.h>
#include <GLFW/glfw3.h>

#include <iostream>
#include <learnopengl/shader.h>
#include <learnopengl/camera.h>
#include "imgui/imgui.h"
#include "imgui/imgui_impl_glfw_gl3.h"
#include <glm/gtc/type_ptr.hpp>
#include <glm/gtc/noise.hpp>
#include <learnopengl/model.h>

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void processInput(GLFWwindow* window);

// settings
const unsigned int SCR_WIDTH = 800;
const unsigned int SCR_HEIGHT = 600;

// camera
Camera camera(glm::vec3(0.0f, 0.0f, 3.0f));
float lastX = SCR_WIDTH / 2.0f;
float lastY = SCR_HEIGHT / 2.0f;
bool firstMouse = true;
// timing
float deltaTime = 0.0f;
float lastFrame = 0.0f;

float yaw = 0.0f;   // 水平角（绕 Y 轴）
float pitch = glm::radians(15.0f);

// 当前真正显示的颜色（已经完成过渡的）
static glm::vec3 g_CurrentColor = glm::vec3(1.0f, 0.0f, 0.0f);

// ImGui 面板上正在编辑的目标颜色
static glm::vec3 g_ImGuiColor = g_CurrentColor;

// 这次过渡的起始颜色 & 目标颜色
static glm::vec3 g_FromColor = g_CurrentColor;
static glm::vec3 g_ToColor = g_CurrentColor;

// 过渡进度：0 → 1
static float g_TransitionT = 1.0f;
static bool  g_InTransition = false;

void framebuffer_size_callback(GLFWwindow* window, int width, int height);
void mouse_callback(GLFWwindow* window, double xpos, double ypos);
int main()
{
    // glfw: initialize and configure
    // ------------------------------
    glfwInit();
    glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 3);
    glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 3);
    glfwWindowHint(GLFW_OPENGL_PROFILE, GLFW_OPENGL_CORE_PROFILE);
    glfwWindowHint(GLFW_SAMPLES, 4);
#ifdef __APPLE__
    glfwWindowHint(GLFW_OPENGL_FORWARD_COMPAT, GL_TRUE);
#endif

    // glfw window creation
    // --------------------
    GLFWwindow* window = glfwCreateWindow(SCR_WIDTH, SCR_HEIGHT, "LearnOpenGL", NULL, NULL);
    if (window == NULL)
    {
        std::cout << "Failed to create GLFW window" << std::endl;
        glfwTerminate();
        return -1;
    }

    glfwMakeContextCurrent(window);
    glfwSetFramebufferSizeCallback(window, framebuffer_size_callback);
    glfwSetCursorPosCallback(window, mouse_callback);

    // glad: load all OpenGL function pointers
    // ---------------------------------------
    if (!gladLoadGLLoader((GLADloadproc)glfwGetProcAddress))
    {
        std::cout << "Failed to initialize GLAD" << std::endl;
        return -1;
    }
    glEnable(GL_MULTISAMPLE);
    glEnable(GL_DEPTH_TEST);

    // Setup ImGui binding
    ImGui::CreateContext();
    ImGui_ImplGlfwGL3_Init(window, true);
    // Setup style
    ImGui::StyleColorsDark();
    //glEnable(GL_CULL_FACE);
    //       2________3
    //       /|      /|
    //    6 /_|____7/ |
    //     | |_____| _|
    //     | /0    | /1
    //     |/______|/
    //     4       5
    float cubeVertices[] = {
        // positions          // normals           // texture Coords // color
        // Back face
        -0.5f, -0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   0.0f, 0.0f,     1.0f, 1.0f, 0.0f, // 0
         0.5f,  0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   1.0f, 1.0f,     0.0f, 1.0f, 0.0f, // 3
         0.5f, -0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   1.0f, 0.0f,     0.0f, 0.0f, 1.0f, // 1

         0.5f,  0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   1.0f, 1.0f,     0.0f, 1.0f, 0.0f,
        -0.5f, -0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,
        -0.5f,  0.5f, -0.5f,   0.0f,  0.0f, -1.0f,   0.0f, 1.0f,     1.0f, 0.0f, 0.0f, // 2

        // Front face
        -0.5f, -0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   0.0f, 0.0f,     0.0f, 1.0f, 1.0f, // 4
         0.5f, -0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   1.0f, 0.0f,     1.0f, 0.0f, 1.0f, // 5
         0.5f,  0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   1.0f, 1.0f,     1.0f, 0.0f, 0.5f, // 7

         0.5f,  0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   1.0f, 1.0f,     0.0f, 0.0f, 1.0f,
        -0.5f,  0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   0.0f, 1.0f,     1.0f, 0.5f, 0.0f, // 6
        -0.5f, -0.5f,  0.5f,   0.0f,  0.0f,  1.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,

        // Left face
        -0.5f,  0.5f,  0.5f,  -1.0f,  0.0f,  0.0f,   1.0f, 0.0f,     1.0f, 0.5f, 0.0f,
        -0.5f,  0.5f, -0.5f,  -1.0f,  0.0f,  0.0f,   1.0f, 1.0f,     0.0f, 0.0f, 0.0f,
        -0.5f, -0.5f, -0.5f,  -1.0f,  0.0f,  0.0f,   0.0f, 1.0f,     0.0f, 0.0f, 0.0f,

        -0.5f, -0.5f, -0.5f,  -1.0f,  0.0f,  0.0f,   0.0f, 1.0f,     1.0f, 0.0f, 0.5f,
        -0.5f, -0.5f,  0.5f,  -1.0f,  0.0f,  0.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,
        -0.5f,  0.5f,  0.5f,  -1.0f,  0.0f,  0.0f,   1.0f, 0.0f,     0.0f, 0.0f, 0.0f,

        // Right face
         0.5f,  0.5f,  0.5f,   1.0f,  0.0f,  0.0f,   1.0f, 0.0f,     1.0f, 0.0f, 1.0f,
         0.5f, -0.5f, -0.5f,   1.0f,  0.0f,  0.0f,   0.0f, 1.0f,     0.0f, 0.0f, 0.0f,
         0.5f,  0.5f, -0.5f,   1.0f,  0.0f,  0.0f,   1.0f, 1.0f,     0.0f, 0.0f, 0.0f,

         0.5f, -0.5f, -0.5f,   1.0f,  0.0f,  0.0f,   0.0f, 1.0f,     0.0f, 0.0f, 1.0f,
         0.5f,  0.5f,  0.5f,   1.0f,  0.0f,  0.0f,   1.0f, 0.0f,     0.0f, 0.0f, 0.0f,
         0.5f, -0.5f,  0.5f,   1.0f,  0.0f,  0.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,

         // Bottom face
         -0.5f, -0.5f, -0.5f,   0.0f, -1.0f,  0.0f,   0.0f, 1.0f,     1.0f, 1.0f, 1.0f,
          0.5f, -0.5f, -0.5f,   0.0f, -1.0f,  0.0f,   1.0f, 1.0f,     0.0f, 0.0f, 0.0f,
          0.5f, -0.5f,  0.5f,   0.0f, -1.0f,  0.0f,   1.0f, 0.0f,     0.0f, 0.0f, 0.0f,

          0.5f, -0.5f,  0.5f,   0.0f, -1.0f,  0.0f,   1.0f, 0.0f,     0.0f, 1.0f, 1.0f,
         -0.5f, -0.5f,  0.5f,   0.0f, -1.0f,  0.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,
         -0.5f, -0.5f, -0.5f,   0.0f, -1.0f,  0.0f,   0.0f, 1.0f,     0.0f, 0.0f, 0.0f,

         // Top face
         -0.5f,  0.5f, -0.5f,   0.0f,  1.0f,  0.0f,   0.0f, 1.0f,     1.0f, 0.5f, 1.0f,
          0.5f,  0.5f,  0.5f,   0.0f,  1.0f,  0.0f,   1.0f, 0.0f,     0.0f, 0.0f, 0.0f,
          0.5f,  0.5f, -0.5f,   0.0f,  1.0f,  0.0f,   1.0f, 1.0f,     0.0f, 0.0f, 0.0f,

          0.5f,  0.5f,  0.5f,   0.0f,  1.0f,  0.0f,   1.0f, 0.0f,     0.5f, 0.0f, 1.0f,
         -0.5f,  0.5f, -0.5f,   0.0f,  1.0f,  0.0f,   0.0f, 1.0f,     0.0f, 0.0f, 0.0f,
         -0.5f,  0.5f,  0.5f,   0.0f,  1.0f,  0.0f,   0.0f, 0.0f,     0.0f, 0.0f, 0.0f,
    };

    // cube VAO
   /* unsigned int cubeVAO, cubeVBO;
    glGenVertexArrays(1, &cubeVAO);
    glGenBuffers(1, &cubeVBO);
    glBindVertexArray(cubeVAO);
    glBindBuffer(GL_ARRAY_BUFFER, cubeVBO);
    glBufferData(GL_ARRAY_BUFFER, sizeof(cubeVertices), &cubeVertices, GL_STATIC_DRAW);
    glEnableVertexAttribArray(0);
    glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 11 * sizeof(float), (void*)0);
    glEnableVertexAttribArray(1);
    glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 11 * sizeof(float), (void*)(3 * sizeof(float)));
    glEnableVertexAttribArray(2);
    glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, 11 * sizeof(float), (void*)(6 * sizeof(float)));
    glEnableVertexAttribArray(3);
    glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, 11 * sizeof(float), (void*)(8 * sizeof(float)));
    glBindVertexArray(0);*/

    Shader shader("transition.vs", "transition.fs");
    shader.use();
    int dir = 1;
    Model ourModel("H:/jsProjects/RESUME/Playground/OpenGL/vs/Demo/resources/test/lowpoly_car/scene.gltf");

    // render loop
    // -----------
    while (!glfwWindowShouldClose(window))
    {
        // per-frame time logic
        float currentFrame = static_cast<float>(glfwGetTime());
        deltaTime = currentFrame - lastFrame;
        lastFrame = currentFrame;

        // input
        // -----
        processInput(window);

        glClearColor(0.1f, 0.1f, 0.1f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        ImGui_ImplGlfwGL3_NewFrame();

        float t = glfwGetTime();
        shader.setFloat("time", t);
        shader.setVec2("iResolution", glm::vec2(SCR_WIDTH, SCR_HEIGHT));
        // view/projection transformations
        glm::mat4 model = glm::mat4(1.0f);
        model = glm::rotate(model, glm::radians(45.0f), glm::vec3(0, 1, 0));
        //model = glm::scale(model, glm::vec3(4.0f, 4.0f, 4.0f));

        glm::mat4 view = camera.GetViewMatrix();
        glm::mat4 projection = glm::perspective(glm::radians(camera.Zoom), (float)SCR_WIDTH / (float)SCR_HEIGHT, 0.1f, 100.0f);
        shader.setMat4("model", model);
        shader.setMat4("projection", projection);

        shader.setVec3("fromColor", g_FromColor);
        shader.setVec3("toColor", g_ToColor);
        shader.setFloat("t", g_TransitionT);
        shader.setFloat("width", 0.1f); // 边缘柔和宽度

       /* glBindVertexArray(cubeVAO);
        glDrawArrays(GL_TRIANGLES, 0, 36);*/

        ourModel.Draw(shader);

        // 时间（只定义一次）
        t = glfwGetTime();

        // -------------------- 随机距离变化（柔和版） --------------------
        static float radius = 4.0f;          // 当前距离
        static float targetRadius = 4.0f;    // 目标距离
        static float radiusTimer = 0.0f;     // 计时器
        static float radiusVelocity = 0.0f;  // 用于平滑阻尼

        radiusTimer += deltaTime;

        if (radiusTimer > 3.0f + (rand() % 3000) / 1000.0f) {
            targetRadius = 10.0f + (rand() % 800) / 1000.0f; // 4.0 ~ 4.8
            radiusTimer = 0.0f;
        }

        // 平滑阻尼（类似 Unity 的 SmoothDamp）
        float smoothTime = 1.2f; // 越大越慢越柔和
        float omega = 2.0f / smoothTime;

        float x = omega * deltaTime;
        float exp = 1.0f / (1.0f + x + 0.48f * x * x + 0.235f * x * x * x);

        float change = radius - targetRadius;
        float temp = (radiusVelocity + omega * change) * deltaTime;

        radiusVelocity = (radiusVelocity - omega * temp) * exp;
        radius = targetRadius + (change + temp) * exp;


        // 1. 更新 yaw 和 pitch（先更新）
        static int dir = 1;  // 确保是 static，不要每帧重置

        yaw += deltaTime * 0.2f;

        // =======================
        //   Pitch SmoothDamp 方案
        // =======================

        // pitch 范围（你可以调）
        float pitchMin = glm::radians(5.0f);
        float pitchMax = glm::radians(30.0f);

        // static 状态变量
        static float targetPitch = glm::radians(20.0f); // 初始目标角度
        static float pitchVel = 0.0f;                   // SmoothDamp 速度
        static float pitchTimer = 0.0f;                 // 计时器

        pitchTimer += deltaTime;

        // 每 2~4 秒随机一个新的目标 pitch
        if (pitchTimer > 2.0f + (rand() % 2000) / 1000.0f) {
            float r = (rand() % 1000) / 1000.0f; // 0~1
            targetPitch = pitchMin + r * (pitchMax - pitchMin);
            pitchTimer = 0.0f;
        }

        // SmoothDamp（Unity 同款）
        float smoothTimePitch = 1.0f; // 越大越慢越柔和
        float omegaP = 2.0f / smoothTimePitch;

        float xP = omegaP * deltaTime;
        float expP = 1.0f / (1.0f + xP + 0.48f * xP * xP + 0.235f * xP * xP * xP);

        float changeP = pitch - targetPitch;
        float tempP = (pitchVel + omegaP * changeP) * deltaTime;

        pitchVel = (pitchVel - omegaP * tempP) * expP;
        pitch = targetPitch + (changeP + tempP) * expP;

        // 最终安全限制（不会参与节奏）
        pitch = glm::clamp(pitch, pitchMin, pitchMax);


        std::cout << "pitch = " << glm::degrees(pitch) << std::endl;


        // 2. 计算汽车中心点（带 Perlin 噪声）
        glm::vec3 noise(
            glm::perlin(glm::vec2(t * 0.3f, 0.0f)) * 0.03f,
            glm::perlin(glm::vec2(t * 0.4f, 10.0f)) * 0.015f,
            glm::perlin(glm::vec2(t * 0.3f, 20.0f)) * 0.03f
        );

        glm::vec3 carPosition =
            glm::vec3(model * glm::vec4(0, 0, 0, 1)) + noise;

        glm::vec3 target = carPosition;


        // 3. 用更新后的 yaw/pitch 计算摄像机位置
        glm::vec3 cameraPos;
        cameraPos.x = target.x + radius * cos(pitch) * sin(yaw);
        cameraPos.y = target.y + radius * sin(pitch);
        cameraPos.z = target.z + radius * cos(pitch) * cos(yaw);


        // 5. 最终视图矩阵
        view = glm::lookAt(cameraPos, target, glm::vec3(0, 1, 0));
        shader.setMat4("view", view);


        // imgui
        ImGui::Begin("Controls");

        // ImGui 面板
        ImGui::ColorEdit3("Color", glm::value_ptr(g_ImGuiColor));

        if (ImGui::Button("Apply Color"))
        {
            g_FromColor = g_CurrentColor;  // 冻结当前颜色
            g_ToColor = g_ImGuiColor;    // 这次要变到的颜色
            g_TransitionT = 0.0f;          // 从 0 开始
            g_InTransition = true;
        }

        // 每帧更新过渡进度
        if (g_InTransition)
        {
            // 比如 1 秒完成：speed = 1.0f
            float speed = 0.4f;
            g_TransitionT += deltaTime * speed;

            if (g_TransitionT >= 1.0f)
            {
                g_TransitionT = 1.001f;
                g_InTransition = false;
                g_CurrentColor = g_ToColor;  // 过渡完成后，真正颜色更新
            }
        }

        ImGui::End();
        ImGui::Render();
        ImGui_ImplGlfwGL3_RenderDrawData(ImGui::GetDrawData());

        // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
        // -------------------------------------------------------------------------------
        glfwSwapBuffers(window);
        glfwPollEvents();
    }

    // glfw: terminate, clearing all previously allocated GLFW resources.
    // ------------------------------------------------------------------
    glfwTerminate();
    return 0;
}

// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
void processInput(GLFWwindow* window)
{
    if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
        glfwSetWindowShouldClose(window, true);
    if (glfwGetKey(window, GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(FORWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(BACKWARD, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(LEFT, deltaTime);
    if (glfwGetKey(window, GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(RIGHT, deltaTime);
}

// glfw: whenever the window size changed (by OS or user resize) this callback function executes
// ---------------------------------------------------------------------------------------------
void framebuffer_size_callback(GLFWwindow* window, int width, int height)
{
    // make sure the viewport matches the new window dimensions; note that width and 
    // height will be significantly larger than specified on retina displays.
    glViewport(0, 0, width, height);
}

// glfw: whenever the mouse moves, this callback is called
// -------------------------------------------------------
void mouse_callback(GLFWwindow* window, double xposIn, double yposIn)
{
    float xpos = static_cast<float>(xposIn);
    float ypos = static_cast<float>(yposIn);

    if (firstMouse)
    {
        lastX = xpos;
        lastY = ypos;
        firstMouse = false;
    }

    float xoffset = xpos - lastX;
    float yoffset = lastY - ypos; // reversed since y-coordinates go from bottom to top

    lastX = xpos;
    lastY = ypos;

    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_RIGHT) == GLFW_PRESS) {
        glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_DISABLED);
        camera.ProcessMouseMovement(xoffset, yoffset);
    }
    else {
        glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_NORMAL);
    }
}

// glfw: whenever the mouse scroll wheel scrolls, this callback is called
// ----------------------------------------------------------------------
void scroll_callback(GLFWwindow* window, double xoffset, double yoffset)
{
    if (glfwGetMouseButton(window, GLFW_MOUSE_BUTTON_RIGHT) == GLFW_PRESS) {
        camera.ProcessMouseScroll(static_cast<float>(yoffset));
    }
}