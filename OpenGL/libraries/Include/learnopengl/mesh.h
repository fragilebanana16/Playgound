#ifndef MESH_H
#define MESH_H

#include <glad/glad.h> // holds all OpenGL type declarations

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>

#include <learnopengl/shader.h>

#include <string>
#include <vector>
#include <unordered_map>
using namespace std;

#define MAX_BONE_INFLUENCE 4
static std::unordered_map<std::string, int> textureUnitMap = {
    {"albedoMap", 3},
    {"normalMap", 4},
    {"metallicRoughnessMap", 5},
    {"aoMap", 6}
};


struct MaterialProperty {
    bool isTexture; // true: 纹理, false: 常量 
    string type;
    unsigned int id; // 纹理ID (仅纹理) 
    std::string name; // uniform 名称 (如 "baseColor", "roughness", "diffuse1") 
    std::string path; // 纹理路径 (仅纹理) 
    glm::vec4 vec4; // 常量向量 (颜色等) 
    float scalar; // 常量标量 (粗糙度、金属度等) 
    bool isVec4; // true: vec4, false: float 
};

struct Material {
    std::vector<MaterialProperty> properties; // diffuse, specular, normal, roughness, metallic, ao
};

struct Vertex {
    // position
    glm::vec3 Position;
    // normal
    glm::vec3 Normal;
    // texCoords
    glm::vec2 TexCoords;
    // tangent
    glm::vec3 Tangent;
    // bitangent
    glm::vec3 Bitangent;
	//bone indexes which will influence this vertex
	int m_BoneIDs[MAX_BONE_INFLUENCE];
	//weights from each bone
	float m_Weights[MAX_BONE_INFLUENCE];
};

struct Texture {
    unsigned int id;
    string type;
    string path;
};

class Mesh {
public:
    // mesh Data
    vector<Vertex>       vertices;
    vector<unsigned int> indices;
    Material material;
    unsigned int VAO;

    // constructor
    Mesh(vector<Vertex> vertices, vector<unsigned int> indices, Material material)
    {
        this->vertices = vertices;
        this->indices = indices;
        this->material = material;

        // now that we have all the required data, set the vertex buffers and its attribute pointers.
        setupMesh();
    }

    void Draw(Shader& shader) {
        for (auto& p : material.properties) {
            if (p.isTexture) {
                auto it = textureUnitMap.find(p.type);
                if (it != textureUnitMap.end()) {
                    int unit = it->second;
                    glActiveTexture(GL_TEXTURE0 + unit);
                    glBindTexture(GL_TEXTURE_2D, p.id);
                    shader.setInt(p.type, GL_TEXTURE0 + unit);   // sampler uniform
                    shader.setBool("has_" + p.type, true);
                }
            }
            else {
                shader.setBool("has_" + p.type, false);
                if (p.isVec4) 
                    shader.setVec4(p.name, p.vec4);
                else          
                    shader.setFloat(p.name, p.scalar);
            }
        }

        glBindVertexArray(VAO);
        glDrawElements(GL_TRIANGLES, indices.size(), GL_UNSIGNED_INT, 0);
        glBindVertexArray(0);
    }

private:
    // render data 
    unsigned int VBO, EBO;

    // initializes all the buffer objects/arrays
    void setupMesh()
    {
        // create buffers/arrays
        glGenVertexArrays(1, &VAO);
        glGenBuffers(1, &VBO);
        glGenBuffers(1, &EBO);

        glBindVertexArray(VAO);
        // load data into vertex buffers
        glBindBuffer(GL_ARRAY_BUFFER, VBO);
        // A great thing about structs is that their memory layout is sequential for all its items.
        // The effect is that we can simply pass a pointer to the struct and it translates perfectly to a glm::vec3/2 array which
        // again translates to 3/2 floats which translates to a byte array.
        glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);  

        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
        glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

        // set the vertex attribute pointers
        // vertex Positions
        glEnableVertexAttribArray(0);	
        glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
        // vertex normals
        glEnableVertexAttribArray(1);	
        glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal));
        // vertex texture coords
        glEnableVertexAttribArray(2);	
        glVertexAttribPointer(2, 2, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, TexCoords));
        // vertex tangent
        glEnableVertexAttribArray(3);
        glVertexAttribPointer(3, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Tangent));
        // vertex bitangent
        glEnableVertexAttribArray(4);
        glVertexAttribPointer(4, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Bitangent));
		// ids
		glEnableVertexAttribArray(5);
		glVertexAttribIPointer(5, 4, GL_INT, sizeof(Vertex), (void*)offsetof(Vertex, m_BoneIDs));

		// weights
		glEnableVertexAttribArray(6);
		glVertexAttribPointer(6, 4, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, m_Weights));
        glBindVertexArray(0);
    }
};
#endif