#version 330 core
out vec4 FragColor;

in vec2 TexCoords;
in vec3 ourColor;
uniform sampler2D texture1;
uniform bool useTexture;
void main()
{    
    if(useTexture) {
        vec4 texColor = texture(texture1, TexCoords);
        if(texColor.a < 0.1)
            discard;
        FragColor = texColor;
    } else {
        FragColor = vec4(ourColor, 1.0);
    }
}