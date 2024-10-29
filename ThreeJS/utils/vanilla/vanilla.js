import { MathUtils, Color, Vector3, ShaderMaterial } from 'three';

const BlendModes = {
  normal: 1,
  add: 2,
  subtract: 3,
  multiply: 4,
  addsub: 5,
  lighten: 6,
  darken: 7,
  switch: 8,
  divide: 9,
  overlay: 10,
  screen: 11,
  softlight: 12
};
const NoiseTypes = {
  white: 1,
  perlin: 2,
  simplex: 3,
  curl: 4,
  cell: 5
};
const MappingTypes = {
  uv: 1,
  local: 2,
  world: 3
};

class Abstract {
  static genID() {
    return MathUtils.generateUUID().replaceAll('-', '_');
  }

  getBlendMode(type, a, b) {
    if (type === BlendModes['normal']) return `sc_copy(${a}, ${b})`;else if (type === BlendModes['add']) return `sc_add(${a}, ${b})`;else if (type === BlendModes['subtract']) return `sc_subtract(${a}, ${b})`;else if (type === BlendModes['multiply']) return `sc_multiply(${a}, ${b})`;else if (type === BlendModes['addsub']) return `sc_addSub(${a}, ${b})`;else if (type === BlendModes['lighten']) return `sc_lighten(${a}, ${b})`;else if (type === BlendModes['darken']) return `sc_darken(${a}, ${b})`;else if (type === BlendModes['divide']) return `sc_divide(${a}, ${b})`;else if (type === BlendModes['overlay']) return `sc_overlay(${a}, ${b})`;else if (type === BlendModes['screen']) return `sc_screen(${a}, ${b})`;else if (type === BlendModes['softlight']) return `sc_softLight(${a}, ${b})`;else if (type === BlendModes['switch']) return `sc_switch(${a}, ${b})`;
  }

  getVertexVariables() {
    return '';
  }

  getVertexBody(e) {
    return '';
  }

}

