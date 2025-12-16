#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

uniform float time;
uniform vec3 viewPos;

struct Material {
    sampler2D diffuse;
    sampler2D specular; 
	sampler2D emission;
    float shininess;
}; 
in vec2 TexCoords;

struct Light {
    vec3 position;
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	vec3 emission;
	
	float constant;
    float linear;
    float quadratic;
};

uniform Material material;
uniform Light light;



void main()
{
    // ambient
    vec3 ambient = light.ambient * texture(material.diffuse, TexCoords).rgb;
  	
    // diffuse 
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;
	
    // specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);  
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec4 specTexture = texture(material.specular, TexCoords);
    vec3 specular = light.specular * spec * vec3(texture(material.specular, TexCoords));
	
	bool isNotBoxFrame = specTexture.r == 0.0 && specTexture.g == 0.0 && specTexture.b == 0.0;
	
	// emission
	float border = 0.08;
	vec2 animCoords =  TexCoords * (1.0 - 2.0 * border) + vec2(border, border) + vec2(0.0, time * 0.1);
	animCoords.y = border + fract(animCoords.y - border) * (1.0 - 2.0 * border);

	vec3 emission = vec3(0.0); // 默认没有发光
	// 判断是否为纯黑
	if (isNotBoxFrame) {
		emission = light.emission * texture(material.emission, animCoords).rgb;
	}
	
	// attenuation
	float distance    = length(light.position - FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + 
                light.quadratic * (distance * distance));
	ambient  *= attenuation; 
	diffuse  *= attenuation;
	specular *= attenuation;			
	
    vec3 result = ambient + diffuse + specular + emission;
    FragColor = vec4(result, 1.0);
}