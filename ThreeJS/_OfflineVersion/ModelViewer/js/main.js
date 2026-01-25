// =========================
// 1. 全局变量 & 基础配置
// =========================
let scene, camera, renderer, controls;
let virtualScene = new THREE.Scene();

let clock = new THREE.Clock();
let boxPoints = {};
let box = {};
let model;

let cameraTargetPos = new THREE.Vector3();
const cameraInfo = { x: 0, y: 0, z: 0 };

const gui = new dat.GUI();
gui.add(cameraInfo, 'x').listen();
gui.add(cameraInfo, 'y').listen();
gui.add(cameraInfo, 'z').listen();

const offset = Math.random() * 10;
let g_uniforms = {
  u_time: { value: clock.getElapsedTime() }
};

let lightHelpersVisible = false;
let virtualBackgroundMesh;

let stopID;
const clock1 = new THREE.Clock();
let cameraX, cameraZ;

const points = [];
const geometry = new THREE.BufferGeometry();
const material = new THREE.LineBasicMaterial({ color: 0x00ff00 });
const line = new THREE.Line(geometry, material);


// =========================
// 2. 初始化基础场景
// =========================
function initBase() {
  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.update();

  scene.add(line);

  const axesHelper = new THREE.AxesHelper(5);
  axesHelper.visible = false;
  axesHelper.isHelper = true;
  scene.add(axesHelper);
}


// =========================
// 3. 灯光系统
// =========================
function addMainLights() {
  const topLight = new THREE.DirectionalLight(0xffffff, 2);
  topLight.position.set(10, 10, 10);
  topLight.castShadow = true;

  const ambient = new THREE.AmbientLight(0x404040, 0.2);

  scene.add(topLight, ambient);
}

function addSpotLight() {
  const spotLight = new THREE.SpotLight(0xffffff, 2);
  spotLight.position.set(0, 15, 0);
  spotLight.penumbra = 1;
  spotLight.angle = 0.3;
  spotLight.castShadow = true;
  spotLight.shadow.bias = -0.0001;

  spotLight.target.position.set(0, 0, 6);
  scene.add(spotLight.target);
  scene.add(spotLight);
}

