#ifndef MODEL_H
#define MODEL_H

#include <glad/glad.h> 

#include <glm/glm.hpp>
#include <glm/gtc/matrix_transform.hpp>
#include <stb_image.h>
#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>
#include <learnopengl/mesh.h>
#include <learnopengl/shader.h>

#include <string>
#include <fstream>
#include <sstream>
#include <iostream>
#include <map>
#include <vector>
using namespace std;

unsigned int TextureFromFile(const char *path, const string &directory, bool gamma = false);

class Model 
{
public:
    // model data 
    vector<MaterialProperty> material_loaded;	// stores all the textures loaded so far, optimization to make sure textures aren't loaded more than once.
    vector<Mesh>    meshes;
    string directory;
    bool gammaCorrection;

    // constructor, expects a filepath to a 3D model.
    Model(string const &path, bool gamma = false) : gammaCorrection(gamma)
    {
        loadModel(path);
    }

    // draws the model, and thus all its meshes
    void Draw(Shader &shader, bool ignoreTexture = false)
    {
        for(unsigned int i = 0; i < meshes.size(); i++)
            meshes[i].Draw(shader);
    }
    
private:
    // loads a model with supported ASSIMP extensions from file and stores the resulting meshes in the meshes vector.
    void loadModel(string const &path)
    {
        // read file via ASSIMP
        Assimp::Importer importer;
        const aiScene* scene = importer.ReadFile(path, aiProcess_Triangulate | aiProcess_GenSmoothNormals | aiProcess_FlipUVs | aiProcess_CalcTangentSpace);
        // check for errors
        if(!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode) // if is Not Zero
        {
            cout << "ERROR::ASSIMP:: " << importer.GetErrorString() << endl;
            return;
        }
        // retrieve the directory path of the filepath
        directory = path.substr(0, path.find_last_of('/'));

        // process ASSIMP's root node recursively
        processNode(scene->mRootNode, scene);
    }

    // processes a node in a recursive fashion. Processes each individual mesh located at the node and repeats this process on its children nodes (if any).
    void processNode(aiNode *node, const aiScene *scene)
    {
        // process each mesh located at the current node
        for(unsigned int i = 0; i < node->mNumMeshes; i++)
        {
            // the node object only contains indices to index the actual objects in the scene. 
            // the scene contains all the data, node is just to keep stuff organized (like relations between nodes).
            aiMesh* mesh = scene->mMeshes[node->mMeshes[i]];
            meshes.push_back(processMesh(mesh, scene));
        }
        // after we've processed all of the meshes (if any) we then recursively process each of the children nodes
        for(unsigned int i = 0; i < node->mNumChildren; i++)
        {
            processNode(node->mChildren[i], scene);
        }

    }

    Mesh processMesh(aiMesh *mesh, const aiScene *scene)
    {
        // data to fill
        vector<Vertex> vertices;
        vector<unsigned int> indices;
        vector<MaterialProperty> textures;

        // walk through each of the mesh's vertices
        for(unsigned int i = 0; i < mesh->mNumVertices; i++)
        {
            Vertex vertex;
            glm::vec3 vector; // we declare a placeholder vector since assimp uses its own vector class that doesn't directly convert to glm's vec3 class so we transfer the data to this placeholder glm::vec3 first.
            // positions
            vector.x = mesh->mVertices[i].x;
            vector.y = mesh->mVertices[i].y;
            vector.z = mesh->mVertices[i].z;
            vertex.Position = vector;
            // normals
            if (mesh->HasNormals())
            {
                vector.x = mesh->mNormals[i].x;
                vector.y = mesh->mNormals[i].y;
                vector.z = mesh->mNormals[i].z;
                vertex.Normal = vector;
            }
            // texture coordinates
            if(mesh->mTextureCoords[0]) // does the mesh contain texture coordinates?
            {
                glm::vec2 vec;
                // a vertex can contain up to 8 different texture coordinates. We thus make the assumption that we won't 
                // use models where a vertex can have multiple texture coordinates so we always take the first set (0).
                vec.x = mesh->mTextureCoords[0][i].x; 
                vec.y = mesh->mTextureCoords[0][i].y;
                vertex.TexCoords = vec;
                // tangent
                vector.x = mesh->mTangents[i].x;
                vector.y = mesh->mTangents[i].y;
                vector.z = mesh->mTangents[i].z;
                vertex.Tangent = vector;
                // bitangent
                vector.x = mesh->mBitangents[i].x;
                vector.y = mesh->mBitangents[i].y;
                vector.z = mesh->mBitangents[i].z;
                vertex.Bitangent = vector;
            }
            else
                vertex.TexCoords = glm::vec2(0.0f, 0.0f);

            vertices.push_back(vertex);
        }
        // now wak through each of the mesh's faces (a face is a mesh its triangle) and retrieve the corresponding vertex indices.
        for(unsigned int i = 0; i < mesh->mNumFaces; i++)
        {
            aiFace face = mesh->mFaces[i];
            // retrieve all indices of the face and store them in the indices vector
            for(unsigned int j = 0; j < face.mNumIndices; j++)
                indices.push_back(face.mIndices[j]);        
        }

        Material material; 
        if (mesh->mMaterialIndex >= 0) {
            aiMaterial* aiMat = scene->mMaterials[mesh->mMaterialIndex]; 
            loadMaterialTextures(aiMat, aiTextureType_DIFFUSE,            "albedoMap", material); 
            loadMaterialTextures(aiMat, aiTextureType_NORMALS,            "normalMap", material);  // blender指向同一个
            loadMaterialTextures(aiMat, aiTextureType_DIFFUSE_ROUGHNESS,  "metallicRoughnessMap", material); 
            loadMaterialTextures(aiMat, aiTextureType_LIGHTMAP,           "aoMap", material);
            loadMaterialConstants(aiMat, material); // 新增：常量值 
        }

        // return a mesh object created from the extracted mesh data
        return Mesh(vertices, indices, material);
    }

