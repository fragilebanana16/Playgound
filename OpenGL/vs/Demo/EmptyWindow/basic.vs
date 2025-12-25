#version 330 core
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;
layout (location = 3) in vec3 aColors;
layout (location = 4) in vec3 aOffset;

out vec3 FragPos;
out vec3 Normal;
out vec2 TexCoords;

out VS_OUT {
    vec3 color;
    vec3 normal;
    vec3 posView;
} vs_out;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;
uniform vec3 offsets[125];
void main()
{
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = mat3(transpose(inverse(model))) * aNormal;
    TexCoords = aTexCoords;    
	vs_out.color = aColors;
	
	// 法线转到观察空间
	mat3 normalMatrix = transpose(inverse(mat3(view * model)));
    vec3 normalVS = normalize(normalMatrix * aNormal);
	vs_out.normal = normalVS;
	
	// vec3 offset = offsets[gl_InstanceID];
	vec4 posView = view * model * vec4(aPos + aOffset, 1.0);
	
	gl_Position = projection * posView; // 给管线用
	vs_out.posView = posView.xyz;       // 给 GS/FS 用
}