class Base extends Abstract {
  constructor(props) {
    super();
    this.name = 'Base';
    this.mode = 'normal';
    this.uuid = Abstract.genID();
    const {
      color,
      alpha,
      mode
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_color`]: {
        value: new Color(color != null ? color : '#ffffff')
      },
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      }
    };
    this.mode = mode || 'normal';
  }

  getFragmentVariables() {
    return `    
    uniform float u_${this.uuid}_alpha;
    uniform vec3 u_${this.uuid}_color;
`;
  }

  getFragmentBody(e) {
    return `    
      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(u_${this.uuid}_color, u_${this.uuid}_alpha)`)};
  `;
  }

  set color(v) {
    this.uniforms[`u_${this.uuid}_color`].value = new Color(v);
  }

  get color() {
    return this.uniforms[`u_${this.uuid}_color`].value;
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

}

class Depth extends Abstract {
  constructor(props) {
    super();
    this.name = 'Depth';
    this.mode = 'normal';
    this.uuid = Abstract.genID();
    const {
      alpha,
      mode,
      colorA,
      colorB,
      near,
      far,
      origin,
      isVector
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      },
      [`u_${this.uuid}_near`]: {
        value: near != null ? near : 700
      },
      [`u_${this.uuid}_far`]: {
        value: far != null ? far : 1e7
      },
      [`u_${this.uuid}_origin`]: {
        value: origin != null ? origin : new Vector3(0, 0, 0)
      },
      [`u_${this.uuid}_colorA`]: {
        value: new Color(colorA != null ? colorA : '#ffffff')
      },
      [`u_${this.uuid}_colorB`]: {
        value: new Color(colorB != null ? colorB : '#ffffff')
      },
      [`u_${this.uuid}_isVector`]: {
        value: isVector != null ? isVector : true
      }
    };
    this.mode = mode || 'normal';
  }

  getVertexVariables() {
    return (
      /* glsl */
      `
    varying vec3 v_${this.uuid}_worldPosition;
    `
    );
  }

  getVertexBody(e) {
    return (
      /* glsl */
      `
    v_${this.uuid}_worldPosition = vec3(vec4(position, 1.0) * modelMatrix);
    `
    );
  }

  getFragmentVariables() {
    return (
      /* glsl */
      `    
    uniform float u_${this.uuid}_alpha;
    uniform float u_${this.uuid}_near;
    uniform float u_${this.uuid}_far;
    uniform float u_${this.uuid}_isVector;
    uniform vec3 u_${this.uuid}_origin;
    uniform vec3 u_${this.uuid}_colorA;
    uniform vec3 u_${this.uuid}_colorB;

    varying vec3 v_${this.uuid}_worldPosition;
`
    );
  }

  getFragmentBody(e) {
    return (
      /* glsl */
      `    
     
      vec3 f_${this.uuid}_base = ( u_${this.uuid}_isVector > 0.5 ) ?  u_${this.uuid}_origin : cameraPosition;
      float f_${this.uuid}_dist = length( v_${this.uuid}_worldPosition.xyz - f_${this.uuid}_base );
      float f_${this.uuid}_dep = ( f_${this.uuid}_dist - u_${this.uuid}_near ) / ( u_${this.uuid}_far - u_${this.uuid}_near );

      vec3 f_${this.uuid}_depth =  mix( u_${this.uuid}_colorB, u_${this.uuid}_colorA, 1.0 - clamp( f_${this.uuid}_dep, 0., 1. ) );

      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(f_${this.uuid}_depth, u_${this.uuid}_alpha)`)};
  `
    );
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

  set near(v) {
    this.uniforms[`u_${this.uuid}_near`].value = v;
  }

  get near() {
    return this.uniforms[`u_${this.uuid}_near`].value;
  }

  set far(v) {
    this.uniforms[`u_${this.uuid}_far`].value = v;
  }

  get far() {
    return this.uniforms[`u_${this.uuid}_far`].value;
  }

  set origin(v) {
    this.uniforms[`u_${this.uuid}_origin`].value = v;
  }

  get origin() {
    return this.uniforms[`u_${this.uuid}_origin`].value;
  }

  set colorA(v) {
    this.uniforms[`u_${this.uuid}_colorA`].value = new Color(v);
  }

  get colorA() {
    return this.uniforms[`u_${this.uuid}_colorA`].value;
  }

  set colorB(v) {
    this.uniforms[`u_${this.uuid}_colorB`].value = new Color(v);
  }

  get colorB() {
    return this.uniforms[`u_${this.uuid}_colorB`].value;
  }

  set isVector(v) {
    this.uniforms[`u_${this.uuid}_isVector`].value = v;
  }

  get isVector() {
    return this.uniforms[`u_${this.uuid}_isVector`].value;
  }

}

class Fresnel extends Abstract {
  constructor(props) {
    super();
    this.name = 'Fresnel';
    this.mode = 'normal';
    this.uuid = Abstract.genID();
    const {
      alpha,
      mode,
      color,
      bias,
      intensity,
      power
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      },
      [`u_${this.uuid}_color`]: {
        value: new Color(color != null ? color : '#ffffff')
      },
      [`u_${this.uuid}_bias`]: {
        value: bias != null ? bias : 0
      },
      [`u_${this.uuid}_intensity`]: {
        value: intensity != null ? intensity : 1
      },
      [`u_${this.uuid}_power`]: {
        value: power != null ? power : 2
      }
    };
    this.mode = mode || 'normal';
  }

  getVertexVariables() {
    return (
      /* glsl */
      `
    varying vec3 v_${this.uuid}_worldPosition;
    varying vec3 v_${this.uuid}_worldNormal;
    `
    );
  }

  getVertexBody(e) {
    return (
      /* glsl */
      `
    v_${this.uuid}_worldPosition = normalize(vec3(modelViewMatrix * vec4(position, 1.0)).xyz);
    v_${this.uuid}_worldNormal = normalize(normalMatrix * normal);
    `
    );
  }

  getFragmentVariables() {
    return (
      /* glsl */
      `    
    uniform float u_${this.uuid}_alpha;
    uniform vec3 u_${this.uuid}_color;
    uniform float u_${this.uuid}_bias;
    uniform float u_${this.uuid}_intensity;
    uniform float u_${this.uuid}_power;
    uniform float u_${this.uuid}_factor;

    varying vec3 v_${this.uuid}_worldPosition;
    varying vec3 v_${this.uuid}_worldNormal;
`
    );
  }

  getFragmentBody(e) {
    return (
      /* glsl */
      `    
      float f_${this.uuid}_a = ( 1.0 - -min(dot(v_${this.uuid}_worldPosition, normalize(v_${this.uuid}_worldNormal) ), 0.0) );
      float f_${this.uuid}_fresnel = u_${this.uuid}_bias + (u_${this.uuid}_intensity * pow(f_${this.uuid}_a, u_${this.uuid}_power));

      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(u_${this.uuid}_color * f_${this.uuid}_fresnel, u_${this.uuid}_alpha)`)};
  `
    );
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