    // checks all material textures of a given type and loads the textures if they're not loaded yet.
    // the required info is returned as a Texture struct.
    void loadMaterialTextures(aiMaterial* mat, aiTextureType type, const std::string& baseName, Material& material)
    {
        for(unsigned int i = 0; i < mat->GetTextureCount(type); i++)
        {
            aiString str;
            mat->GetTexture(type, i, &str);
            // check if texture was loaded before and if so, continue to next iteration: skip loading a new texture
            bool skip = false;
            for(unsigned int j = 0; j < material_loaded.size(); j++)
            {
                if(std::strcmp(material_loaded[j].path.data(), str.C_Str()) == 0)
                {
                    material.properties.push_back(material_loaded[j]);
                    skip = true; // a texture with the same filepath has already been loaded, continue to next one. (optimization)
                    break;
                }
            }
            if(!skip)
            {   // if texture hasn't been loaded already, load it
                MaterialProperty prop{};
                prop.isTexture = true; 
                prop.id = TextureFromFile(str.C_Str(), this->directory); 
                prop.type = baseName;
                prop.path = str.C_Str(); 
                material.properties.push_back(prop);
            }
        }
    }

    void pushVec4(Material& material, const std::string& name, const aiColor4D& c) {
        MaterialProperty p{};
        p.isTexture = false; p.isVec4 = true; p.name = name;
        p.vec4 = glm::vec4(c.r, c.g, c.b, c.a);
        material.properties.push_back(p);
    }
    void pushFloat(Material& material, const std::string& name, float v) {
        MaterialProperty p{};
        p.isTexture = false; p.isVec4 = false; p.name = name;
        p.scalar = v;
        material.properties.push_back(p);
    }

    void loadMaterialConstants(aiMaterial* mat, Material& material) {
        // 传统槽位（兼容非PBR）
        aiColor4D c;
        if (AI_SUCCESS == mat->Get(AI_MATKEY_COLOR_DIFFUSE, c))   pushVec4(material, "diffuseColor", c);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_COLOR_SPECULAR, c))  pushVec4(material, "specularColor", c);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_COLOR_EMISSIVE, c))  pushVec4(material, "emissiveColor", c);

        float f;
        if (AI_SUCCESS == mat->Get(AI_MATKEY_OPACITY, f))         pushFloat(material, "opacity", f);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_SHININESS, f))       pushFloat(material, "shininess", f);

        // PBR 扩展（GLTF/FBX 映射时常见）
        // 注意：不同格式/导出器键名可能差异，以下是常见键位
        if (AI_SUCCESS == mat->Get(AI_MATKEY_BASE_COLOR, c))      pushVec4(material, "baseColor", c);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_METALLIC_FACTOR, f)) pushFloat(material, "metallicFactor", f);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_ROUGHNESS_FACTOR, f))pushFloat(material, "roughnessFactor", f);

        // 可选：清漆/透射等（若导出器写入）
        if (AI_SUCCESS == mat->Get(AI_MATKEY_CLEARCOAT_FACTOR, f))    pushFloat(material, "clearcoat", f);
        if (AI_SUCCESS == mat->Get(AI_MATKEY_TRANSMISSION_FACTOR, f)) pushFloat(material, "transmission", f);
    }
};


unsigned int TextureFromFile(const char *path, const string &directory, bool gamma)
{
    string filename = string(path);
    filename = directory + '/' + filename;

    unsigned int textureID;
    glGenTextures(1, &textureID);

    int width, height, nrComponents;
    unsigned char *data = stbi_load(filename.c_str(), &width, &height, &nrComponents, 0);
    if (data)
    {
        GLenum format;
        if (nrComponents == 1)
            format = GL_RED;
        else if (nrComponents == 3)
            format = GL_RGB;
        else if (nrComponents == 4)
            format = GL_RGBA;

        glBindTexture(GL_TEXTURE_2D, textureID);
        glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
        glGenerateMipmap(GL_TEXTURE_2D);

        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

        stbi_image_free(data);
    }
    else
    {
        std::cout << "Texture failed to load at path: " << path << std::endl;
        stbi_image_free(data);
    }

    return textureID;
}
#endif