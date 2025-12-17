#version 330 core
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_specular1;

in vec3 Normal;  
in vec3 FragPos;  
uniform vec3 viewPos;
uniform vec3 lightColor;
uniform float lightIntensity;

struct Light {
    vec3 position;  
    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
	float shininess;
	
    float constant;
    float linear;
    float quadratic;
};
uniform Light light;
void main()
{    
    vec4 texture = texture(texture_diffuse1, TexCoords);
    // ambient
    vec3 ambient = 0.1 * texture.rgb;

    // diffuse 
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lightColor * lightIntensity * texture.rgb;
  	
	float specularStrength = 0.5;
	vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, norm);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), light.shininess);
    vec3 specular = specularStrength * spec * lightColor;

	float distance    = length(light.position - FragPos);
	float attenuation = 1.0 / (light.constant + light.linear * distance + 
					light.quadratic * (distance * distance));
					
	vec3 result = (ambient + diffuse + specular) * attenuation;
    FragColor = vec4(result, texture.a);
}