  set color(v) {
    this.uniforms[`u_${this.uuid}_color`].value = new Color(v);
  }

  get color() {
    return this.uniforms[`u_${this.uuid}_color`].value;
  }

  set bias(v) {
    this.uniforms[`u_${this.uuid}_bias`].value = v;
  }

  get bias() {
    return this.uniforms[`u_${this.uuid}_bias`].value;
  }

  set intensity(v) {
    this.uniforms[`u_${this.uuid}_intensity`].value = v;
  }

  get intensity() {
    return this.uniforms[`u_${this.uuid}_intensity`].value;
  }

  set power(v) {
    this.uniforms[`u_${this.uuid}_power`].value = v;
  }

  get power() {
    return this.uniforms[`u_${this.uuid}_power`].value;
  }

}

class Noise extends Abstract {
  constructor(props) {
    super();
    this.name = 'Noise';
    this.mode = 'normal';
    this.type = 'perlin';
    this.mapping = 'uv';
    this.uuid = Abstract.genID();
    const {
      alpha,
      mode,
      scale,
      colorA,
      colorB,
      type,
      mapping
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      },
      [`u_${this.uuid}_scale`]: {
        value: scale != null ? scale : 1
      },
      [`u_${this.uuid}_colorA`]: {
        value: new Color(colorA != null ? colorA : '#ffffff')
      },
      [`u_${this.uuid}_colorB`]: {
        value: new Color(colorB != null ? colorB : '#000000')
      }
    };
    this.mode = mode || 'normal';
    this.type = type || 'perlin';
    this.mapping = mapping || 'uv';
  }

  getMapping() {
    switch (MappingTypes[this.mapping]) {
      case MappingTypes.uv:
        return `vec3(uv, 0.)`;

      case MappingTypes.local:
        return `position`;

      case MappingTypes.world:
        return `
        (modelMatrix * vec4(position,1.0)).xyz;
        `;
    }
  }

  getNoise(e) {
    switch (NoiseTypes[this.type]) {
      case NoiseTypes.white:
        return `lamina_noise_white(${e})`;

      case NoiseTypes.perlin:
        return `lamina_noise_perlin(${e})`;

      case NoiseTypes.simplex:
        return `lamina_noise_simplex(${e})`;

      case NoiseTypes.curl:
        return `lamina_noise_swirl(${e})`;

      case NoiseTypes.cell:
        return `lamina_noise_worley(${e})`;
    }
  }

  getVertexVariables() {
    return (
      /* glsl */
      `
    varying vec3 v_${this.uuid}_position;
    `
    );
  }

  getVertexBody(e) {
    return (
      /* glsl */
      `
    v_${this.uuid}_position = ${this.getMapping()};
    `
    );
  }

  getFragmentVariables() {
    return (
      /* glsl */
      `    
    uniform float u_${this.uuid}_alpha;
    uniform vec3 u_${this.uuid}_colorA;
    uniform vec3 u_${this.uuid}_colorB;
    uniform float u_${this.uuid}_scale;
    varying vec3 v_${this.uuid}_position;
`
    );
  }

  getFragmentBody(e) {
    return (
      /* glsl */
      `    
      float f_${this.uuid}_noise = ${this.getNoise(`v_${this.uuid}_position * u_${this.uuid}_scale`)};
      vec3 f_${this.uuid}_noiseColor = mix(u_${this.uuid}_colorA, u_${this.uuid}_colorB, f_${this.uuid}_noise);

      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(f_${this.uuid}_noiseColor, u_${this.uuid}_alpha)`)};
    `
    );
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

  set colorA(v) {
    this.uniforms[`u_${this.uuid}_colorA`].value = new Color(v);
  }

  get colorA() {
    return this.uniforms[`u_${this.uuid}_colorA`].value;
  }

  set colorB(v) {
    this.uniforms[`u_${this.uuid}_colorB`].value = new Color(v);
  }

  get colorB() {
    return this.uniforms[`u_${this.uuid}_colorB`].value;
  }

  set scale(v) {
    this.uniforms[`u_${this.uuid}_scale`].value = v;
  }

  get scale() {
    return this.uniforms[`u_${this.uuid}_scale`].value;
  }

}

class Normals extends Abstract {
  constructor(props) {
    super();
    this.name = 'Normals';
    this.mode = 'normal';
    this.uuid = Abstract.genID();
    const {
      alpha,
      mode,
      direction
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      },
      [`u_${this.uuid}_direction`]: {
        value: direction
      }
    };
    this.mode = mode || 'normal';
  }

  getVertexVariables() {
    return (
      /* glsl */
      `
    varying vec3 v_${this.uuid}_normals;
    `
    );
  }

  getVertexBody(e) {
    return (
      /* glsl */
      `
    v_${this.uuid}_normals = normal;
    `
    );
  }

  getFragmentVariables() {
    return (
      /* glsl */
      `    
    uniform float u_${this.uuid}_alpha;
    uniform vec3 u_${this.uuid}_color;
    uniform vec3 u_${this.uuid}_direction;

    varying vec3 v_${this.uuid}_normals;
