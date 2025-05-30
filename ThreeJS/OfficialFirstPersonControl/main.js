// import * as THREE from 'https://cdn.skypack.dev/three@0.136';
import * as THREE from 'three';

// import {FirstPersonControls} from 'https://cdn.skypack.dev/three@0.136/examples/jsm/controls/FirstPersonControls.js';
import { GLTFLoader } from "../utils/loaders/GLTFLoader.js";
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
let camera, scene, renderer, controls;

const objects = [];
let mixer;
let raycaster;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();
const color = new THREE.Color();
const gui = new dat.GUI();


init();

function init() {

  camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 1000 );
  camera.position.y = 10;

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xffffff );
  scene.fog = new THREE.Fog( 0xffffff, 0, 750 );

  const light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 0.5 );
  light.position.set( 0.5, 1, 0.75 );
  scene.add( light );

  new GLTFLoader().load('models/girl.glb', (gltf) => {
  const mesh = gltf.scene;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.traverse((child) => {
    if ( child.type == 'SkinnedMesh' ) {
      child.frustumCulled = false;
    } // https://discourse.threejs.org/t/help-3d-model-completely-disappears-when-the-camera-gets-close/17991/2
    if (child.material) {
      child.castShadow = true;
      child.receiveShadow = true;
      // child.material.envMapIntensity = 1;
    }

    mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction( gltf.animations[0]).play();
  });
  mesh.position.y = 0.9;
  mesh.scale.set(0.06,0.06,0.06);
  scene.add(mesh);

  const loader = new THREE.CubeTextureLoader();
  const texture = loader.load([
      './resources/skybox/posx.jpg',
      './resources/skybox/negx.jpg',
      './resources/skybox/posy.jpg',
      './resources/skybox/negy.jpg',
      './resources/skybox/posz.jpg',
      './resources/skybox/negz.jpg',
  ]);

    texture.encoding = THREE.sRGBEncoding;
    scene.background = texture;
    scene.environment = texture;

    const distance = 50.0;
    const angle = Math.PI / 4.0;
    const penumbra = 0.5;
    const decay = 1.0;

    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);  // makes real
    scene.add(directionalLight);
    directionalLight.position.set(50, 250, 0);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.bottom = -12;
    directionalLight.lookAt(0, 45, 0);

    const dLightHelper = new THREE.DirectionalLightHelper(directionalLight, 5);
    scene.add(dLightHelper);

    const lightFolder = gui.addFolder("Directional Light");

// Add controls for light position
const lightPosition = { x: 0, y: 0, z: 1 };
lightFolder.add(lightPosition, "x", -40, 40).onChange(() => {
  directionalLight.position.x = lightPosition.x;
});
lightFolder.add(lightPosition, "y", -40, 40).onChange(() => {
  directionalLight.position.y = lightPosition.y;
});
lightFolder.add(lightPosition, "z", -40, 40).onChange(() => {
  directionalLight.position.z = lightPosition.z;
});

// Add control for light intensity
lightFolder.add(directionalLight, "intensity", 0, 20);

// Open the GUI by default
gui.open();

//     let spotLight = new THREE.SpotLight(
//         0xFFFFFF, 100.0, distance, angle, penumbra, decay);
//         spotLight.castShadow = true;
//         spotLight.shadow.bias = -0.00001;
//         spotLight.shadow.mapSize.width = 4096;
//         spotLight.shadow.mapSize.height = 4096;
//         spotLight.shadow.camera.near = 1;
//         spotLight.shadow.camera.far = 1000;

//         spotLight.position.set(0, 145, 0);
//         spotLight.lookAt(0, 100, 0);
//     scene.add(spotLight);

//     const sLightHelper = new THREE.SpotLightHelper(spotLight);
// scene.add(sLightHelper);

    const upColour = 0xFFFF80;
    const downColour = 0x808080;
    let light = new THREE.HemisphereLight(upColour, downColour, 0.5);
    light.color.setHSL( 0.6, 1, 0.6 );
    light.groundColor.setHSL( 0.095, 1, 0.75 );
    light.position.set(0, 4, 0);
    scene.add(light);
});



