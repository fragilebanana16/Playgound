/**
 * CDN way, delete importmap part in index.html
 */
// import * as THREE from "https://cdn.skypack.dev/three@0.129.0/build/three.module.js";
// import { OrbitControls } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/controls/OrbitControls.js";
// import { GLTFLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/GLTFLoader.js";
// import { DRACOLoader } from "https://cdn.skypack.dev/three@0.129.0/examples/jsm/loaders/DRACOLoader.js";

/**
 * localfile way, delete importmap part in index.html
 */
import * as THREE from 'three';
import { GLTFLoader } from "../utils/loaders/GLTFLoader.js";
import { DRACOLoader } from "../utils/loaders/DRACOLoader.js";
import { OrbitControls } from "../utils/controls/OrbitControls.js";
import { Depth, LayerMaterial } from "../utils/vanilla/vanilla.js";

//Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbbbbbb)

let backLightColor = "#2de8cd";
// 虚拟场景对象
let virtualScene = new THREE.Scene();
// 虚拟背景
let virtualBackgroundMesh;

//create a new camera with positions and angles
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

//Keep track of the mouse position, so we can make the eye move
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

//Keep the 3D object on a global variable so we can access it later
let object;

// for animation
let mixer;

//OrbitControls allow the camera to move around the scene
let controls;

//Set which object to render
let objToRender = 'ooo';

const getMaterials = (scene) => {
  const data = {
    nodes: {},
    materials: {},
  };

  if (!scene) {
    return data;
  }

  scene.traverse((obj) => {
    if (obj.name) {
      data.nodes[obj.name] = obj;
    }

    if (obj.material && !data.materials[obj.material.name]) {
      data.materials[obj.material.name] = obj.material;
    }
  });

  return data;
};



/**
 * Format1: Load glb with gltfLoader
 */
const dracoLoader = new DRACOLoader().setDecoderPath("../utils/draco/");
const gltfLoader = new GLTFLoader().setDRACOLoader(dracoLoader);
const model = await gltfLoader.loadAsync("models/911.glb");
if (model.scene) {
  const { materials, nodes } = getMaterials(model.scene);

  Object.values(nodes).forEach((node) => {
    node.receiveShadow = false;
    node.castShadow = false;
  });
  Object.assign(model, { materials, nodes });
}
model.scene.rotation.set(0, -Math.PI / 2, 0);
model.scene.scale.set(6, 6, 6);

// // play animations
// mixer = new THREE.AnimationMixer(model.scene);
// const clips = model.animations;

// // Play a certain animation
// // const clip = THREE.AnimationClip.findByName(clips, 'HeadAction');
// // const action = mixer.clipAction(clip);
// // action.play();

// // Play all animations at the same time
// clips.forEach(function(clip) {
//     const action = mixer.clipAction(clip);
//     action.play();
// });

scene.add(model.scene);

/**
 * Format2: Load GLTF
 */
// const loader = new GLTFLoader();
// loader.load(
//   `models/${objToRender}/scene.gltf`,
//   function (gltf) {
//     //If the file is loaded, add it to the scene
//     object = gltf.scene;
//     object.position.set(10, 10, 0);
//     // object.scale.set(0.5, 0.5, 0.5);
//     scene.add(object);
//   },
//   function (xhr) {
//     //While it is loading, log the progress
//     console.log((xhr.loaded / xhr.total * 100) + '% loaded');
//   },
//   function (error) {
//     //If there is an error, log it
//     console.error(error);
//   }
// );

const renderer = new THREE.WebGLRenderer({   powerPreference: "high-performance",antialias: true,alpha: true }); //Alpha: true allows for the transparent background
renderer.setSize(window.innerWidth, window.innerHeight);

document.getElementById("container3D").appendChild(renderer.domElement);

camera.position.z = 5;
camera.position.y = 20;

const topLight = new THREE.DirectionalLight(0xffffff, 9); // (color, intensity)
topLight.position.set(10, 10, 10);
topLight.castShadow = true;
scene.add(topLight);

// for testing light
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // 使用 MeshStandardMaterial
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffeeb1, 0x080820, 4);
scene.add(hemiLight);


controls = new OrbitControls(camera, renderer.domElement);
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  //Here we could add some code to update the scene, adding some automatic movement
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // if(mixer){
  //   mixer.update(clock.getDelta());
  // }

  //Make the eye move
  if (object && objToRender === "lookAtCursor") {
    //I've played with the constants here until it looked good 
    object.rotation.y = -3 + mouseX / window.innerWidth * 3;
    object.rotation.x = -1.2 + mouseY * 2.5 / window.innerHeight;
  }
  renderer.render(scene, camera);
}