function addBigSpotLightAndFloor() {
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshPhongMaterial({
    color: "#000000",
    emissive: "#000000",
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.02;
  floor.receiveShadow = true;
  scene.add(floor);

  // const bigSpot = new THREE.SpotLight("#ffffff", 2);
  // bigSpot.angle = Math.PI / 8;
  // bigSpot.penumbra = 0.2;
  // bigSpot.decay = 2;
  // bigSpot.distance = 30;
  // bigSpot.position.set(0, 10, 0);

  // scene.add(bigSpot.target);
  // scene.add(bigSpot);
}

function addLightHelpers(scene) {
  const colors = {
    directional: 0xff4444,
    point:       0x44ff44,
    spot:        0x4444ff,
    hemi:        0xffff44,
    rect:        0xff44ff
  };

  scene.traverse((obj) => {
    let helper = null;

    if (obj.isDirectionalLight) {
      helper = new THREE.DirectionalLightHelper(obj, 3, colors.directional);
    }

    if (obj.isPointLight) {
      helper = new THREE.PointLightHelper(obj, 1, colors.point);
    }

    if (obj.isSpotLight) {
      helper = new THREE.SpotLightHelper(obj, colors.spot);
    }

    if (obj.isHemisphereLight) {
      helper = new THREE.HemisphereLightHelper(obj, 3);
      helper.material.color.setHex(colors.hemi);
    }

    if (obj.isRectAreaLight) {
      helper = new THREE.RectAreaLightHelper(obj);
      helper.color = new THREE.Color(colors.rect);
    }

    if (helper) {
      obj.helper = helper;
      helper.visible = lightHelpersVisible;
      scene.add(helper);
    }
  });
}


// =========================
// 4. 虚拟灯光 & 环境
// =========================
function createVirtualLight({ form = "rect", intensity = 1, color = "white", scale = [1,1,1], position=[0,0,0], rotation=[0,0,0], target }) {
  const geometry =
    form === "circle" ? new THREE.RingGeometry(0, 1, 64) :
    form === "ring"   ? new THREE.RingGeometry(0.8, 1, 64) :
                        new THREE.PlaneGeometry();

  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  material.color.multiplyScalar(intensity);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);

  if (target) mesh.lookAt(new THREE.Vector3(...target));

  return mesh;
}

function spotAnimate(clock, group){
  const t = clock.getElapsedTime();
  const maxAngle = Math.PI / 6;
  group.rotation.y = Math.sin(t * 0.8) * maxAngle;
  group.rotation.x = Math.sin(t * 0.8) * maxAngle;
  requestAnimationFrame(() => {
    spotAnimate(clock, group);
  });
}

function floatMesh({
  group,
  speed = 1,
  rotationIntensity = 1,
  floatIntensity = 1,
}){
  const t = offset + clock.getElapsedTime();
  group.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
  group.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
  group.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
  group.position.y = ((Math.sin((t / 4) * speed)  + 2) * 2) * floatIntensity;
  requestAnimationFrame(() => {
    floatMesh({ group, speed, rotationIntensity, floatIntensity });
  });
}

function setEnvironment(
  scene,
  resolution = 256,
  frames = 1,
  near = 1,
  far = 1000,
  background = false
) {
  const fbo = new THREE.WebGLCubeRenderTarget(resolution);
  fbo.texture.type = THREE.HalfFloatType;
  const cubeCamera = new THREE.CubeCamera(near, far, fbo);

  virtualScene.add(cubeCamera);

  const topLight = createVirtualLight({intensity: 0.75, scale: [10, 10, 1], position: [0, 5, -9], rotation: [Math.PI / 2, 0, 0], });

  const leftTopLight = createVirtualLight({ intensity: 4, scale: [20, 0.1, 1], position: [-5, 1, -1], rotation: [0, Math.PI / 2, 0], });
  const leftBottomLight = createVirtualLight({ intensity: 1, scale: [20, 0.5, 1], position: [-5, -1, -1], rotation: [0, Math.PI / 2, 0], });
  const rightTopLight = createVirtualLight({ intensity: 1, scale: [20, 1, 1], position: [10, 1, 0], rotation: [0, -Math.PI / 2, 0], });
  const floatLight = createVirtualLight({ form: "ring", color: "red", intensity: "1", scale: [10, 1, 1], position: [-15, 4, -18], target: [0, 0, 0], });

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

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = createCustomMaterial("#ff0000");

  virtualBackgroundMesh = new THREE.Mesh(geometry, material);
  virtualBackgroundMesh.scale.set(100, 100, 100);
  virtualScene.add(virtualBackgroundMesh);

  floatMesh({
    group: floatLight,
    speed: 5,
    rotationIntensity: 2,
    floatIntensity: 2,
  });

  let count = 1;
  const virtualRender = () => {
    if (frames === Infinity || count < frames) {
      cubeCamera.update(renderer, virtualScene);
      count++;
    }
    requestAnimationFrame(virtualRender);
  };
  virtualRender();
}

function setMovingSpot(virtualScene) {
  const groupWrap = new THREE.Group();
  const group = new THREE.Group();
  const sceneGroup = new THREE.Group();
  const clock = new THREE.Clock();

  const lightCount = 8;
  const radius = 6;
  const height = 4;

  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2;

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const lightOptions = {
      form: "circle",
      intensity: 4,
      scale: [3, 1, 1],
      position: [x, height, z],
    };

    const circleLight = createVirtualLight(lightOptions);

    circleLight.lookAt(0, 1, 0);

    group.add(circleLight);
    const circleLight2 = circleLight.clone();
    circleLight2.isHelper = true;
    sceneGroup.add(circleLight2);
  }

  groupWrap.add(group);
  virtualScene.add(groupWrap);
  spotAnimate(clock, group);
  spotAnimate(new THREE.Clock(), sceneGroup);
}