//   initializeLights_() {
//     const distance = 50.0;
//     const angle = Math.PI / 4.0;
//     const penumbra = 0.5;
//     const decay = 1.0;

//     let light = new THREE.SpotLight(
//         0xFFFFFF, 100.0, distance, angle, penumbra, decay);
//     light.castShadow = true;
//     light.shadow.bias = -0.00001;
//     light.shadow.mapSize.width = 4096;
//     light.shadow.mapSize.height = 4096;
//     light.shadow.camera.near = 1;
//     light.shadow.camera.far = 100;

//     light.position.set(25, 25, 0);
//     light.lookAt(0, 0, 0);
//     this.scene_.add(light);

//     const upColour = 0xFFFF80;
//     const downColour = 0x808080;
//     light = new THREE.HemisphereLight(upColour, downColour, 0.5);
//     light.color.setHSL( 0.6, 1, 0.6 );
//     light.groundColor.setHSL( 0.095, 1, 0.75 );
//     light.position.set(0, 4, 0);
//     this.scene_.add(light);
//   }

  controls = new PointerLockControls( camera, document.body );

  const blocker = document.getElementById( 'blocker' );
  const instructions = document.getElementById( 'instructions' );

  instructions.addEventListener( 'click', function () {

    controls.lock();

  } );

  controls.addEventListener( 'lock', function () {

    instructions.style.display = 'none';
    blocker.style.display = 'none';

  } );

  controls.addEventListener( 'unlock', function () {

    blocker.style.display = 'block';
    instructions.style.display = '';

  } );

  document.addEventListener( "mousewheel",  function (event) {
    // console.log(event.deltaY)
    // camera.fov += 20 * event.deltaY/500; // zoomFactor
    // camera.updateProjectionMatrix();

    const targetFOV = camera.fov + 20 * event.deltaY / 100;
    
    new TWEEN.Tween(camera)
        .to({ fov: targetFOV }, 500) // duration in milliseconds
        .easing(TWEEN.Easing.Quadratic.InOut) // easing function for smooth transition
        .onUpdate(() => {
            camera.updateProjectionMatrix();
        })
        .start();

    // camera.position.z +=event.deltaY/500;
  });



  scene.add( controls.getObject() );

  const onKeyDown = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = true;
        break;

      case 'Space':
        if ( canJump === true ) velocity.y += 650;
        canJump = false;
        break;

    }

  };

  const onKeyUp = function ( event ) {

    switch ( event.code ) {

      case 'ArrowUp':
      case 'KeyW':
        moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        moveRight = false;
        break;

    }

  };

  document.addEventListener( 'keydown', onKeyDown );
  document.addEventListener( 'keyup', onKeyUp );

  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

  // floor

  let floorGeometry = new THREE.PlaneGeometry( 2000, 2000, 100, 100 );
  floorGeometry.rotateX( - Math.PI / 2 );

  // vertex displacement

  let position = floorGeometry.attributes.position;

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    vertex.fromBufferAttribute( position, i );

    vertex.x += Math.random() * 20 - 10;
    vertex.y += Math.random() * 2;
    vertex.z += Math.random() * 20 - 10;

    position.setXYZ( i, vertex.x, vertex.y, vertex.z );

  }

  floorGeometry = floorGeometry.toNonIndexed(); // ensure each face has unique vertices

  position = floorGeometry.attributes.position;
  const colorsFloor = [];

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );
    colorsFloor.push( color.r, color.g, color.b );

  }

  floorGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsFloor, 3 ) );

  const floorMaterial = new THREE.MeshBasicMaterial( { vertexColors: true } );

  const floor = new THREE.Mesh( floorGeometry, floorMaterial );
  scene.add( floor );

  // objects

  const boxGeometry = new THREE.BoxGeometry( 20, 20, 20 ).toNonIndexed();

  position = boxGeometry.attributes.position;
  const colorsBox = [];

  for ( let i = 0, l = position.count; i < l; i ++ ) {

    color.setHSL( Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );
    colorsBox.push( color.r, color.g, color.b );

  }

  boxGeometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colorsBox, 3 ) );

  for ( let i = 0; i < 500; i ++ ) {

    const boxMaterial = new THREE.MeshPhongMaterial( { specular: 0xffffff, flatShading: true, vertexColors: true } );
    boxMaterial.color.setHSL( Math.random() * 0.2 + 0.5, 0.75, Math.random() * 0.25 + 0.75, THREE.SRGBColorSpace );

    const box = new THREE.Mesh( boxGeometry, boxMaterial );
    box.position.x = Math.floor( Math.random() * 20 - 10 ) * 20;
    box.position.y = Math.floor( Math.random() * 20 ) * 20 + 10;
    box.position.z = Math.floor( Math.random() * 20 - 10 ) * 20;

    scene.add( box );
    objects.push( box );

  }

  //

  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setAnimationLoop( animate );
  document.body.appendChild( renderer.domElement );

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );

}
const clock = new THREE.Clock();

