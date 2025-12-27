#version 330 core
out vec4 FragColor;

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoords;
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
};

uniform Material material;
uniform Light light;

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
    vec3 viewDir = normalize(viewPos - fs_in.FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
    vec3 specular = light.specular * spec * colorS;
	
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
    
    vec3 result = ambient + diffuse + specular + emission;
    FragColor = vec4(result, 1.0);
}