`
    );
  }

  getFragmentBody(e) {
    return (
      /* glsl */
      `    
      vec3 f_${this.uuid}_normalColor = vec3(1.);
      f_${this.uuid}_normalColor.x = v_${this.uuid}_normals.x * u_${this.uuid}_direction.x;
      f_${this.uuid}_normalColor.y = v_${this.uuid}_normals.y * u_${this.uuid}_direction.y;
      f_${this.uuid}_normalColor.z = v_${this.uuid}_normals.z * u_${this.uuid}_direction.z;

      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(f_${this.uuid}_normalColor, u_${this.uuid}_alpha)`)};
  `
    );
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

  set color(v) {
    this.uniforms[`u_${this.uuid}_color`].value = new Color(v);
  }

  get color() {
    return this.uniforms[`u_${this.uuid}_color`].value;
  }

  set direction(v) {
    this.uniforms[`u_${this.uuid}_direction`].value = v;
  }

  get direction() {
    return this.uniforms[`u_${this.uuid}_direction`].value;
  }

}

class Texture extends Abstract {
  constructor(props) {
    super();
    this.name = 'Texture';
    this.mode = 'texture';
    this.uuid = Abstract.genID();
    const {
      alpha,
      mode,
      map
    } = props || {};
    this.uniforms = {
      [`u_${this.uuid}_alpha`]: {
        value: alpha != null ? alpha : 1
      },
      [`u_${this.uuid}_map`]: {
        value: map
      }
    };
    this.mode = mode || 'normal';
  }

  getVertexVariables() {
    return (
      /* glsl */
      `
    varying vec2 v_${this.uuid}_uv;
    `
    );
  }

  getVertexBody(e) {
    return (
      /* glsl */
      `
    v_${this.uuid}_uv = uv;
    `
    );
  }

  getFragmentVariables() {
    return (
      /* glsl */
      `    
    uniform float u_${this.uuid}_alpha;
    uniform sampler2D u_${this.uuid}_map;

    varying vec2 v_${this.uuid}_uv;
`
    );
  }

  getFragmentBody(e) {
    return (
      /* glsl */
      `    
      vec4 f_${this.uuid}_texture = texture2D(u_${this.uuid}_map, v_${this.uuid}_uv);

      ${e} = ${this.getBlendMode(BlendModes[this.mode], e, `vec4(f_${this.uuid}_texture.xyz, f_${this.uuid}_texture.a * u_${this.uuid}_alpha)`)};
  `
    );
  }

  set alpha(v) {
    this.uniforms[`u_${this.uuid}_alpha`].value = v;
  }

  get alpha() {
    return this.uniforms[`u_${this.uuid}_alpha`].value;
  }

  set map(v) {
    this.uniforms[`u_${this.uuid}_map`].value = v;
  }

  get map() {
    return this.uniforms[`u_${this.uuid}_map`].value;
  }

}

var HelperChunk = /* glsl */
`

float lamina_map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float lamina_normalize(float v) { return lamina_map(v, -1.0, 1.0, 0.0, 1.0); }
`;

