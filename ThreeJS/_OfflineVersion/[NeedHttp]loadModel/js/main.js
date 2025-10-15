// 创建场景
const scene = new THREE.Scene();
let action;
let action2;
let mixer;
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
gltfLoader.load('../../models/Dragon_Evolved.gltf', function(gltf) {
    const model = gltf.scene;
	const clips = gltf.animations;
	mixer = new THREE.AnimationMixer(model);
	
	const clip = THREE.AnimationClip.findByName(clips, 'Flying_Idle');
	action = mixer.clipAction(clip);
	const clip2 = THREE.AnimationClip.findByName(clips, 'Fast_Flying');
	action2 = mixer.clipAction(clip2);
	
	// The animation will start and gradually increase
	// in speed, reaching the normal speed after 5 seconds.
	// action.fadeIn(5);
	action.play();
    model.position.y = -2;
    scene.add(model);
}, function (xhr) {
    console.log((xhr.loaded / xhr.total * 100) + '% loaded');
}, function (error) {
    console.log('Loading failed');
});

// Outside the body of the load callback function.
const aLight = new THREE.AmbientLight(0xFFFFFF, 1);
scene.add(aLight);

const dLight = new THREE.DirectionalLight(0xFFFFFF, 8);
scene.add(dLight);
dLight.position.set(4, 10, 3);

const orbit = new THREE.OrbitControls(camera, renderer.domElement);
orbit.update();

// 响应窗口大小变化
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', function(e) {
    if(e.code === 'Space')
        action.paused = !action.paused;
    if(e.code === 'KeyF') {
        action2.reset();
        action2.play();
        action.crossFadeTo(action2, 1);
    }
    if(e.code === 'KeyS') {
        action.reset();
        action.play();
        action.crossFadeFrom(action2, 1);
    }
});

// 动画循环
const clock = new THREE.Clock();
function animate() {
    if(mixer) {
        const delta = clock.getDelta();
        mixer.update(delta);
    }
    renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);