function animate() {
  TWEEN.update();
  const time = performance.now();

  if ( controls.isLocked === true ) {

    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    const intersections = raycaster.intersectObjects( objects, false );

    const onObject = intersections.length > 0;

    const delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    velocity.y -= 7.8 * 100.0 * delta; // 100.0 = mass 9.8

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveRight ) - Number( moveLeft );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) velocity.z -= direction.z * 400.0 * delta;
    if ( moveLeft || moveRight ) velocity.x -= direction.x * 400.0 * delta;

    if ( onObject === true ) {

      velocity.y = Math.max( 0, velocity.y );
      canJump = true;

    }

    controls.moveRight( - velocity.x * delta );
    controls.moveForward( - velocity.z * delta );

    controls.getObject().position.y += ( velocity.y * delta ); // new behavior

    if ( controls.getObject().position.y < 10 ) {

      velocity.y = 0;
      controls.getObject().position.y = 10;

      canJump = true;

    }

  }

  prevTime = time;
  const delta = clock.getDelta();
  if(mixer){
     mixer.update( delta );
  }
 
  renderer.render( scene, camera );

}


// const KEYS = {
//   'a': 65,
//   's': 83,
//   'w': 87,
//   'd': 68,
// };

// function clamp(x, a, b) {
//   return Math.min(Math.max(x, a), b);
// }

// class InputController {
//   constructor(target) {
//     this.target_ = target || document;
//     this.initialize_();    
//   }

//   initialize_() {
//     this.current_ = {
//       leftButton: false,
//       rightButton: false,
//       mouseXDelta: 0,
//       mouseYDelta: 0,
//       mouseX: 0,
//       mouseY: 0,
//     };
//     this.previous_ = null;
//     this.keys_ = {};
//     this.previousKeys_ = {};
//     this.target_.addEventListener('mousedown', (e) => this.onMouseDown_(e), false);
//     this.target_.addEventListener('mousemove', (e) => this.onMouseMove_(e), false);
//     this.target_.addEventListener('mouseup', (e) => this.onMouseUp_(e), false);
//     this.target_.addEventListener('keydown', (e) => this.onKeyDown_(e), false);
//     this.target_.addEventListener('keyup', (e) => this.onKeyUp_(e), false);
//   }

//   onMouseMove_(e) {
//     console.log(`output->`,e)
//     this.current_.mouseX = e.pageX - window.innerWidth / 2;
//     this.current_.mouseY = e.pageY - window.innerHeight / 2;
//     if (this.previous_ === null) {
//       this.previous_ = {...this.current_};
//     }

//     this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
//     this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;
//   }

//   onMouseDown_(e) {
//     this.onMouseMove_(e);

