// 创建场景
const scene = new THREE.Scene();
// 创建相机
const camera = new THREE.PerspectiveCamera(
  75, window.innerWidth / window.innerHeight, 0.1, 1000
);
camera.position.z = 4;

// 创建渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const gltfLoader = new THREE.GLTFLoader();
gltfLoader.load('../../models/modernbooth.glb', function(gltf) {
    const model = gltf.scene;
	model.position.y = -1;
	model.rotation.y = -1.2;
	model.traverse((child) => {
		if (child.isMesh) {
		  child.castShadow = true;    // 投射阴影
		  child.receiveShadow = true; // 接收阴影
		}
	});
	
    model.traverse(function(node) {
        if (node.isMesh && node.material) {
            const materials = Array.isArray(node.material) ? node.material : [node.material];
            materials.forEach(mat => {
                if ('roughness' in mat) {
                    mat.roughness = 0; // 控制光泽度
                }
                mat.needsUpdate = true;
            });
        }
    });
	
    scene.add(model);
}, function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, function (error) {
    console.log('Loading failed');
});

// car
// gltfLoader.load('../../models/lamborghini_centenario_roadster_sdc.glb', function(gltf) {
    // const model = gltf.scene;
	// model.receiveShadow = true;
	// model.position.y = -0.9;
	// model.rotation.y = 0.8;
    // scene.add(model);
// }, function (xhr) {
    // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
// }, function (error) {
    // console.log('Loading failed');
// });

const rgbeLoader = new THREE.RGBELoader();
rgbeLoader.load('../../models/sunny_prairie_expanse_2k.hdr', function (texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  //scene.background = texture;
  scene.environment = texture;
})
  
const aLight = new THREE.AmbientLight(0xFFFFFF, 1);
aLight.castShadow = true;
scene.add(aLight);

const dLight = new THREE.DirectionalLight(0xFFFFFF, 20);
dLight.castShadow = true;
scene.add(dLight);
dLight.position.set(4, 10, 3);

// 创建 dat.GUI 控制器
const gui = new dat.GUI();

// 创建一个对象来绑定位置参数
const lightFolder = gui.addFolder('Directional Light Position');
lightFolder.add(dLight.position, 'x', -20, 20).name('X');
lightFolder.add(dLight.position, 'y', -20, 20).name('Y');
lightFolder.add(dLight.position, 'z', -20, 20).name('Z');
gui.add(dLight, 'intensity', 0, 100).name('Intensity');
lightFolder.open();

const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.update();

// 响应窗口大小变化
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// 动画循环
function animate() {
    renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 可选：更柔和的阴影
