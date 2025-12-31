#version 330 core
out vec4 FragColor;

in VS_OUT {
    vec3 FragPos;
    vec3 Normal;
    vec2 TexCoords;
	vec3 TangentLightPos;
    vec3 TangentViewPos;
    vec3 TangentFragPos;
} fs_in;

uniform float time;
uniform vec3 viewPos;
uniform float far_plane;
uniform bool useNormalMap;
uniform bool useTBN;

struct Material {
    sampler2D diffuse;
    sampler2D specular; 
	sampler2D emission;
	sampler2D normalMap;
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

uniform samplerCube depthMap;
uniform Material material;
uniform Light light;

float ShadowCalculation(vec3 fragPos)
{
    // get vector between fragment position and light position
    vec3 fragToLight = fragPos - light.position;
    // ise the fragment to light vector to sample from the depth map    
    float closestDepth = texture(depthMap, fragToLight).r;
    // it is currently in linear range between [0,1], let's re-transform it back to original depth value
    closestDepth *= far_plane;
    // now get current linear depth as the length between the fragment and light position
    float currentDepth = length(fragToLight);
    // test for shadows
    float bias = 0.05; // we use a much larger bias since depth is now in [near_plane, far_plane] range
    float shadow = currentDepth -  bias > closestDepth ? 1.0 : 0.0;        
    // display closestDepth as debug (to visualize depth cubemap)
    // FragColor = vec4(vec3(closestDepth / far_plane), 1.0);    
        
    return shadow;
}

void main()
{
    vec3 colorD = texture(material.diffuse, fs_in.TexCoords).rgb;
    vec3 colorS = texture(material.specular, fs_in.TexCoords).rgb;
    vec3 colorE = texture(material.emission, fs_in.TexCoords).rgb;
	vec3 normal;
	vec3 tempViewPos = viewPos;
    vec3 tempLightPosition = light.position;
    vec3 tempFragPos = fs_in.FragPos;
	if(useNormalMap){
		if(useTBN){
			tempViewPos = fs_in.TangentLightPos;
			tempLightPosition = fs_in.TangentViewPos;
			tempFragPos = fs_in.TangentFragPos;
		}
		 // obtain normal from normal map in range [0,1]
		normal = texture(material.normalMap, fs_in.TexCoords).rgb;
		// transform normal vector to range [-1,1]
		normal = normalize(normal * 2.0 - 1.0);  // this normal is in tangent space
	} else {
	    normal = fs_in.Normal;
	}
	
    // ambient
    vec3 ambient = light.ambient * colorD;
  	
    // diffuse 
    vec3 lightDir = normalize(tempLightPosition - tempFragPos);
    vec3 norm = normalize(normal);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * colorD;
	
    // specular
	vec3 specular;
	vec3 viewDir = normalize(tempViewPos - tempFragPos);
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
	float distance    = length(tempLightPosition - tempFragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
	float theta     = dot(lightDir, normalize(-light.direction));
	float epsilon   = light.cutOff - light.outerCutOff;
	float intensity = clamp((theta - light.outerCutOff) / epsilon, 0.0, 1.0);
	intensity = 1.0;
	if(light.enableAttenuation){
		ambient  *= attenuation * intensity; 
		diffuse  *= attenuation * intensity;
		specular *= attenuation * intensity;
		emission *= attenuation * intensity;
	}
    
	float shadow = ShadowCalculation(tempFragPos);   
	vec3 result = ambient + (1.0 - shadow) * (diffuse + specular); 
	
    FragColor = vec4(result, 1.0);
}