//     switch (e.button) {
//       case 0: {
//         this.current_.leftButton = true;
//         break;
//       }
//       case 2: {
//         this.current_.rightButton = true;
//         break;
//       }
//     }
//   }

//   onMouseUp_(e) {
//     this.onMouseMove_(e);

//     switch (e.button) {
//       case 0: {
//         this.current_.leftButton = false;
//         break;
//       }
//       case 2: {
//         this.current_.rightButton = false;
//         break;
//       }
//     }
//   }

//   onKeyDown_(e) {
//     this.keys_[e.keyCode] = true;
//   }

//   onKeyUp_(e) {
//     this.keys_[e.keyCode] = false;
//   }

//   key(keyCode) {
//     return !!this.keys_[keyCode];
//   }

//   isReady() {
//     return this.previous_ !== null;
//   }

//   update(_) {
//     if (this.previous_ !== null) {
//       this.current_.mouseXDelta = this.current_.mouseX - this.previous_.mouseX;
//       this.current_.mouseYDelta = this.current_.mouseY - this.previous_.mouseY;

//       this.previous_ = {...this.current_};
//     }
//   }
// };


// class FirstPersonCamera {
//   constructor(camera, objects) {
//     this.camera_ = camera;
//     this.input_ = new InputController();
//     this.rotation_ = new THREE.Quaternion();
//     this.translation_ = new THREE.Vector3(0, 2, 0);
//     this.phi_ = 0;
//     this.phiSpeed_ = 8;
//     this.theta_ = 0;
//     this.thetaSpeed_ = 5;
//     this.headBobActive_ = false;
//     this.headBobTimer_ = 0;
//     this.objects_ = objects;
//   }

//   update(timeElapsedS) {
//     this.updateRotation_(timeElapsedS);
//     this.updateCamera_(timeElapsedS);
//     this.updateTranslation_(timeElapsedS);
//     this.updateHeadBob_(timeElapsedS);
//     this.input_.update(timeElapsedS);
//   }

//   updateCamera_(_) {
//     this.camera_.quaternion.copy(this.rotation_);
//     this.camera_.position.copy(this.translation_);
//     this.camera_.position.y += Math.sin(this.headBobTimer_ * 10) * 0.1;

//     const forward = new THREE.Vector3(0, 0, -1);
//     forward.applyQuaternion(this.rotation_);

//     const dir = forward.clone();

//     forward.multiplyScalar(100);
//     forward.add(this.translation_);

//     let closest = forward;
//     const result = new THREE.Vector3();
//     const ray = new THREE.Ray(this.translation_, dir);
//     for (let i = 0; i < this.objects_.length; ++i) {
//       if (ray.intersectBox(this.objects_[i], result)) {
//         if (result.distanceTo(ray.origin) < closest.distanceTo(ray.origin)) {
//           closest = result.clone();
//         }
//       }
//     }

//     this.camera_.lookAt(closest);
//   }

//   updateHeadBob_(timeElapsedS) {
//     if (this.headBobActive_) {
//       const wavelength = Math.PI;
//       const nextStep = 1 + Math.floor(((this.headBobTimer_ + 0.000001) * 10) / wavelength);
//       const nextStepTime = nextStep * wavelength / 10;
//       this.headBobTimer_ = Math.min(this.headBobTimer_ + timeElapsedS, nextStepTime);

//       if (this.headBobTimer_ == nextStepTime) {
//         this.headBobActive_ = false;
//       }
//     }
//   }

//   updateTranslation_(timeElapsedS) {
//     const forwardVelocity = (this.input_.key(KEYS.w) ? 1 : 0) + (this.input_.key(KEYS.s) ? -1 : 0)
//     const strafeVelocity = (this.input_.key(KEYS.a) ? 1 : 0) + (this.input_.key(KEYS.d) ? -1 : 0)

//     const qx = new THREE.Quaternion();
//     qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);

//     const forward = new THREE.Vector3(0, 0, -1);
//     forward.applyQuaternion(qx);
//     forward.multiplyScalar(forwardVelocity * timeElapsedS * 10);

