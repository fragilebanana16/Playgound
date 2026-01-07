#version 330 core
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_specular1;

uniform vec3 lightPos;       // 点光源
uniform vec3 viewPos;
uniform vec3 lightColor;

// 平行光
uniform vec3 dirLightDirection;
uniform vec3 dirLightColor;

void main()
{
    vec3 diffuseColor = texture(texture_diffuse1, TexCoords).rgb;
    float specularStrength = texture(texture_specular1, TexCoords).r;

    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);

    // 点光源衰减
    float distance    = length(lightPos - FragPos);
    float attenuation = 1.0 / (1.0 + 0.09 * distance + 0.032 * distance * distance);

    // 环境光
    vec3 ambient = 0.1 * diffuseColor;

    // 点光源漫反射
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * diffuseColor;

    // 点光源高光
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);
    vec3 specular = specularStrength * spec * lightColor;

    // 应用衰减
    ambient  *= attenuation;
    diffuse  *= attenuation;
    specular *= attenuation;

    // -------------------------
    // 平行光（Directional Light）
    // -------------------------
    vec3 dirLightDir = normalize(-dirLightDirection);

    // 漫反射
    float diffDir = max(dot(norm, dirLightDir), 0.0);
    vec3 diffuseDir = diffDir * diffuseColor * dirLightColor;

    // 高光
    vec3 reflectDirDir = reflect(-dirLightDir, norm);
    float specDir = pow(max(dot(viewDir, reflectDirDir), 0.0), 32.0);
    vec3 specularDir = specularStrength * specDir * dirLightColor;

    // 最终颜色
    vec3 result = ambient + diffuse + specular
                + diffuseDir;

    FragColor = vec4(result, 1.0);
}