// =========================
// 5. 背景 & Shader & Layer
// =========================
function createCurvedBackdrop() {
  const radius = 25;
  const height = 18;
  const arc = Math.PI * 0.4;

  const geometry = new THREE.CylinderGeometry(
    radius, radius, height, 64, 1, true, -arc / 2, arc
  );
  geometry.rotateY(Math.PI);

  const material = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: false,
    uniforms: g_uniforms,
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float u_time;
      varying vec2 vUv;

      void main() {
        float wave = sin(vUv.y * 10.0 + u_time * 3.0) * 0.5 + 0.5;
        vec3 color = mix(vec3(0.1, 0.4, 1.0), vec3(1.0, 0.2, 0.5), wave);
        gl_FragColor = vec4(color, 1.0);
      }
    `
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 10);
  mesh.isShaderBackdrop = true;

  return mesh;
}

function createCustomMaterial(colorB = "black") {
  const material = new LayerMaterial({
    layers: [
      new Depth({
        colorA: "#ffffff",
        colorB,
        alpha: 0.5,
        near: 0,
        far: 300,
        origin: new THREE.Vector3(100, 100, 100)
      })
    ]
  });

  material.side = THREE.BackSide;
  return material;
}

function createVirtualSphere() {
  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = createCustomMaterial("#2de8cd");

  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.set(100, 100, 100);

  return mesh;
}


// =========================
// 6. 模型材质定制
// =========================
function changModel(model, nodeName, options){
  model.materials[nodeName].setValues(options);
}

function customModel(){
  changModel(model, "rubber", {
    color: "#222",
    roughness: 0.6,
    roughnessMap: null,
    normalScale: [4, 4],
  });
  changModel(model, "window", {
    color: "black",
    roughness: 0,
    clearcoat: 0.1,
  });
  changModel(model, "coat", {
    color: "#2f426f",
    envMapIntensity: 4,
  });

  changModel(model, "paint", {
    roughness: 0.5,
    metalness: 0.8,
    envMapIntensity: 2,
  });
}


// =========================
// 7. 模型加载 & 包围盒 & GUI
// =========================
function setupCameraGUI() {
  const guiParams = {
    point: "p3"
  };

  gui.add(guiParams, "point", Object.keys(boxPoints))
    .name("Camera Point")
    .onChange((value) => {
      const pos = boxPoints[value];
      const dirOffset = value == 'p3' || value == 'p7' ? -0.4 : 0.4;
      cameraTargetPos.set(pos.x + 0.2, pos.y - 0.6, pos.z + dirOffset);
    });
}

function loadModelFromFile(file) {
  const reader = new FileReader();
  reader.onload = function(ev) {
    const contents = ev.target.result;
    const loader = new THREE.GLTFLoader();

    loader.parse(contents, "", (gltf) => {
      scene.add(gltf.scene);
      model = gltf.scene;

      box = new THREE.Box3().setFromObject(model);
      const min = box.min;
      const max = box.max;

      boxPoints = {
        p3: new THREE.Vector3(min.x, max.y, min.z),
        p4: new THREE.Vector3(min.x, max.y, max.z),
        p7: new THREE.Vector3(max.x, max.y, min.z),
        p8: new THREE.Vector3(max.x, max.y, max.z),
      };

      const helper = new THREE.Box3Helper(box, 0xff0000);
      scene.add(helper);

      setupCameraGUI();
      setCameraAnimate();
    });
  };

  reader.readAsArrayBuffer(file);
}


// =========================
// 8. 相机动画（汽车视角）
// =========================
function setCameraAnimate() {
  const mid = new THREE.Vector3().copy(cameraTargetPos);
  mid.y += 0.4;
  camera.position.lerp(mid, 0.01);

  camera.position.lerp(cameraTargetPos, 0.01);

  const center = box.getCenter(new THREE.Vector3());
  camera.lookAt(center);

  const t = clock1.getElapsedTime();
  const theta = t / 6;

  const newx = 14 * Math.sin(theta);
  const newy = 14 * Math.cos(theta);

  cameraX = newx < -10 ? cameraX : newx;
  cameraZ = newy < -10 ? cameraZ : newy;

  const target = new THREE.Vector3(cameraX, 0.5, cameraZ);

  points.push(target.clone());
  geometry.setFromPoints(points);

  requestAnimationFrame(setCameraAnimate);
}

function updateBoxPosView(guiParams) {
  const selected = guiParams.point;
  const pos = boxPoints[selected];

  camera.position.copy(pos);
  camera.lookAt(box.getCenter(new THREE.Vector3()));
}


// =========================
// 9. HDR 环境贴图加载
// =========================
function setupHDRInput() {
  document.getElementById("hdrInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(ev) {
      const buffer = ev.target.result;

      const loader = new THREE.RGBELoader();
      const hdr = loader.parse(buffer);

      const texture = new THREE.DataTexture(
        hdr.data, hdr.width, hdr.height, THREE.RGBAFormat, hdr.type
      );

      texture.needsUpdate = true;
      texture.mapping = THREE.EquirectangularReflectionMapping;

      const pmrem = new THREE.PMREMGenerator(renderer);
      const envMap = pmrem.fromEquirectangular(texture).texture;

      scene.environment = envMap;
      scene.background = envMap;

      pmrem.dispose();
      texture.dispose();
    };

    reader.readAsArrayBuffer(file);
  });
}


// =========================
// 10. 键盘事件 & 窗口自适应
// =========================
function setupKeyEvents() {
  window.addEventListener("keydown", (e) => {
    if (e.key.toLowerCase() === "t") {
      lightHelpersVisible = !lightHelpersVisible;

      scene.traverse((obj) => {
        if (obj.helper) obj.helper.visible = lightHelpersVisible;
        if (obj.isHelper) obj.visible = lightHelpersVisible;
      });

      console.log("灯光辅助线:", lightHelpersVisible ? "开启" : "关闭");
    }
  });
}

function setupResize() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}


// =========================
// 11. 主动画循环
// =========================
function animate() {
  requestAnimationFrame(animate);

  scene.traverse((obj) => {
    if (obj.isSpotLight && obj.helper) obj.helper.update();
  });

  cameraInfo.x = camera.position.x;
  cameraInfo.y = camera.position.y;
  cameraInfo.z = camera.position.z;

  g_uniforms.u_time.value = clock.getElapsedTime();

  renderer.render(scene, camera);
}


// =========================
// 12. 主入口
// =========================
function main() {
  initBase();
  addMainLights();
  addSpotLight();
  addBigSpotLightAndFloor();
  addLightHelpers(scene);

  scene.add(createVirtualSphere());
  // scene.add(createCurvedBackdrop());

  animate();

  setEnvironment(scene, 256, Infinity);
  setMovingSpot(virtualScene);

  setupHDRInput();
  setupKeyEvents();
  setupResize();

  document.getElementById("fileInput").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadModelFromFile(file);
  });
}

main();