var BlendModesChunk = /* glsl */
`
// SC: Blend modes definitions **********

float sc_softLight(float f, float b) {
  return (f < 0.5)
             ? b - (1.0 - 2.0 * f) * b * (1.0 - b)
             : (b < 0.25)
                   ? b + (2.0 * f - 1.0) * b * ((16.0 * b - 12.0) * b + 3.0)
                   : b + (2.0 * f - 1.0) * (sqrt(b) - b);
}

vec4 sc_softLight(vec4 b, vec4 f) {
  vec4 result;
  result.x = sc_softLight(f.x, b.x);
  result.y = sc_softLight(f.y, b.y);
  result.z = sc_softLight(f.z, b.z);
  result.a = sc_softLight(f.a, b.a);
  
  return result;
}

vec4 sc_screen(vec4 f, vec4 b) {
  vec4 result;

  result = 1.0 - (1.0 - f) * (1.0 - b);
  result = mix(f, result, b.a);

  return result;
}

float sc_overlay(float f, float b) {
  return (b < 0.5) ? 2.0 * f * b : 1.0 - 2.0 * (1.0 - f) * (1.0 - b);
}

vec4 sc_overlay(vec4 b, vec4 f) {
  vec4 result;
  result.x = sc_overlay(f.x, b.x);
  result.y = sc_overlay(f.y, b.y);
  result.z = sc_overlay(f.z, b.z);
  result.a = sc_overlay(f.a, b.a);


  return result;
}

vec4 sc_divide(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);
  result = b / f;
  return result;
}

vec4 sc_switch(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);
  result = max((f * b.a), (b * (1.0 - b.a)));
  return result;
}

vec4 sc_darken(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);
  result = mix(f, min(f, b), b.a);
  return result;
}

vec4 sc_lighten(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);
  result = mix(f, max(f, b), b.a);
  return result;
}

float sc_addSub(float f, float b) {
  return f > 0.5 ? f + b : b - f;
}
vec4 sc_addSub(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);

  result.r = sc_addSub(f.r, b.r * b.a);
  result.g = sc_addSub(f.g, b.g * b.a);
  result.b = sc_addSub(f.b, b.b* b.a ) ;
  result.a = sc_addSub(f.a, b.a);

  return result;
}

vec4 sc_multiply(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);

  result = mix(f, b * f, b.a);
  result.a = f.a + b.a * (1.0 - f.a);

  return result;
}

vec4 sc_subtract(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);

  result = f - b * b.a;
  result.a = f.a + b.a * (1.0 - f.a);

  return result;
}

vec4 sc_add(vec4 f, vec4 b) {
  vec4 result = vec4(0.0);

  result = f + b * (b.a);
  result.a = f.a + b.a * (1.0 - f.a);

  return result;
}

vec4 sc_copy(vec4 b, vec4 f) {
  vec4 result = vec4(0.0);

  result.a = f.a + b.a * (1.0 - f.a);
  result.rgb = ((f.rgb * f.a) + (b.rgb * b.a) * (1.0 - f.a));

  return result;
}

`; // ************************************