//     const left = new THREE.Vector3(-1, 0, 0);
//     left.applyQuaternion(qx);
//     left.multiplyScalar(strafeVelocity * timeElapsedS * 10);

//     this.translation_.add(forward);
//     this.translation_.add(left);

//     if (forwardVelocity != 0 || strafeVelocity != 0) {
//       this.headBobActive_ = true;
//     }
//   }

//   updateRotation_(timeElapsedS) {
//     const xh = this.input_.current_.mouseXDelta / window.innerWidth;
//     const yh = this.input_.current_.mouseYDelta / window.innerHeight;

//     this.phi_ += -xh * this.phiSpeed_;
//     this.theta_ = clamp(this.theta_ + -yh * this.thetaSpeed_, -Math.PI / 3, Math.PI / 3); // 上下
//     console.log(`output->`,this.phi_)

//     const qx = new THREE.Quaternion();
//     qx.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.phi_);
//     const qz = new THREE.Quaternion();
//     qz.setFromAxisAngle(new THREE.Vector3(1, 0, 0), this.theta_);

//     const q = new THREE.Quaternion();
//     q.multiply(qx);
//     q.multiply(qz);

//     this.rotation_.copy(q);
//   }
// }


// class FirstPersonCameraDemo {
//   constructor() {
//     this.initialize_();
//   }

//   initialize_() {
//     this.initializeRenderer_();
//     this.initializeLights_();
//     this.initializeScene_();
//     this.initializePostFX_();
//     this.initializeDemo_();

//     this.previousRAF_ = null;
//     this.raf_();
//     this.onWindowResize_();
//   }

//   initializeDemo_() {
//     // this.controls_ = new FirstPersonControls(
//     //     this.camera_, this.threejs_.domElement);
//     // this.controls_.lookSpeed = 0.8;
//     // this.controls_.movementSpeed = 5;

//     this.fpsCamera_ = new FirstPersonCamera(this.camera_, this.objects_);
//   }

//   initializeRenderer_() {
//     this.threejs_ = new THREE.WebGLRenderer({
//       antialias: false,
//     });
//     this.threejs_.shadowMap.enabled = true;
//     this.threejs_.shadowMap.type = THREE.PCFSoftShadowMap;
//     this.threejs_.setPixelRatio(window.devicePixelRatio);
//     this.threejs_.setSize(window.innerWidth, window.innerHeight);
//     this.threejs_.physicallyCorrectLights = true;
//     this.threejs_.outputEncoding = THREE.sRGBEncoding;

//     document.body.appendChild(this.threejs_.domElement);

//     window.addEventListener('resize', () => {
//       this.onWindowResize_();
//     }, false);

//     const fov = 60;
//     const aspect = 1920 / 1080;
//     const near = 1.0;
//     const far = 1000.0;
//     this.camera_ = new THREE.PerspectiveCamera(fov, aspect, near, far);
//     this.camera_.position.set(0, 2, 0);

//     this.scene_ = new THREE.Scene();

//     this.uiCamera_ = new THREE.OrthographicCamera(
//         -1, 1, 1 * aspect, -1 * aspect, 1, 1000);
//     this.uiScene_ = new THREE.Scene();
//   }

//   initializeScene_() {
//     const loader = new THREE.CubeTextureLoader();
//     const texture = loader.load([
//       './resources/skybox/posx.jpg',
//       './resources/skybox/negx.jpg',
//       './resources/skybox/posy.jpg',
//       './resources/skybox/negy.jpg',
//       './resources/skybox/posz.jpg',
//       './resources/skybox/negz.jpg',
//   ]);

//     texture.encoding = THREE.sRGBEncoding;
//     this.scene_.background = texture;
//     this.scene_.environment = texture;

