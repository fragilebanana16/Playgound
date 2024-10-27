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

//Create a Three.JS Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbbbbbb)
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
const model = await gltfLoader.loadAsync("models/lamborghini_centenario_roadster_sdc.glb");
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

const topLight = new THREE.DirectionalLight(0xffffff, 10); // (color, intensity)
topLight.position.set(10, 10, 10);
topLight.castShadow = true;
scene.add(topLight);

// for testing light
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // 使用 MeshStandardMaterial
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

const ambientLight = new THREE.AmbientLight(0x404040, 40);
scene.add(ambientLight);

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

//Start the 3D rendering
animate();