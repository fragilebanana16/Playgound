#version 330 core
out vec4 FragColor;
in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;

struct Light {
    vec3 Position;
    vec3 Color;
    
    float Linear;
    float Quadratic;
	float LightIntensity;
};
const int NR_LIGHTS = 32;
uniform Light lights[NR_LIGHTS];
uniform vec3 viewPos;

void main()
{
    vec2 uv = TexCoords;

    // 左侧 25% 区域
    if (uv.x < 0.25)
    {
        float row = uv.y * 4.0;   // 0~4

        // 第一行：gPosition
        if (row > 3.0) {
            vec2 localUV = vec2(uv.x / 0.25, (row - 3.0));
            vec3 pos = texture(gPosition, localUV).rgb;
            FragColor = vec4(pos / 10.0, 1.0);
            return;
        }

        // 第二行：gNormal
        if (row > 2.0) {
            vec2 localUV = vec2(uv.x / 0.25, (row - 2.0));
            vec3 normal = texture(gNormal, localUV).rgb;
            FragColor = vec4(normal * 0.5 + 0.5, 1.0);
            return;
        }

        // 第三行：Albedo
        if (row > 1.0) {
            vec2 localUV = vec2(uv.x / 0.25, (row - 1.0));
            vec3 albedo = texture(gAlbedoSpec, localUV).rgb;
            FragColor = vec4(albedo, 1.0);
            return;
        }

        // 第四行：Specular
        {
            vec2 localUV = vec2(uv.x / 0.25, row);
            float spec = texture(gAlbedoSpec, localUV).a;
            FragColor = vec4(vec3(spec), 1.0);
            return;
        }
    }

    // 右侧大区域
    // 这里先显示 Albedo 作为示例
    // retrieve data from gbuffer
    vec3 FragPos = texture(gPosition, uv).rgb;
    vec3 Normal = texture(gNormal, uv).rgb;
    vec3 Diffuse = texture(gAlbedoSpec, uv).rgb;
    float Specular = texture(gAlbedoSpec, uv).a;
    
    // then calculate lighting as usual
    vec3 lighting  = Diffuse * 0.1; // hard-coded ambient component
    vec3 viewDir  = normalize(viewPos - FragPos);
    for(int i = 0; i < NR_LIGHTS; ++i)
    {
        // diffuse
        vec3 lightDir = normalize(lights[i].Position - FragPos);
        vec3 diffuse = max(dot(Normal, lightDir), 0.0) * Diffuse * lights[i].Color;
        // specular
        vec3 halfwayDir = normalize(lightDir + viewDir);  
        float spec = pow(max(dot(Normal, halfwayDir), 0.0), 16.0);
        vec3 specular = lights[i].Color * spec * Specular;
        // attenuation
        float distance = length(lights[i].Position - FragPos);
        float attenuation = 1.0 / (1.0 + lights[i].Linear * distance + lights[i].Quadratic * distance * distance);
        diffuse *= attenuation;
        specular *= attenuation;
        lighting += (diffuse + specular)  * lights[i].LightIntensity;        
    }
    FragColor = vec4(lighting, 1.0);
}