//     const mapLoader = new THREE.TextureLoader();
//     const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();
//     const checkerboard = mapLoader.load('resources/checkerboard.png');
//     checkerboard.anisotropy = maxAnisotropy;
//     checkerboard.wrapS = THREE.RepeatWrapping;
//     checkerboard.wrapT = THREE.RepeatWrapping;
//     checkerboard.repeat.set(32, 32);
//     checkerboard.encoding = THREE.sRGBEncoding;

//     const plane = new THREE.Mesh(
//         new THREE.PlaneGeometry(100, 100, 10, 10),
//         new THREE.MeshStandardMaterial({map: checkerboard}));
//     plane.castShadow = false;
//     plane.receiveShadow = true;
//     plane.rotation.x = -Math.PI / 2;
//     this.scene_.add(plane);

//     const box = new THREE.Mesh(
//       new THREE.BoxGeometry(4, 4, 4),
//       this.loadMaterial_('vintage-tile1_', 0.2));
//     box.position.set(10, 2, 0);
//     box.castShadow = true;
//     box.receiveShadow = true;
//     this.scene_.add(box);

//     const concreteMaterial = this.loadMaterial_('concrete3-', 4);

//     const wall1 = new THREE.Mesh(
//       new THREE.BoxGeometry(100, 100, 4),
//       concreteMaterial);
//     wall1.position.set(0, -40, -50);
//     wall1.castShadow = true;
//     wall1.receiveShadow = true;
//     this.scene_.add(wall1);

//     const wall2 = new THREE.Mesh(
//       new THREE.BoxGeometry(100, 100, 4),
//       concreteMaterial);
//     wall2.position.set(0, -40, 50);
//     wall2.castShadow = true;
//     wall2.receiveShadow = true;
//     this.scene_.add(wall2);

//     const wall3 = new THREE.Mesh(
//       new THREE.BoxGeometry(4, 100, 100),
//       concreteMaterial);
//     wall3.position.set(50, -40, 0);
//     wall3.castShadow = true;
//     wall3.receiveShadow = true;
//     this.scene_.add(wall3);

//     const wall4 = new THREE.Mesh(
//       new THREE.BoxGeometry(4, 100, 100),
//       concreteMaterial);
//     wall4.position.set(-50, -40, 0);
//     wall4.castShadow = true;
//     wall4.receiveShadow = true;
//     this.scene_.add(wall4);

//     // Create Box3 for each mesh in the scene so that we can
//     // do some easy intersection tests.
//     const meshes = [
//       plane, box, wall1, wall2, wall3, wall4];

//     this.objects_ = [];

//     for (let i = 0; i < meshes.length; ++i) {
//       const b = new THREE.Box3();
//       b.setFromObject(meshes[i]);
//       this.objects_.push(b);
//     }

//     // Crosshair
//     const crosshair = mapLoader.load('resources/crosshair.png');
//     crosshair.anisotropy = maxAnisotropy;

//     this.sprite_ = new THREE.Sprite(
//       new THREE.SpriteMaterial({map: crosshair, color: 0xffffff, fog: false, depthTest: false, depthWrite: false}));
//     this.sprite_.scale.set(0.15, 0.15 * this.camera_.aspect, 1)
//     this.sprite_.position.set(0, 0, -10);

//     this.uiScene_.add(this.sprite_);

//     new GLTFLoader().load('models/girl.glb', (gltf) => {
//       const mesh = gltf.scene;
//       mesh.castShadow = true;
//       mesh.receiveShadow = true;
//       mesh.traverse((child) => {
//         if (child.material) {
//           child.castShadow = true;
//           child.receiveShadow = true;
//           // child.material.envMapIntensity = 1;
//         }
//       });
//       mesh.scale.set(0.02,0.02,0.02);
//       this.scene_.add(mesh);
//     });
//   }

//   initializeLights_() {
//     const distance = 50.0;
//     const angle = Math.PI / 4.0;
//     const penumbra = 0.5;
//     const decay = 1.0;

