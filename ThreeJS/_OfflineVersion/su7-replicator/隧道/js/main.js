// =========================
// 基础 Three.js 场景
// =========================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020);




const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(3, 2, 5);
camera.lookAt(0, 1, 0);

const controls = new THREE.OrbitControls(camera, renderer.domElement);

// 1. 加载 shader
const vert = document.getElementById("speedup-vert").textContent;
const frag = document.getElementById("speedup-frag").textContent;

// 2. 创建 ShaderMaterial
const shaderMat = new THREE.ShaderMaterial({
  vertexShader: vert,
  fragmentShader: frag,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,  // 添加这个，确保双面可见
  uniforms: {
    iTime: { value: 0 },
    iResolution: { value: new THREE.Vector3(window.innerWidth, window.innerHeight, 1) },
    iMouse: { value: new THREE.Vector4(0, 0, 0, 0) },
    uSpeed: { value: 10.0 },  // 速度要 >1 才能看到效果
    uOpacity: { value: 1.0 }
  }
});
  
const input = document.getElementById("glbInput");
input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 把本地文件变成 URL
  const url = URL.createObjectURL(file);

  const loader = new THREE.GLTFLoader();
  loader.load(url, (gltf) => {

    gltf.scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.material = shaderMat;   // 你的 ShaderMaterial
      }
    });

	const cube = new THREE.Mesh(
	  new THREE.BoxGeometry(1, 1, 1),
	  shaderMat
	);
	cube.position.set(0, 0.5, 0); // 让它稍微离地一点
	scene.add(cube);

    scene.add(gltf.scene);

    // 用完释放 URL
    URL.revokeObjectURL(url);
  });
});


// =========================
// 动画循环
// =========================
function animate(t) {
  requestAnimationFrame(animate);
  
  scene.traverse((obj) => {
    if (obj.material && obj.material.uniforms && obj.material.uniforms.iTime) {
      obj.material.uniforms.iTime.value = t * 0.001;
    }
  });
  
  controls.update();
  renderer.render(scene, camera);
}
animate();

// =========================
// 自适应
// =========================
window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});