//Add a listener to the window, so we can resize the window and the camera
window.addEventListener("resize", function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

//add mouse position listener, so we can make the eye move
document.onmousemove = (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
}
const DPR = window.devicePixelRatio;

const setRender = () => {
  renderer.shadowMap.enabled = true;
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(DPR);

  // GLTFLoader 将自动配置从 .gltf 或 .glb 文件引用的纹理。
  renderer.outputEncoding = THREE.sRGBEncoding;

  //是否使用物理上正确的光照模式。默认为false。
  // renderer.physicallyCorrectLights = true;

  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  // BakeShadows
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
};
export const generateVirtualLight = ({
  form = "rect",
  intensity = 1,
  color = "white",
  scale = [1, 1, 1],
  toneMapped = false,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  target,
}) => {
  scale =
    Array.isArray(scale) && scale.length === 2
      ? [scale[0], scale[1], 1]
      : scale;

  let geometry;
  if (form === "circle") {
    geometry = new THREE.RingGeometry(0, 1, 64);
  }
  if (form === "ring") {
    geometry = new THREE.RingGeometry(0.5, 1, 64);
  }
  if (form === "rect") {
    geometry = new THREE.PlaneGeometry();
  }

  const material = new THREE.MeshBasicMaterial({
    toneMapped: toneMapped,
    side: THREE.DoubleSide,
    color: color,
  });

  material.color.multiplyScalar(intensity);

  const mesh = new THREE.Mesh(geometry, material);
  Array.isArray(scale)
    ? mesh.scale.set(...scale)
    : mesh.scale.set(scale, scale, scale);

  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  if (target) {
    mesh.lookAt(new THREE.Vector3(...target));
  }
  return mesh;
};

export const createCustomMaterial = (colorA = "white", colorB = "black") => {
  const material = new LayerMaterial({
    color: "#444",
    layers: [
      new Depth({
        colorA: colorA,
        colorB: colorB,
        alpha: 0.5,
        mode: "normal",
        near: 0,
        far: 300,
        origin: new THREE.Vector3(100, 100, 100),
      }),
    ],
  });
  material.side = THREE.BackSide;
  return material;
};

const setEnvironment = (
  scene,
  resolution = 256,
  frames = 1,
  near = 1,
  far = 1000,
  background = false
) => {
  const fbo = new THREE.WebGLCubeRenderTarget(resolution);
  fbo.texture.type = THREE.HalfFloatType;
  const cubeCamera = new THREE.CubeCamera(near, far, fbo);

  virtualScene.add(cubeCamera);

  // 天花板灯
  const topLight = generateVirtualLight({
    intensity: 0.75,
    scale: [10, 10, 1],
    position: [0, 5, -9],
    rotation: [Math.PI / 2, 0, 0],
  });

  // 四周灯光
  const leftTopLight = generateVirtualLight({
    intensity: 4,
    scale: [20, 0.1, 1],
    position: [-5, 1, -1],
    rotation: [0, Math.PI / 2, 0],
  });
  const leftBottomLight = generateVirtualLight({
    intensity: 1,
    scale: [20, 0.5, 1],
    position: [-5, -1, -1],
    rotation: [0, Math.PI / 2, 0],
  });
  const rightTopLight = generateVirtualLight({
    intensity: 1,
    scale: [20, 1, 1],
    position: [10, 1, 0],
    rotation: [0, -Math.PI / 2, 0],
  });

  const floatLight = generateVirtualLight({
    form: "ring",
    color: "red",
    intensity: "1",
    scale: 10,
    position: [-15, 4, -18],
    target: [0, 0, 0],
  });

  virtualScene.add(topLight);
  virtualScene.add(leftTopLight);
  virtualScene.add(leftBottomLight);
  virtualScene.add(rightTopLight);
  virtualScene.add(floatLight);

  if (background !== "only") {
    scene.environment = fbo.texture;
  }
  if (background) {
    scene.background = fbo.texture;
  }

  // 模拟 MeshDepthMaterial 设置背景颜色，颜色不受光照影响

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = createCustomMaterial(backLightColor);

  virtualBackgroundMesh = new THREE.Mesh(geometry, material);
  virtualBackgroundMesh.scale.set(100, 100, 100);
  virtualScene.add(virtualBackgroundMesh);

  // 让环形网格运动起来
  // floatMesh({
  //   group: floatLight,
  //   speed: 5,
  //   rotationIntensity: 2,
  //   floatIntensity: 2,
  // });

  // 更新相机内容
  let count = 1;
  const virtualRender = () => {
    if (frames === Infinity || count < frames) {
      cubeCamera.update(renderer, virtualScene);
      count++;
    }
    requestAnimationFrame(virtualRender);
  };
  virtualRender();
};


setRender();
setEnvironment(scene, 256, Infinity);
//Start the 3D rendering
animate();

