import * as THREE from 'three';
import { GLTFLoader } from "../../utils/loaders/GLTFLoader.js";
import { DRACOLoader } from "../../utils/loaders/DRACOLoader.js";
import { OrbitControls } from "../../utils/controls/OrbitControls.js";
import { Depth, LayerMaterial } from "../../utils/vanilla/vanilla.js";


// let mixer;

// const clock = new THREE.Clock();
const container = document.getElementById( 'container3D' );

// const stats = new Stats();
// container.appendChild( stats.dom );

const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild( renderer.domElement );
 // GLTFLoader 将自动配置从 .gltf 或 .glb 文件引用的纹理。
 renderer.outputEncoding = THREE.sRGBEncoding;

 //是否使用物理上正确的光照模式。默认为false。
 // renderer.physicallyCorrectLights = true;

 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1;

 // BakeShadows
 renderer.shadowMap.autoUpdate = false;
 renderer.shadowMap.needsUpdate = true;

const pmremGenerator = new THREE.PMREMGenerator( renderer );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0xbfe3dd );
// scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;

const topLight = new THREE.DirectionalLight(0xffffff, 1); // (color, intensity)
topLight.position.set(0, 10, 10);
topLight.castShadow = true;
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0x404040, 1);
scene.add(ambientLight);

const camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 0.1, 3000);
camera.position.set( 5, 2, 8 );

const controls = new OrbitControls( camera, renderer.domElement );
controls.target.set( 0, 0.5, 0 );
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath( '../../utils/draco/' );

const loader = new GLTFLoader();
loader.setDRACOLoader( dracoLoader );
loader.load( 'models/metallic_showroom_gallery.glb', function ( gltf ) {

  const model = gltf.scene;
//   model.traverse(function (object) {
//     object.castShadow = true;
// });
  // model.position.set( 1, 1, 0 );
  // model.scale.set( 0.01, 0.01, 0.01 );
  scene.add( model );

  // mixer = new THREE.AnimationMixer( model );
  // mixer.clipAction( gltf.animations[ 0 ] ).play();

  renderer.setAnimationLoop( animate );

}, undefined, function ( e ) {

  console.error( e );

} );


window.onresize = function () {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

};


function animate() {

  // const delta = clock.getDelta();

  // mixer.update( delta );

  controls.update();

  // stats.update();

  renderer.render( scene, camera );

}