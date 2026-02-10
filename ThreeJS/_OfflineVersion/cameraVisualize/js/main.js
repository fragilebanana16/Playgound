// =========================
// 主相机（Scene View）
// =========================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);

const sceneCamera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
sceneCamera.position.set(12, 10, 12);
sceneCamera.lookAt(0, 0, 0);

let activeCamera = sceneCamera; // 当前用于渲染的相机

const controls = new THREE.OrbitControls(sceneCamera, renderer.domElement);

// =========================
// 相机模型
// =========================
function createCameraModel(color) {
  const geom = new THREE.ConeGeometry(0.3, 0.6, 4);
  const mat = new THREE.MeshBasicMaterial({ color });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = Math.PI / 2;
  return mesh;
}

// =========================
// 三个可编辑相机
// =========================
const perspCam = new THREE.PerspectiveCamera(60, 1, 0.1, 50);
perspCam.position.set(4, 2, 4);
perspCam.lookAt(0, 0, 0);
const perspModel = createCameraModel(0xffcc00);
const perspHelper = new THREE.CameraHelper(perspCam);

let orthoSize = 3;
const orthoCam = new THREE.OrthographicCamera(
  -orthoSize, orthoSize, orthoSize, -orthoSize, 0.1, 10
);
orthoCam.position.set(0, 0,2);
orthoCam.lookAt(0, 0, 0);
const orthoModel = createCameraModel(0x00ccff);
const orthoHelper = new THREE.CameraHelper(orthoCam);

const isoCam = new THREE.PerspectiveCamera(60, 1, 0.1, 50);
isoCam.position.set(0, 5, -5);
isoCam.lookAt(0, 0, 0);
const isoModel = createCameraModel(0xff00ff);
const isoHelper = new THREE.CameraHelper(isoCam);

// 当前被编辑的相机
let targetCam = perspCam;
let targetModel = perspModel;
let targetHelper = perspHelper;

// =========================
// 场景内容
// =========================
const axes = new THREE.AxesHelper(5);
axes.position.y = 0.01;
scene.add(axes);

const grid = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
grid.position.y = -0.01;
scene.add(grid);

const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshNormalMaterial()
);
scene.add(cube);
// =========================
// 全屏 Quad（2×2 Plane）
// =========================
const quadMat = new THREE.MeshBasicMaterial({ color: 0x44aa88, wireframe: true });
const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), quadMat);
quad.position.set(0, 0, 0); // 抬高一点
scene.add(quad);

// =========================
// Helper 显示控制
// =========================
function updateCameraVisibility() {
  // 全部隐藏
  perspModel.visible = false;
  perspHelper.visible = false;

  orthoModel.visible = false;
  orthoHelper.visible = false;

  isoModel.visible = false;
  isoHelper.visible = false;

  // 只显示当前被编辑的相机
  targetModel.visible = true;
  targetHelper.visible = true;

  // 添加到场景（避免重复添加）
  if (!scene.children.includes(targetModel)) scene.add(targetModel);
  if (!scene.children.includes(targetHelper)) scene.add(targetHelper);
}

// 初始化
updateCameraVisibility();

// =========================
// dat.GUI
// =========================
const gui = new dat.GUI();

const params = {
  target: "Perspective Camera",
  fov: targetCam.fov,
  near: targetCam.near,
  far: targetCam.far,
  orthoSize: orthoSize,
  posX: targetCam.position.x,
  posY: targetCam.position.y,
  posZ: targetCam.position.z,

  jumpToView: () => {
    activeCamera = targetCam;
  },

  exitView: () => {
    activeCamera = sceneCamera;
  }
};

// 选择要编辑的相机
gui.add(params, "target", [
  "Perspective Camera",
  "Orthographic Camera",
  "Isometric Camera"
]).name("Edit Camera").onChange((v) => {
  if (v === "Perspective Camera") {
    targetCam = perspCam;
    targetModel = perspModel;
    targetHelper = perspHelper;
  } else if (v === "Orthographic Camera") {
    targetCam = orthoCam;
    targetModel = orthoModel;
    targetHelper = orthoHelper;
  } else {
    targetCam = isoCam;
    targetModel = isoModel;
    targetHelper = isoHelper;
  }

  params.fov = targetCam.fov || params.fov;
  params.near = targetCam.near;
  params.far = targetCam.far;
  params.posX = targetCam.position.x;
  params.posY = targetCam.position.y;
  params.posZ = targetCam.position.z;

  updateCameraVisibility();
});

// 跳转 / 退出
gui.add(params, "jumpToView").name("Jump To This Camera");
gui.add(params, "exitView").name("Exit Camera View");

// FOV
gui.add(params, "fov", 10, 120, 1).name("FOV").onChange((v) => {
  if (targetCam.isPerspectiveCamera) {
    targetCam.fov = v;
    targetCam.updateProjectionMatrix();
  }
});

// near / far
gui.add(params, "near", 0.01, 5, 0.01).name("Near").onChange((v) => {
  targetCam.near = v;
  targetCam.updateProjectionMatrix();
});
gui.add(params, "far", 5, 200, 1).name("Far").onChange((v) => {
  targetCam.far = v;
  targetCam.updateProjectionMatrix();
});

// 正交相机 size
gui.add(params, "orthoSize", 1, 20, 0.1).name("Ortho Size").onChange((v) => {
  if (targetCam.isOrthographicCamera) {
    orthoSize = v;
    targetCam.left = -v;
    targetCam.right = v;
    targetCam.top = v;
    targetCam.bottom = -v;
    targetCam.updateProjectionMatrix();
  }
});

// 相机位置
gui.add(params, "posX", -20, 20, 0.1).name("Cam X").onChange((v) => targetCam.position.x = v);
gui.add(params, "posY", -20, 20, 0.1).name("Cam Y").onChange((v) => targetCam.position.y = v);
gui.add(params, "posZ", -20, 20, 0.1).name("Cam Z").onChange((v) => targetCam.position.z = v);

// =========================
// 动画循环
// =========================
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  // 更新相机模型位置
  perspModel.position.copy(perspCam.position);
  perspModel.lookAt(0, 0, 0);

  orthoModel.position.copy(orthoCam.position);
  orthoModel.lookAt(0, 0, 0);

  isoModel.position.copy(isoCam.position);
  isoModel.lookAt(0, 0, 0);

  // 更新 helper
  perspHelper.update();
  orthoHelper.update();
  isoHelper.update();

  controls.update();
  renderer.render(scene, activeCamera);
}
animate();

// =========================
// 自适应
// =========================
window.addEventListener("resize", () => {
  const w = window.innerWidth;
  const h = window.innerHeight;

  renderer.setSize(w, h);

  sceneCamera.aspect = w / h;
  sceneCamera.updateProjectionMatrix();
});
