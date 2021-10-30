#version 300 es
precision highp float;

in vec4 fs_Col;
in vec4 fs_Pos;
in vec4 fs_Nor;

out vec4 out_Col;

void main()
{
    // float dist = 1.0 - (length(fs_Pos.xyz) * 2.0);
    // out_Col = vec4(dist) * fs_Col;

    vec3 lightPos = vec3(10.f, 10.f, 30.f);
    float diffuseTerm = dot(normalize(fs_Nor.xyz), normalize(lightPos - fs_Pos.xyz));
    diffuseTerm = clamp(diffuseTerm, 0.f, 1.f);
    float ambientTerm = 0.2;
    float lightIntensity = diffuseTerm + ambientTerm;
    vec3 col = fs_Col.rgb;


    out_Col = vec4(col * lightIntensity, fs_Col[3]);
}
