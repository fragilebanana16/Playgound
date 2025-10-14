
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

// 创建立方体
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshNormalMaterial(); // 不依赖光照
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const rgbeLoader = new THREE.RGBELoader();

rgbeLoader.load('/toneMapping-NeedHttp/sunny_prairie_expanse_2k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  // set an environment map for the scene, affecting all materials within it
  // scene.environment = texture;
  
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffea00,
    roughness: 0,
	metalness: 0,
	ior: 2.33, // index of refraction
    envMap: texture
  });
  
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(2, 30, 30),
    material
  );
  sphere.position.x = -4;
  scene.add(sphere);
  
    // GUI 控制参数对象
  const params = {
	exposure: 1.0,
    color: '#' + material.color.getHexString(), // 转为十六进制字符串
    roughness: material.roughness,
    metalness: material.metalness,
	ior: material.ior,
  };
  
  // 添加hdr映射曝光
  gui.add(params, 'exposure', 0.1, 10.0).onChange(function(value) {
    renderer.toneMappingExposure = value;
  });
  
  // 添加颜色控制器
  gui.addColor(params, 'color').onChange(function (value) {
    material.color.set(value);
  });

  // 添加 roughness 控制器
  gui.add(params, 'roughness', 0, 1).step(0.001).onChange(function (value) {
    material.roughness = value;
  });
  
  // 添加 metalness 控制器
  gui.add(params, 'metalness', 0, 1).step(0.001).onChange(function (value) {
    material.metalness = value;
  });
  
   // 添加 ior 控制器
  gui.add(params, 'ior', 0, 2.23).step(0.001).onChange(function (value) {
    material.ior = value;
  });
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
renderer.toneMappingExposure = 1.5;