var NoiseChunk = /* glsl */
`

// From: https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
// Huge thanks to the creators of these algorithms

float lamina_noise_mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 lamina_noise_mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 lamina_noise_perm(vec4 x){return lamina_noise_mod289(((x * 34.0) + 1.0) * x);}
vec4 lamina_noise_permute(vec4 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
vec4 lamina_noise_taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }


float lamina_noise_white(vec2 p) {
  return fract(1e4 * sin(17.0 * p.x + p.y * 0.1) *
               (0.1 + abs(sin(p.y * 13.0 + p.x))));
}

float lamina_noise_white(vec3 p) {
  return lamina_noise_white(p.xy);
}


vec3 lamina_noise_fade(vec3 t) { return t * t * t * (t * (t * 6.0 - 15.0) + 10.0); }

float lamina_noise_perlin(vec3 P) {
  vec3 Pi0 = floor(P);        // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);        // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = lamina_noise_permute(lamina_noise_permute(ix) + iy);
  vec4 ixy0 = lamina_noise_permute(ixy + iz0);
  vec4 ixy1 = lamina_noise_permute(ixy + iz1);

  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x, gy0.x, gz0.x);
  vec3 g100 = vec3(gx0.y, gy0.y, gz0.y);
  vec3 g010 = vec3(gx0.z, gy0.z, gz0.z);
  vec3 g110 = vec3(gx0.w, gy0.w, gz0.w);
  vec3 g001 = vec3(gx1.x, gy1.x, gz1.x);
  vec3 g101 = vec3(gx1.y, gy1.y, gz1.y);
  vec3 g011 = vec3(gx1.z, gy1.z, gz1.z);
  vec3 g111 = vec3(gx1.w, gy1.w, gz1.w);

  vec4 norm0 = lamina_noise_taylorInvSqrt(
      vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = lamina_noise_taylorInvSqrt(
      vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = lamina_noise_fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111),
                 fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
  return lamina_normalize(2.2 * n_xyz);
}

float lamina_noise_simplex(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  //  x0 = x0 - 0. + 0.0 * C
  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0);
  vec4 p = lamina_noise_permute(lamina_noise_permute(lamina_noise_permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y +
                             vec4(0.0, i1.y, i2.y, 1.0)) +
                    i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  // ( N*N points uniformly over a square, mapped onto an octahedron.)
  float n_ = 1.0 / 7.0; // N=7
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z); //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_); // mod(j,N)

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm =
      lamina_noise_taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m =
      max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return lamina_normalize(42.0 *
         dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3))));
}

vec3 lamina_noise_simplex3(vec3 x) {
  float s = lamina_noise_simplex(vec3(x));
  float s1 = lamina_noise_simplex(vec3(x.y - 19.1, x.z + 33.4, x.x + 47.2));
  float s2 = lamina_noise_simplex(vec3(x.z + 74.2, x.x - 124.5, x.y + 99.4));
  vec3 c = vec3(s, s1, s2);
  return c;
}

vec3 lamina_noise_curl(vec3 p) {
  const float e = .1;
  vec3 dx = vec3(e, 0.0, 0.0);
  vec3 dy = vec3(0.0, e, 0.0);
  vec3 dz = vec3(0.0, 0.0, e);

  vec3 p_x0 = lamina_noise_simplex3(p - dx);
  vec3 p_x1 = lamina_noise_simplex3(p + dx);
  vec3 p_y0 = lamina_noise_simplex3(p - dy);
  vec3 p_y1 = lamina_noise_simplex3(p + dy);
  vec3 p_z0 = lamina_noise_simplex3(p - dz);
  vec3 p_z1 = lamina_noise_simplex3(p + dz);

  float x = p_y1.z - p_y0.z - p_z1.y + p_z0.y;
  float y = p_z1.x - p_z0.x - p_x1.z + p_x0.z;
  float z = p_x1.y - p_x0.y - p_y1.x + p_y0.x;

  const float divisor = 1.0 / (2.0 * e);
  return normalize(vec3(x, y, z) * divisor);
}

vec3 lamina_permute(vec3 x) {
  return mod((34.0 * x + 1.0) * x, 289.0);
}

vec3 lamina_dist(vec3 x, vec3 y, vec3 z,  bool manhattanDistance) {
  return manhattanDistance ?  abs(x) + abs(y) + abs(z) :  (x * x + y * y + z * z);
}

// From: https://github.com/Erkaman/glsl-worley
float lamina_noise_worley(vec3 P) {
  float jitter = 1.;
  bool manhattanDistance = false; 

  float K = 0.142857142857; // 1/7
  float Ko = 0.428571428571; // 1/2-K/2
  float  K2 = 0.020408163265306; // 1/(7*7)
  float Kz = 0.166666666667; // 1/6
  float Kzo = 0.416666666667; // 1/2-1/6*2

	vec3 Pi = mod(floor(P), 289.0);
 	vec3 Pf = fract(P) - 0.5;

	vec3 Pfx = Pf.x + vec3(1.0, 0.0, -1.0);
	vec3 Pfy = Pf.y + vec3(1.0, 0.0, -1.0);
	vec3 Pfz = Pf.z + vec3(1.0, 0.0, -1.0);

	vec3 p = lamina_permute(Pi.x + vec3(-1.0, 0.0, 1.0));
	vec3 p1 = lamina_permute(p + Pi.y - 1.0);
	vec3 p2 = lamina_permute(p + Pi.y);
	vec3 p3 = lamina_permute(p + Pi.y + 1.0);

	vec3 p11 = lamina_permute(p1 + Pi.z - 1.0);
	vec3 p12 = lamina_permute(p1 + Pi.z);
	vec3 p13 = lamina_permute(p1 + Pi.z + 1.0);

	vec3 p21 = lamina_permute(p2 + Pi.z - 1.0);
	vec3 p22 = lamina_permute(p2 + Pi.z);
	vec3 p23 = lamina_permute(p2 + Pi.z + 1.0);

	vec3 p31 = lamina_permute(p3 + Pi.z - 1.0);
	vec3 p32 = lamina_permute(p3 + Pi.z);
	vec3 p33 = lamina_permute(p3 + Pi.z + 1.0);

	vec3 ox11 = fract(p11*K) - Ko;
	vec3 oy11 = mod(floor(p11*K), 7.0)*K - Ko;
	vec3 oz11 = floor(p11*K2)*Kz - Kzo; // p11 < 289 guaranteed

	vec3 ox12 = fract(p12*K) - Ko;
	vec3 oy12 = mod(floor(p12*K), 7.0)*K - Ko;
	vec3 oz12 = floor(p12*K2)*Kz - Kzo;

	vec3 ox13 = fract(p13*K) - Ko;
	vec3 oy13 = mod(floor(p13*K), 7.0)*K - Ko;
	vec3 oz13 = floor(p13*K2)*Kz - Kzo;

	vec3 ox21 = fract(p21*K) - Ko;
	vec3 oy21 = mod(floor(p21*K), 7.0)*K - Ko;
	vec3 oz21 = floor(p21*K2)*Kz - Kzo;

	vec3 ox22 = fract(p22*K) - Ko;
	vec3 oy22 = mod(floor(p22*K), 7.0)*K - Ko;
	vec3 oz22 = floor(p22*K2)*Kz - Kzo;

	vec3 ox23 = fract(p23*K) - Ko;
	vec3 oy23 = mod(floor(p23*K), 7.0)*K - Ko;
	vec3 oz23 = floor(p23*K2)*Kz - Kzo;

	vec3 ox31 = fract(p31*K) - Ko;
	vec3 oy31 = mod(floor(p31*K), 7.0)*K - Ko;
	vec3 oz31 = floor(p31*K2)*Kz - Kzo;

	vec3 ox32 = fract(p32*K) - Ko;
	vec3 oy32 = mod(floor(p32*K), 7.0)*K - Ko;
	vec3 oz32 = floor(p32*K2)*Kz - Kzo;

	vec3 ox33 = fract(p33*K) - Ko;
	vec3 oy33 = mod(floor(p33*K), 7.0)*K - Ko;
	vec3 oz33 = floor(p33*K2)*Kz - Kzo;

	vec3 dx11 = Pfx + jitter*ox11;
	vec3 dy11 = Pfy.x + jitter*oy11;
	vec3 dz11 = Pfz.x + jitter*oz11;

	vec3 dx12 = Pfx + jitter*ox12;
	vec3 dy12 = Pfy.x + jitter*oy12;
	vec3 dz12 = Pfz.y + jitter*oz12;

	vec3 dx13 = Pfx + jitter*ox13;
	vec3 dy13 = Pfy.x + jitter*oy13;
	vec3 dz13 = Pfz.z + jitter*oz13;

	vec3 dx21 = Pfx + jitter*ox21;
	vec3 dy21 = Pfy.y + jitter*oy21;
	vec3 dz21 = Pfz.x + jitter*oz21;

	vec3 dx22 = Pfx + jitter*ox22;
	vec3 dy22 = Pfy.y + jitter*oy22;
	vec3 dz22 = Pfz.y + jitter*oz22;

	vec3 dx23 = Pfx + jitter*ox23;
	vec3 dy23 = Pfy.y + jitter*oy23;
	vec3 dz23 = Pfz.z + jitter*oz23;

	vec3 dx31 = Pfx + jitter*ox31;
	vec3 dy31 = Pfy.z + jitter*oy31;
	vec3 dz31 = Pfz.x + jitter*oz31;

	vec3 dx32 = Pfx + jitter*ox32;
	vec3 dy32 = Pfy.z + jitter*oy32;
	vec3 dz32 = Pfz.y + jitter*oz32;

	vec3 dx33 = Pfx + jitter*ox33;
	vec3 dy33 = Pfy.z + jitter*oy33;
	vec3 dz33 = Pfz.z + jitter*oz33;

	vec3 d11 = lamina_dist(dx11, dy11, dz11, manhattanDistance);
	vec3 d12 = lamina_dist(dx12, dy12, dz12, manhattanDistance);
	vec3 d13 = lamina_dist(dx13, dy13, dz13, manhattanDistance);
	vec3 d21 = lamina_dist(dx21, dy21, dz21, manhattanDistance);
	vec3 d22 = lamina_dist(dx22, dy22, dz22, manhattanDistance);
	vec3 d23 = lamina_dist(dx23, dy23, dz23, manhattanDistance);
	vec3 d31 = lamina_dist(dx31, dy31, dz31, manhattanDistance);
	vec3 d32 = lamina_dist(dx32, dy32, dz32, manhattanDistance);
	vec3 d33 = lamina_dist(dx33, dy33, dz33, manhattanDistance);

	vec3 d1a = min(d11, d12);
	d12 = max(d11, d12);
	d11 = min(d1a, d13); // Smallest now not in d12 or d13
	d13 = max(d1a, d13);
	d12 = min(d12, d13); // 2nd smallest now not in d13
	vec3 d2a = min(d21, d22);
	d22 = max(d21, d22);
	d21 = min(d2a, d23); // Smallest now not in d22 or d23
	d23 = max(d2a, d23);
	d22 = min(d22, d23); // 2nd smallest now not in d23
	vec3 d3a = min(d31, d32);
	d32 = max(d31, d32);
	d31 = min(d3a, d33); // Smallest now not in d32 or d33
	d33 = max(d3a, d33);
	d32 = min(d32, d33); // 2nd smallest now not in d33
	vec3 da = min(d11, d21);
	d21 = max(d11, d21);
	d11 = min(da, d31); // Smallest now in d11
	d31 = max(da, d31); // 2nd smallest now not in d31
	d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
	d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx; // d11.x now smallest
	d12 = min(d12, d21); // 2nd smallest now not in d21
	d12 = min(d12, d22); // nor in d22
	d12 = min(d12, d31); // nor in d31
	d12 = min(d12, d32); // nor in d32
	d11.yz = min(d11.yz,d12.xy); // nor in d12.yz
	d11.y = min(d11.y,d12.z); // Only two more to go
	d11.y = min(d11.y,d11.z); // Done! (Phew!)

  vec2 F = sqrt(d11.xy);
	return F.x; // F1, F2

}

float lamina_noise_swirl(vec3 position) {
    float scale = 0.1;
    float freq = 4. * scale;
    float t = 1.;

    vec3 pos = (position * scale) + lamina_noise_curl(position * 7. * scale);

    float worley1 = 1. - lamina_noise_worley((pos * (freq * 2.)) +  (t * 2.));
    float worley2 = 1. - lamina_noise_worley((pos * (freq * 4.)) +  (t * 4.));
    float worley3 = 1. - lamina_noise_worley((pos * (freq * 8.)) +  (t * 8.));
    float worley4 = 1. - lamina_noise_worley((pos * (freq * 16.)) +  (t * 16.));
    
    float fbm1 = worley1 * .625 + worley2 * .25 + worley3 * .125;
    float fbm2 = worley2 * .625 + worley3 * .25 + worley4 * .125;
    float fbm3 = worley3 * .75 + worley4 * .25;

    vec3 curlWorleyFbm = vec3(fbm1, fbm2, fbm3);
    float curlWorley = curlWorleyFbm.r * .625 + curlWorleyFbm.g * .25 + 
        curlWorleyFbm.b * .125;

    return curlWorley;
}
  
  
`;

