import * as THREE from 'three';
import { GLTFLoader } from "../../utils/loaders/GLTFLoader.js";
import { DRACOLoader } from "../../utils/loaders/DRACOLoader.js";
import { OrbitControls } from "../../utils/controls/OrbitControls.js";
import { RGBELoader } from 'https://unpkg.com/three@0.149.0/examples/jsm/loaders/RGBELoader.js';
const hdrTextureURL = new URL('../models/sunny_prairie_expanse_2k.hdr', import.meta.url) // sunny_prairie_expanse_2k berlin_riverside_4k
let mixer;
// ======================= loading progress ===================================
const loadingManager = new THREE.LoadingManager();

loadingManager.onStart = function(url, item, total) {
  console.log( 'Started loading file: ' + url + '.\nLoaded ' + item + ' of ' + total + ' files.' );
}

const progressBar = document.getElementById('progress-bar');

loadingManager.onProgress = function(url, loaded, total) {
    progressBar.value = (loaded / total) * 100;
    console.log( 'Loading file: ' + url + '.\nLoaded ' + loaded + ' of ' + total + ' files.' );
}

const progressBarContainer = document.querySelector('.progress-bar-container');

loadingManager.onLoad = function() {
    progressBarContainer.style.display = 'none';
}

// loadingManager.onError = function(url) {
//     console.error(`Got a problem loading: ${url}`);
// }
// ======================= loading progress ===================================

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background.
renderer.setClearColor(0xFEFEFE);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Sets orbit control to move the camera around.
const orbit = new OrbitControls(camera, renderer.domElement);

// Camera positioning.
camera.position.set(6, 8, 14);
// Has to be done everytime we update the camera position.
orbit.update();

renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

// hdr environment set up
const hdriLoader = new RGBELoader(loadingManager)
hdriLoader.load(hdrTextureURL, function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture; // just like background image, if not provided, it looks like a dark box
  scene.environment = texture; // material can get light from environment but not neccessarily need a light

  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1, 50, 50), 
  new THREE.MeshStandardMaterial({roughness: 0, metalness: 0.5})); // or inparam use envMap: texture for only this mesh
  scene.add(sphere);
});

// load model
new GLTFLoader(loadingManager).load('models/girl.glb', (gltf) => {
  const mesh = gltf.scene;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.traverse((child) => {
    if ( child.type == 'SkinnedMesh' ) {
      child.frustumCulled = false;
    }
    if (child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      // child.material.envMapIntensity = 1;
    }

    mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction( gltf.animations[0]).play();
  });
  // mesh.position.y = 0.9;
  mesh.scale.set(0.06,0.06,0.06);
  scene.add(mesh);
});


// Creates a 12 by 12 grid helper.
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

// Creates an axes helper with an axis length of 4.
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

const clock = new THREE.Clock();
function animate() {
    const delta = clock.getDelta();
    if(mixer){
      mixer.update( delta );
    }

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});