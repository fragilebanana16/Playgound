import * as THREE from 'three';
import { GLTFLoader } from "../../utils/loaders/GLTFLoader.js";
import { DRACOLoader } from "../../utils/loaders/DRACOLoader.js";
import { OrbitControls } from "../../utils/controls/OrbitControls.js";
import { RGBELoader } from 'https://unpkg.com/three@0.149.0/examples/jsm/loaders/RGBELoader.js';

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x505050);

renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.needsUpdate = true;

document.body.appendChild(renderer.domElement);

// SETUP CAMERA
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-0.2, 1.5, 6.5);
controls.target.set(-0.2, 0.5, 0);
controls.autoRotate = false;
controls.autoRotateSpeed = 1;
controls.update();

// SETUP SCENE
// const floorTexture = new THREE.TextureLoader().load('models/grid.png');
// floorTexture.repeat = new THREE.Vector2(20, 20);
// floorTexture.wrapS = THREE.ReplaceWrapping;
// floorTexture.wrapT = THREE.ReplaceWrapping;

const scene = new THREE.Scene();

const ambient = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambient);

const light = new THREE.DirectionalLight(0xffffee, 10);
light.position.set(10, 10, 10);
light.castShadow = true;
scene.add(new THREE.CameraHelper(light.shadow.camera));
scene.add(new THREE.DirectionalLightHelper(light));
scene.add(light);

const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 20),
  new THREE.MeshStandardMaterial({
    // map: floorTexture
  }));
plane.rotation.x = -Math.PI / 2;
plane.position.y = -0.3;
plane.receiveShadow = true;
scene.add(plane);

// for testing light
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // 使用 MeshStandardMaterial
const cube = new THREE.Mesh(geometry, material);
cube.position.x = 3;
cube.position.y = 1;
cube.castShadow = true;
cube.receiveShadow = true;
scene.add(cube);

const hdriLoader = new RGBELoader()
hdriLoader.load('models/lonely_road_afternoon_puresky_1k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  scene.environment = texture;
});

new GLTFLoader().load('models/ferrari_488_pista_widebody.glb', (gltf) => {
  const mesh = gltf.scene;
  console.log(mesh);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.traverse((child) => {
    if (child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      child.material.envMapIntensity = 1;
    }
  });
  scene.add(mesh);
});

// 定义旋转中心点
const center = new THREE.Vector3(0, 0, 0);

// RENDER LOOP

function animate() {
  requestAnimationFrame(animate);

    // 计算光源相对于旋转中心点的位置
    const radius = 10; // 旋转半径
    const angle = Date.now() * 0.001; // 根据时间计算角度
    const x = center.x + radius * Math.cos(angle);
    const z = center.z + radius * Math.sin(angle);
  
    // 设置光源的新位置
    light.position.set(x, 10, z);

  renderer.render(scene, camera);
  controls.update();
}

// Events
window.addEventListener('resize', () => {
  // Resize camera aspect ratio and renderer size to the new window size
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();