class LayerMaterial extends ShaderMaterial {
  static constructShader(layers = []) {
    const uniforms = {};
    const variables = {
      vert: '',
      frag: ''
    };
    const body = {
      vert: '',
      frag: ''
    };
    layers == null ? void 0 : layers.forEach(layer => {
      variables.frag += layer.getFragmentVariables() + ' \n';
      variables.vert += layer.getVertexVariables() + ' \n';
      Object.keys(layer.uniforms).forEach(key => uniforms[key] = layer.uniforms[key]);
      body.frag += layer.getFragmentBody('sc_finalColor') + ' \n';
      body.vert += layer.getVertexBody('') + ' \n';
    });
    return {
      uniforms,
      vertexShader: `

    ${variables.vert}
    void main() {
      ${body.vert}
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition;
    }
    `,
      fragmentShader: `
      ${HelperChunk}
      ${NoiseChunk}
    ${BlendModesChunk}
    ${variables.frag}
    void main() {
      vec4 sc_finalColor = vec4(vec3(1.), 1.);
      ${body.frag}
      gl_FragColor = sc_finalColor;
      #include <tonemapping_fragment>
      #include <encodings_fragment>
      #include <fog_fragment>
      #include <premultiplied_alpha_fragment>
      #include <dithering_fragment>
    }
    `
    };
  }

  constructor(props) {
    super(props);
    this.layers = [];

    if (props && props.layers && props.layers.length) {
      this.layers = props.layers;
      this.update();
    }
  }

  update() {
    if (this.layers.length) {
      Object.assign(this, LayerMaterial.constructShader(this.layers));
      this.uniformsNeedUpdate = true;
      this.needsUpdate = true;
    }
  }

}

export { Abstract, Base, Depth, Fresnel, LayerMaterial, Noise, Normals, Texture };
