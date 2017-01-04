#ifdef ENABLE_DEFERRED
    #extension OES_texture_float_linear : enable
#endif

#ifdef COMPILING_VS
attribute vec4 a_position;
varying vec2 v_texcoord;

void main() {
      gl_Position = a_position;
      v_texcoord = a_position.xy * 0.5 + 0.5;
}
#endif //COMPILING_VS

#ifdef COMPILING_FS


precision mediump float;
varying vec2 v_texcoord;
uniform sampler2D u_sampler;
uniform sampler2D u_depth;

uniform float gauss_offsets[5];
uniform float gauss_weights[5];

uniform vec2 uResolution;

void main() {
   /*
    vec4 fragmentColor = texture2D(u_sampler, v_texcoord);
    float sourceDepth = texture2D(u_depth, v_texcoord).x;
    vec4 final = (fragmentColor * gauss_weights[0]);
    for (int i = 1; i < 5; i++) {

        float sampleDepth = texture2D(u_depth, (v_texcoord + vec2(0.0, gauss_offsets[i]))).x;
        float filterDepth = (((sourceDepth - sampleDepth) > 0.0700000003) ? 1.0 : 0.0);
        //float filterDepth = 1.0;
        vec4 t = vec4(filterDepth);
        final = (final + (gauss_weights[i] * mix(texture2D(u_sampler, (v_texcoord + vec2(0.0, gauss_offsets[i]))), fragmentColor, t)));
    }

    final.a = 1.0;
    gl_FragColor = final;   */
    //gl_FragColor = vec4(texture2D(u_sampler, v_texcoord).rgb, 0);
    //gl_FragColor = apply(u_sampler, v_texcoord, uResolution);
    float FXAA_SPAN_MAX = 8.0;
    float FXAA_REDUCE_MUL = 1.0/8.0;
    float FXAA_REDUCE_MIN = 1.0/128.0;

    vec3 rgbNW=texture2D(u_sampler,v_texcoord+(vec2(-1.0,-1.0)/uResolution)).xyz;
    vec3 rgbNE=texture2D(u_sampler,v_texcoord+(vec2(1.0,-1.0)/uResolution)).xyz;
    vec3 rgbSW=texture2D(u_sampler,v_texcoord+(vec2(-1.0,1.0)/uResolution)).xyz;
    vec3 rgbSE=texture2D(u_sampler,v_texcoord+(vec2(1.0,1.0)/uResolution)).xyz;
    vec3 rgbM=texture2D(u_sampler,v_texcoord).xyz;

    vec3 luma=vec3(0.299, 0.587, 0.114);
    float lumaNW = dot(rgbNW, luma);
    float lumaNE = dot(rgbNE, luma);
    float lumaSW = dot(rgbSW, luma);
    float lumaSE = dot(rgbSE, luma);
    float lumaM  = dot(rgbM,  luma);

    float lumaMin = min(lumaM, min(min(lumaNW, lumaNE), min(lumaSW, lumaSE)));
    float lumaMax = max(lumaM, max(max(lumaNW, lumaNE), max(lumaSW, lumaSE)));

    vec2 dir;
    dir.x = -((lumaNW + lumaNE) - (lumaSW + lumaSE));
    dir.y =  ((lumaNW + lumaSW) - (lumaNE + lumaSE));

    float dirReduce = max(
        (lumaNW + lumaNE + lumaSW + lumaSE) * (0.25 * FXAA_REDUCE_MUL),
        FXAA_REDUCE_MIN);

    float rcpDirMin = 1.0/(min(abs(dir.x), abs(dir.y)) + dirReduce);

    dir = min(vec2( FXAA_SPAN_MAX,  FXAA_SPAN_MAX),
          max(vec2(-FXAA_SPAN_MAX, -FXAA_SPAN_MAX),
          dir * rcpDirMin)) / uResolution;

    vec3 rgbA = (1.0/2.0) * (
        texture2D(u_sampler, v_texcoord.xy + dir * (1.0/3.0 - 0.5)).xyz +
        texture2D(u_sampler, v_texcoord.xy + dir * (2.0/3.0 - 0.5)).xyz);
    vec3 rgbB = rgbA * (1.0/2.0) + (1.0/4.0) * (
        texture2D(u_sampler, v_texcoord.xy + dir * (0.0/3.0 - 0.5)).xyz +
        texture2D(u_sampler, v_texcoord.xy + dir * (3.0/3.0 - 0.5)).xyz);
    float lumaB = dot(rgbB, luma);

    if((lumaB < lumaMin) || (lumaB > lumaMax)){
        gl_FragColor.xyz=rgbA;
    }else{
        gl_FragColor.xyz=rgbB;
    }
}

#endif //COMPILING_FS