#version 330 core
out vec4 FragColor;

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoords;
	vec4 FragPosLightSpace;
} fs_in;

uniform float time;
uniform vec3 viewPos;

struct Material {
    sampler2D diffuse;
    sampler2D specular; 
	sampler2D emission;
    float shininess;
}; 

struct Light {
    vec3 position;
	vec3 direction;
    float cutOff;
	float outerCutOff;
	
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	vec3 emission;
	
	float constant;
    float linear;
    float quadratic;
	
	bool enableAttenuation;
	bool useTextureS;
	bool blinn;
};

uniform sampler2D depthMap;
uniform Material material;
uniform Light light;

float ShadowCalculation(vec4 fragPosLightSpace)
{
    // 执行透视除法
    vec3 projCoords = fragPosLightSpace.xyz / fragPosLightSpace.w;
    // 变换到[0,1]的范围
    projCoords = projCoords * 0.5 + 0.5;
    // 取得最近点的深度(使用[0,1]范围下的fragPosLight当坐标)
    float closestDepth = texture(depthMap, projCoords.xy).r; 
    // 取得当前片段在光源视角下的深度
    float currentDepth = projCoords.z;
    // 检查当前片段是否在阴影中
    float shadow = currentDepth > closestDepth  ? 1.0 : 0.0;

    return shadow;
}

void main()
{
    vec3 colorD = texture(material.diffuse, fs_in.TexCoords).rgb;
    vec3 colorS = texture(material.specular, fs_in.TexCoords).rgb;
    vec3 colorE = texture(material.emission, fs_in.TexCoords).rgb;

    // ambient
    vec3 ambient = light.ambient * colorD;
  	
    // diffuse 
    vec3 lightDir = normalize(light.position - fs_in.FragPos);
    vec3 norm = normalize(fs_in.Normal);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * colorD;
	
    // specular
	vec3 specular;
	vec3 viewDir = normalize(viewPos - fs_in.FragPos);
	vec3 reflectDir = reflect(-lightDir, norm);  
	if(light.useTextureS){
		float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
		specular = light.specular * spec * colorS;
	} else {
		if(light.blinn)
		{
			vec3 halfwayDir = normalize(lightDir + viewDir);  
			specular = vec3(0.3) * pow(max(dot(norm, halfwayDir), 0.0), material.shininess);
		}
		else
		{
			vec3 reflectDir = reflect(-lightDir, norm);
			specular = vec3(0.3) * pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
		}

	}
	
	// emission
	float border = 0.08;
	vec2 animCoords =  fs_in.TexCoords * (1.0 - 2.0 * border) + vec2(border, border) + vec2(0.0, time * 0.1);
	animCoords.y = border + fract(animCoords.y - border) * (1.0 - 2.0 * border);

	vec3 emission = vec3(0.0); // 默认没有发光
	
	// 判断是否为纯黑
	bool isNotBoxFrame = colorS.r == 0.0 && colorS.g == 0.0 && colorS.b == 0.0;
	if (isNotBoxFrame) {
		emission = light.emission * colorE;
	}
	
	// attenuation
	float distance    = length(light.position - fs_in.FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
	float theta     = dot(lightDir, normalize(-light.direction));
	float epsilon   = light.cutOff - light.outerCutOff;
	float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
	
	if(light.enableAttenuation){
		ambient  *= attenuation * intensity; 
		diffuse  *= attenuation * intensity;
		specular *= attenuation * intensity;
		emission *= attenuation * intensity;
	}
    
	float shadow = ShadowCalculation(fs_in.FragPosLightSpace);   
	vec3 result = ambient + (1.0 - shadow) * (diffuse + specular); 
	
    FragColor = vec4(result, 1.0);
}