
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
document.body.appendChild(renderer.domElement);

// gui
var gui = new dat.GUI();
var params = {
  exposure: 1.0
};
gui.add(params, 'exposure', 0.1, 10.0).onChange(function(value) {
  renderer.toneMappingExposure = value;
});

// 创建立方体
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial(); // 不依赖光照
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const rgbeLoader = new THREE.RGBELoader();

rgbeLoader.load('/toneMapping-NeedHttp/sunny_prairie_expanse_2k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
});


const orbit = new THREE.OrbitControls(camera, renderer.domElement);

orbit.update();

// 响应窗口大小变化
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

