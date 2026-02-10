// =========================
// 基础 Three.js 场景
// =========================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 1.5, 5);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// =========================
// 灯光 + 地面
// =========================
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemi);

const dir = new THREE.DirectionalLight(0xffffff, 1.0);
dir.position.set(3, 5, 2);
scene.add(dir);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = -1.2;
scene.add(ground);

// =========================
// PBR 球体
// =========================
const sphereMat = new THREE.MeshStandardMaterial({
  color: 0xffffff,
  metalness: 1.0,
  roughness: 0.15
});
const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(1.2, 64, 64),
  sphereMat
);
//scene.add(sphere);

// =========================
// PMREM
// =========================
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();

// =========================
// 混合两个 HDR 的 Shader
// =========================
const mixScene = new THREE.Scene();
const mixCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
mixScene.add(mixCamera);

const mixUniforms = {
  uEnv1: { value: null },
  uEnv2: { value: null },
  uWeight: { value: 0 }
};

const mixMaterial = new THREE.ShaderMaterial({
  uniforms: mixUniforms,
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D uEnv1;
    uniform sampler2D uEnv2;
    uniform float uWeight;

    void main() {
      vec3 c1 = texture2D(uEnv1, vUv).rgb;
      vec3 c2 = texture2D(uEnv2, vUv).rgb;
      gl_FragColor = vec4(mix(c1, c2, uWeight), 1.0);
    }
  `
});

const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mixMaterial);
mixScene.add(quad);

const mixRT = new THREE.WebGLRenderTarget(1024, 512, {
  magFilter: THREE.LinearFilter,
  minFilter: THREE.LinearFilter,
  type: THREE.HalfFloatType
});

let currentEnv = null;

// =========================
// dat.GUI
// =========================
const params = { weight: 0.0 };
const gui = new dat.GUI();
gui.add(params, "weight", 0, 1, 0.01).name("Env Mix");

// =========================
// HDR 文件选择
// =========================
const hdrInput = document.getElementById("hdrInput");
const rgbe = new THREE.RGBELoader();

let hdr1 = null;
let hdr2 = null;

hdrInput.addEventListener("change", async (e) => {
  const files = [...e.target.files];
  if (files.length !== 2) {
    alert("请一次选择两个 HDR 文件");
    return;
  }

  const [f1, f2] = files;

  hdr1 = await rgbe.loadAsync(URL.createObjectURL(f1));
  hdr2 = await rgbe.loadAsync(URL.createObjectURL(f2));

  hdr1.mapping = THREE.EquirectangularReflectionMapping;
  hdr2.mapping = THREE.EquirectangularReflectionMapping;

  mixUniforms.uEnv1.value = hdr1;
  mixUniforms.uEnv2.value = hdr2;

  updateEnvironment();
});

// =========================
// GLB 加载
// =========================
let aoTexture = null;

document.getElementById('aoInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const url = URL.createObjectURL(file);

new THREE.TextureLoader().load(url, (tex) => {
  aoTexture = tex;
  aoTexture.needsUpdate = true;
  aoTexture.flipY = false;

  // 如果模型已经加载，则立即应用
  if (glbModel) {
    applyAOMapToGLB(glbModel, aoTexture);
  }
});

});

const gltfLoader = new THREE.GLTFLoader();
let glbModel = null;


const glbInput = document.getElementById("glbInput");
function applyAOMapToGLB(model, aoTexture) {
    model.traverse((child) => {
        if (child.isMesh && child.material && child.name === 'Object_30') {
	        window.aoMapMat = child.material;
            child.material.aoMap = aoTexture;
			child.material.needsUpdate = true;
        }
    });
}
glbInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  gltfLoader.load(url, (gltf) => {
    if (glbModel) scene.remove(glbModel);
    glbModel = gltf.scene;
    glbModel.position.set(0, -1.2, 0);
	
    scene.add(glbModel);
    // 设置 GLB 的 envMap
    applyEnvMapToGLB(glbModel, scene.environment);
  });
});

// 给 GLB 所有 Mesh 设置 envMap
function applyEnvMapToGLB(root, envMap) {
  root.traverse((obj) => {
    if (obj.isMesh) {
      const mat = obj.material;

      if (Array.isArray(mat)) {
        mat.forEach((m) => {
          m.envMap = envMap;
          m.needsUpdate = true;
        });
      } else {
        mat.envMap = envMap;
        mat.needsUpdate = true;
      }
    }
  });
}

// =========================
// 更新环境贴图
// =========================
function updateEnvironment() {
  if (!hdr1 || !hdr2) return;

  mixUniforms.uWeight.value = params.weight;

  renderer.setRenderTarget(mixRT);
  renderer.render(mixScene, mixCamera);
  renderer.setRenderTarget(null);

  const envRT = pmrem.fromEquirectangular(mixRT.texture);

  scene.environment = envRT.texture;
  scene.background = envRT.texture;

  sphereMat.envMap = envRT.texture;
  sphereMat.needsUpdate = true;

  if (glbModel) {
    applyEnvMapToGLB(glbModel, envRT.texture);
  }

  if (currentEnv) currentEnv.dispose();
  currentEnv = envRT;
}

// =========================
// 动画循环
// =========================
function animate() {
  requestAnimationFrame(animate);

  if (hdr1 && hdr2) updateEnvironment();

  controls.update();
  renderer.render(scene, camera);
}
animate();

// =========================
// 自适应
// =========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