//     let light = new THREE.SpotLight(
//         0xFFFFFF, 100.0, distance, angle, penumbra, decay);
//     light.castShadow = true;
//     light.shadow.bias = -0.00001;
//     light.shadow.mapSize.width = 4096;
//     light.shadow.mapSize.height = 4096;
//     light.shadow.camera.near = 1;
//     light.shadow.camera.far = 100;

//     light.position.set(25, 25, 0);
//     light.lookAt(0, 0, 0);
//     this.scene_.add(light);

//     const upColour = 0xFFFF80;
//     const downColour = 0x808080;
//     light = new THREE.HemisphereLight(upColour, downColour, 0.5);
//     light.color.setHSL( 0.6, 1, 0.6 );
//     light.groundColor.setHSL( 0.095, 1, 0.75 );
//     light.position.set(0, 4, 0);
//     this.scene_.add(light);
//   }

//   loadMaterial_(name, tiling) {
//     const mapLoader = new THREE.TextureLoader();
//     const maxAnisotropy = this.threejs_.capabilities.getMaxAnisotropy();

//     const metalMap = mapLoader.load('resources/freepbr/' + name + 'metallic.png');
//     metalMap.anisotropy = maxAnisotropy;
//     metalMap.wrapS = THREE.RepeatWrapping;
//     metalMap.wrapT = THREE.RepeatWrapping;
//     metalMap.repeat.set(tiling, tiling);

//     const albedo = mapLoader.load('resources/freepbr/' + name + 'albedo.png');
//     albedo.anisotropy = maxAnisotropy;
//     albedo.wrapS = THREE.RepeatWrapping;
//     albedo.wrapT = THREE.RepeatWrapping;
//     albedo.repeat.set(tiling, tiling);
//     albedo.encoding = THREE.sRGBEncoding;

//     const normalMap = mapLoader.load('resources/freepbr/' + name + 'normal.png');
//     normalMap.anisotropy = maxAnisotropy;
//     normalMap.wrapS = THREE.RepeatWrapping;
//     normalMap.wrapT = THREE.RepeatWrapping;
//     normalMap.repeat.set(tiling, tiling);

//     const roughnessMap = mapLoader.load('resources/freepbr/' + name + 'roughness.png');
//     roughnessMap.anisotropy = maxAnisotropy;
//     roughnessMap.wrapS = THREE.RepeatWrapping;
//     roughnessMap.wrapT = THREE.RepeatWrapping;
//     roughnessMap.repeat.set(tiling, tiling);

//     const material = new THREE.MeshStandardMaterial({
//       metalnessMap: metalMap,
//       map: albedo,
//       normalMap: normalMap,
//       roughnessMap: roughnessMap,
//     });

//     return material;
//   }

//   initializePostFX_() {
//   }

//   onWindowResize_() {
//     this.camera_.aspect = window.innerWidth / window.innerHeight;
//     this.camera_.updateProjectionMatrix();

//     this.uiCamera_.left = -this.camera_.aspect;
//     this.uiCamera_.right = this.camera_.aspect;
//     this.uiCamera_.updateProjectionMatrix();

//     this.threejs_.setSize(window.innerWidth, window.innerHeight);
//   }

//   raf_() {
//     requestAnimationFrame((t) => {
//       if (this.previousRAF_ === null) {
//         this.previousRAF_ = t;
//       }

//       this.step_(t - this.previousRAF_);
//       this.threejs_.autoClear = true;
//       this.threejs_.render(this.scene_, this.camera_);
//       this.threejs_.autoClear = false;
//       this.threejs_.render(this.uiScene_, this.uiCamera_);
//       this.previousRAF_ = t;
//       this.raf_();
//     });
//   }

//   step_(timeElapsed) {
//     const timeElapsedS = timeElapsed * 0.001;

//     // this.controls_.update(timeElapsedS);
//     this.fpsCamera_.update(timeElapsedS);
//   }
// }


// let _APP = null;

// window.addEventListener('DOMContentLoaded', () => {
//   _APP = new FirstPersonCameraDemo();
// });
