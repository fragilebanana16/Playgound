
// 基础设置
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.z = 5;
const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 两个场景
const sceneA = new THREE.Scene();
sceneA.background = new THREE.Color(0x0000ff); // 蓝色背景
sceneA.add(new THREE.Mesh(
  new THREE.BoxGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xff0000 }) // 红色方块
));

const sceneB = new THREE.Scene();
sceneB.background = new THREE.Color(0x00ff00); // 绿色背景
sceneB.add(new THREE.Mesh(
  new THREE.SphereGeometry(),
  new THREE.MeshBasicMaterial({ color: 0xffff00 }) // 黄色球体
));

// 两个 RenderTarget
const rtA = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);
const rtB = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight);

// 全屏 Quad + ShaderMaterial
const quadScene = new THREE.Scene();
const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  texA: { value: rtA.texture },
  texB: { value: rtB.texture },
  progress: { value: 0.0 },
  resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
};

const quadMaterial = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    void main() {
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
	uniform sampler2D texA;
	uniform sampler2D texB;
	uniform float progress;   // 0.0 -> 全部B, 1.0 -> 全部A
	uniform vec2 resolution;

	void main() {
	  vec2 uv = gl_FragCoord.xy / resolution;
	  vec4 colorA = texture2D(texA, uv);
	  vec4 colorB = texture2D(texB, uv);

	  // 控制斜率，正值表示右上到左下，负值表示右下到左上
	  float slope = 0.5;

	  // 计算斜线边界：uv.x + uv.y * slope
	  float line = uv.x + uv.y * slope;

	  // 用 smoothstep 让边界柔和
	  float edge = smoothstep(progress - 0.05, progress + 0.05, line);

	  gl_FragColor = mix(colorB, colorA, edge);
	}
  `
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMaterial);
quadScene.add(quad);

// 动画控制
let progress = 0;
function animate() {
  requestAnimationFrame(animate);

  // 渲染两个场景到 RenderTarget
  renderer.setRenderTarget(rtA);
  renderer.render(sceneA, camera);

  renderer.setRenderTarget(rtB);
  renderer.render(sceneB, camera);

  renderer.setRenderTarget(null);

  // 更新 progress
  progress += 0.004;
  if (progress > 1.5) progress = 0;
  uniforms.progress.value = progress;

  // 渲染混合结果
  renderer.render(quadScene, quadCamera);
}

animate();
