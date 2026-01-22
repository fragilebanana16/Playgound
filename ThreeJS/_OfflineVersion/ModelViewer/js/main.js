// 创建场景
const scene = new THREE.Scene();

// 创建相机
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 3;

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

// Orbit 控制器
const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.update();

// 添加光照
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 10.0);
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);

// 响应窗口大小变化
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// 模型选择
const fileInput = document.getElementById('fileInput');
fileInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const contents = e.target.result;
    const loader = new THREE.GLTFLoader();

    if (file.name.endsWith('.glb')) {
      loader.parse(contents, '', (gltf) => {
        scene.add(gltf.scene);
        console.log('GLB 模型加载完成:', gltf);
      }, (error) => console.error('解析 GLB 出错:', error));
    } else if (file.name.endsWith('.gltf')) {
      const text = new TextDecoder().decode(contents);
      loader.parse(JSON.parse(text), '', (gltf) => {
        scene.add(gltf.scene);
        console.log('GLTF 模型加载完成:', gltf);
      }, (error) => console.error('解析 GLTF 出错:', error));
    }
  };

  if (file.name.endsWith('.glb')) {
    reader.readAsArrayBuffer(file);
  } else {
    reader.readAsText(file);
  }
});

// HDR 环境贴图选择
const hdrInput = document.getElementById('hdrInput');
hdrInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const contents = e.target.result;

    const rgbeLoader = new THREE.RGBELoader();
    rgbeLoader.parse(contents, (texture) => {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.environment = envMap;
      scene.background = envMap; // 可选：背景也用 HDR
      console.log('HDR 环境贴图加载完成');
    });
  };

  reader.readAsArrayBuffer(file); // HDR 是二进制数据
});
