// =========================
// 基础 Three.js 设置
// =========================
const scene = new THREE.Scene();
let clock = new THREE.Clock();
// 虚拟场景对象
let virtualScene = new THREE.Scene();
const offset = Math.random() * 10;
let g_uniforms = {
  u_time: { value: clock.getElapsedTime() }
}
	
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 3);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.update();


// =========================
// 主灯光
// =========================
function addMainLights() {
  const topLight = new THREE.DirectionalLight(0xffffff, 2);
  topLight.position.set(10, 10, 10);
  topLight.castShadow = true;

  const ambient = new THREE.AmbientLight(0x404040, 0.2);

  scene.add(topLight, ambient);
}
addMainLights();


// =========================
// SpotLight（你原来的）
// =========================
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
addSpotLight();


// =========================
// BigSpotLight + Floor
// =========================
function addBigSpotLightAndFloor() {
  const floorGeo = new THREE.PlaneGeometry(200, 200);
  const floorMat = new THREE.MeshPhongMaterial({
    color: "#ff0000",
    emissive: "#ac0000",
    side: THREE.DoubleSide
  });

  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const bigSpot = new THREE.SpotLight("#ffffff", 2);
  bigSpot.angle = Math.PI / 8;
  bigSpot.penumbra = 0.2;
  bigSpot.decay = 2;
  bigSpot.distance = 30;
  bigSpot.position.set(0, 10, 0);

  scene.add(bigSpot.target);
  scene.add(bigSpot);
}
addBigSpotLightAndFloor();


// =========================
// 虚拟灯光（发光平面）
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

/**
 * 设置灯光的运动轨迹
 * @param clock
 * @param group 光斑组
 */

function spotAnimate(clock, group){
	const t = clock.getElapsedTime();
  // group.position.z += clock.getDelta() * 15;
  // if (group.position.z > 60) {
    // group.position.z = -60;
  // }
  const maxAngle = Math.PI / 6; // 30° // sin 波来回摆动 
  group.rotation.y = Math.sin(t * 0.8) * maxAngle;
  group.rotation.x = Math.sin(t * 0.8) * maxAngle;
  requestAnimationFrame(() => {
    spotAnimate(clock, group);
  });
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
  const topLight = createVirtualLight({intensity: 0.75, scale: [10, 10, 1], position: [0, 5, -9], rotation: [Math.PI / 2, 0, 0], });

  // 四周灯光
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

  // 模拟 MeshDepthMaterial 设置背景颜色，颜色不受光照影响

  const geometry = new THREE.SphereGeometry(1, 64, 64);
  const material = createCustomMaterial("#ff0000");

  virtualBackgroundMesh = new THREE.Mesh(geometry, material);
  virtualBackgroundMesh.scale.set(100, 100, 100);
  virtualScene.add(virtualBackgroundMesh);

  // 让环形网格运动起来
  floatMesh({
    group: floatLight,
    speed: 5,
    rotationIntensity: 2,
    floatIntensity: 2,
  });
	
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
/**
 * 车身设置移动的光斑
 * @param virtualScene
 */
function setMovingSpot(virtualScene) {
  const groupWrap = new THREE.Group();   // 整体旋转
  const group = new THREE.Group();       // 灯光容器
  const sceneGroup = new THREE.Group();
  const clock = new THREE.Clock();

  const lightCount = 8;      // 灯数量
  const radius = 6;          // 环绕半径
  const height = 4;          // 灯光高度

  for (let i = 0; i < lightCount; i++) {
    const angle = (i / lightCount) * Math.PI * 2; // 均匀分布在圆周上

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    const lightOptions = {
      form: "circle",
      intensity: 4,
      scale: [3, 1, 1],
      position: [x, height, z],
    };

    const circleLight = createVirtualLight(lightOptions);

    // 朝向圆心（车的位置）
    circleLight.lookAt(0, 1, 0);

    group.add(circleLight);
    const circleLight2 = circleLight.clone(); // 克隆一份给主场景，不能有俩爹
	circleLight2.isHelper = true;
    sceneGroup.add(circleLight2);
  }
  scene.add(sceneGroup);
  groupWrap.add(group);
  virtualScene.add(groupWrap);
  spotAnimate(clock, group);
  spotAnimate(new THREE.Clock(), sceneGroup);
}

function changModel(model, nodeName, options){
  model.materials[nodeName].setValues(options);
};
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
};

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
};

// function addVirtualLights() {
	
  // const floatLight  = createVirtualLight({ form: "ring", color: "red", intensity: "1", scale: [4, 4, 4], position: [-10, 6, -6], target: [0, 0, 0], });
  // const floatLight2 = createVirtualLight({ form: "ring", color: "green", intensity: "1", scale: [4, 4, 4], position: [10, 6, -6], target: [0, 0, 0], });
  
  // scene.add(
    // createVirtualLight({ intensity: 4, scale: [20, 0.1, 1], position: [-5, 1, -1], rotation: [0, Math.PI/2, 0] }),
    // createVirtualLight({ intensity: 1, scale: [20, 0.5, 1], position: [-5, -1, -1], rotation: [0, Math.PI/2, 0] }),
    // createVirtualLight({ intensity: 1, scale: [20, 1, 1],   position: [10, 1, 0], rotation: [0, -Math.PI/2, 0] }),
	// floatLight,
	// floatLight2
  // );
  
  // // 让环形网格运动起来
  // floatMesh({ group: floatLight,  speed: 5, rotationIntensity: 2, floatIntensity: 2, });
  // floatMesh({ group: floatLight2, speed: 5, rotationIntensity: 2, floatIntensity: 2, });
// }
// addVirtualLights();
const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);


// =========================
// 弯曲背景板
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


scene.add(createCurvedBackdrop());


// =========================
// 虚拟背景球（Depth Layer）
// =========================
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
scene.add(createVirtualSphere());


// =========================
// 灯光辅助线（不同颜色 + 自动识别）
// =========================
let lightHelpersVisible = true;

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
addLightHelpers(scene);


// =========================
// 辅助线开关（按 T）
// =========================
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


// =========================
// GLTF 模型加载（文件输入）
// =========================
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(ev) {
    const contents = ev.target.result;
    const loader = new THREE.GLTFLoader();

    loader.parse(contents, "", (gltf) => {
      scene.add(gltf.scene);
    });
  };

  reader.readAsArrayBuffer(file);
});


// =========================
// HDR 环境贴图加载
// =========================
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


// =========================
// 动画循环（SpotLightHelper 需要更新）
// =========================
function animate() {
  requestAnimationFrame(animate);

  scene.traverse((obj) => {
    if (obj.isSpotLight && obj.helper) obj.helper.update();
  });

  g_uniforms.u_time.value = clock.getElapsedTime();
  renderer.render(scene, camera);
}
animate();
// 设置 HDR环境（模拟HDR贴图）
setEnvironment(scene, 256, Infinity);
// 设置运动光源，获得打光效果
setMovingSpot(virtualScene);

// =========================
// 响应式窗口
// =========================
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
