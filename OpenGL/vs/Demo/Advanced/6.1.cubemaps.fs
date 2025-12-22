#version 330 core
out vec4 FragColor;

in vec3 Normal;
in vec3 Position;
in vec2 TexCoords;

uniform vec3 cameraPos;
uniform samplerCube skybox;
uniform sampler2D texture1;
uniform float reflectStrength;

void main()
{             
    vec3 baseColor = texture(texture1, TexCoords).rgb;

    vec3 I = normalize(Position - cameraPos);
    vec3 R = reflect(I, normalize(Normal));
	vec3 reflectColor = texture(skybox, R).rgb;
	
    vec3 finalColor = mix(baseColor, reflectColor, reflectStrength); 
	FragColor = vec4(finalColor.rgb, 1.0);
}