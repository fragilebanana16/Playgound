
class EventBus {
    constructor() {
        this.events = {};
    }
    on(event, handler) {
        (this.events[event] || (this.events[event] = [])).push(handler);
    }
    emit(event, data) {
        (this.events[event] || []).forEach(h => h(data));
    }
}

const eventBus = new EventBus();
let dualLight;
const params = {
    exposure: 1,
    bloomStrength: 5,
    bloomThreshold: 0,
    bloomRadius: 0,
    scene: 'Scene with Glow',
    showLight: false
};
let cameraTargetPos = new THREE.Vector3();
const cameraInfo = {
    x: 0,
    y: 0,
    z: 0
};

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);
const darkMaterial = new THREE.MeshBasicMaterial({
    color: 'black'
});
const materials = {};



let g_uniforms = {
    u_time: {
        value: new THREE.Clock().getElapsedTime()
    }
};


// 参数对象（和 BloomUtil 初始化时一致）
const bloomParams = {
    enabled: true,
    bloomStrength: 1.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.85
};

const sceneTransitions = {
    0: "Forest",
    1: "Desert",
    2: "City",
};
let sceneId = 0;
// =========================
//  主入口
// =========================
function main() {

    // 初始化场景、相机、渲染器，在首个场景中完成，共用
    const sceneManager = SceneManager.getInstance();
    const { renderer, camera, controls } = sceneManager.initBase();
    const hdrManager = HDRManager.init(renderer);
	sceneManager.initHDR(hdrManager);
    const guiManager = GUIManager.init(sceneManager, hdrManager);
    const uiController = UIController.init(hdrManager, guiManager);

    // 初始化相机管理器
    CameraManager.getInstance().init(camera);

    // 创建场景
    const forestScene = new CustomScene("Forest", 0x00cc00, renderer);
    const desertScene = new CustomScene("Desert", 0xff0000, renderer);
    const cityScene = new CustomScene("City", 0x0000ff, renderer);

    // 4. 加载场景
    forestScene.load();
    desertScene.load();
    cityScene.load();

    // 5. 添加场景到管理器
    const scene1 = sceneManager.addScene("Forest", forestScene);
	guiManager.addSceneToGUI(scene1);
    const scene2 = sceneManager.addScene("Desert", desertScene);
	guiManager.addSceneToGUI(scene2);
    const scene3 = sceneManager.addScene("City", cityScene);
	guiManager.addSceneToGUI(scene3);

    // 2. 灯光系统
    //const lightManager = LightManager.getInstance(scene, gui);

    // lightManager.addLightHelpers();

    // 3. 环境系统
    // const envManager = new EnvironmentManager(scene, renderer);
    // envManager.setEnvironment(256, Infinity);
    // envManager.addFloor();
    // envManager.addSurroundingSphere();
    // envManager.setupHDRInput();
    // envManager.addCurvedBackdrop();
    // envManager.setMovingSpot();

    // // 4. 模型系统
    const modelManager = new ModelManager();

    // // 5. 相机系统
    // const cameraManager = new CameraManager(camera, gui);

    // // 6. Bloom 后期处理
    // const bloomUtil = BloomUtil.getInstance(scene, camera, renderer, {
    // bloomStrength: bloomParams.bloomStrength,
    // bloomRadius: bloomParams.bloomRadius,
    // bloomThreshold: bloomParams.bloomThreshold,
    // });

    // bloomUtil.setBloomEnabled(bloomParams.enabled);

    // sceneManager.animate();

    // 其它交互
    uiController.setupKeyEvents(camera);
    uiController.setupResize(camera, renderer);

    // 6. 初始化 Bloom
    const bloomUtil = BloomUtil.getInstance(renderer, camera);

    //sceneManager.transitionTo("City");

    // 10. 动画循环
    function animate() {
        requestAnimationFrame(animate);
        const dt = sceneManager.clock.getDelta();
        sceneManager.updateTransition(dt);
        controls.update();
        /* if (sceneManager.transitionProgress >= 1.0) {
            requestAnimationFrame(() => {
                if (++sceneId > 2)
                    sceneId = 0;
                sceneManager.transitionTo(sceneTransitions[sceneId]);
            });
        } */

        sceneManager.render(renderer, camera);
    }
    animate();
}

// =========================
// 单个场景类
// =========================
class CustomScene {
    constructor(name, bgColor, renderer) {
        this.name = name;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(bgColor);
        this.cameraState = {
            position: new THREE.Vector3(),
            target: new THREE.Vector3()
        };
        this.bloomParams = {
            strength: 1.5,
            radius: 0.4,
            threshold: 0.85
        };
        this.renderer = renderer;
        this.iblMaterials = [];
        eventBus.on("modelLoaded", model => { // 每个场景自己决定怎么处理
            const clone = model.clone(true);
            clone.traverse(obj => {
                if (obj.isMesh && obj.material) {
                    // 克隆材质
                    if (Array.isArray(obj.material)) {
                        obj.material = obj.material.map(mat => mat.clone());
                    } else {
                        obj.material = obj.material.clone();
                    }

                    if (obj.material.isMeshStandardMaterial || obj.material.isMeshPhysicalMaterial) {
                        this.iblMaterials.push(obj.material);
                    }
                }
            });

            this.scene.add(clone);
        });
    }

    load() {
        this._setupLights();
        this._setupEnvironment();
        this._setVirtualEnvironment(256, Infinity);
        this.start();
    }

    unload() {
        this.stop();
        this.disposeLights();
        this.disposeEnvironment();
    }

    setupLights() {}
    setupEnvironment() {}
    start() {}
    stop() {}

    // 不做全局fbo ibl
    _updateIBLMaterials() {
        let env = this.virtualFBO.texture;
        if (!env)
            return;
        for (const mat of this.iblMaterials) {
            mat.envMap = env; // 所有的场景都是同一个 灯片？
            mat.needsUpdate = true;
        }
    }
    _createCustomMaterial(colorB = "black") {
        const material = new LayerMaterial({
            layers: [new Depth({
                    colorA: "#ffffff",
                    colorB,
                    alpha: 0.5,
                    near: 0,
                    far: 300,
                    origin: new THREE.Vector3(100, 100, 100)
                })]
        });
        material.side = THREE.BackSide;
        return material;
    }

    // fbo as ibl
    _createVirtualLighting({
        form = "circle",
        color = "#ffffff",
        intensity = 1,
        scale = [1, 1, 1],
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        target = null
    } = {}) {
        const geometry = form === "circle"
             ? new THREE.RingGeometry(0, 1, 64)
             : new THREE.PlaneGeometry();

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

        if (target)
            mesh.lookAt(new THREE.Vector3(...target));

        // 文字 Sprite（使用 this.name）
        if (this.name) {
            const canvas = document.createElement("canvas");
            canvas.width = 512;
            canvas.height = 256;

            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "black";
            ctx.font = "bold 120px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(this.name, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;

            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false, // 让文字永远在灯片前面
                toneMapped: false
            });

            const sprite = new THREE.Sprite(spriteMaterial);

            // 稍微往前移一点，避免 z-fighting
            sprite.position.set(0, 0, 0.01);
            mesh.add(sprite);
        }

        return mesh;
    }

    _setVirtualEnvironment(resolution = 256, frames = 1, near = 1, far = 1000, background = true) {
        this.virtualFBO = new THREE.WebGLCubeRenderTarget(resolution);
        this.virtualFBO.texture.type = THREE.HalfFloatType; // 车漆反光更明显
        this.virtualScene = new THREE.Scene();
        this.virtualCubeCamera = new THREE.CubeCamera(near, far, this.virtualFBO);
        this.virtualScene.add(this.virtualCubeCamera);

        const lightOptions = {
            form: "circle",
            intensity: 4,
            color: `hsl(${(20 + Math.random() * (80 - 20))  * 360 + 137.5 }, 70%, 50%)`,
            scale: [3, 1, 1],
            position: [-2, 2, 3],
        };

        const circleLight = this._createVirtualLighting(lightOptions);
        circleLight.lookAt(0, 1, 0);
        this.virtualScene.add(circleLight);
        lightOptions.position = [2, 2, 3];
        const circleLight2 = this._createVirtualLighting(lightOptions);
        circleLight2.lookAt(0, 1, 0);
        this.virtualScene.add(circleLight2);

        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = new LayerMaterial({
            layers: [new Depth({
                    colorA: "#ffffff",
                    colorB:"black",
                    alpha: 0.5,
                    near: 0,
                    far: 300,
                    origin: new THREE.Vector3(100, 100, 100)
                })]
        });
        material.side = THREE.BackSide;

        this.virtualBackgroundMesh = new THREE.Mesh(geometry, material);
        this.virtualBackgroundMesh.scale.set(10, 10, 10);
        this.virtualScene.add(this.virtualBackgroundMesh);

        // 设置 environment / background
        // if (background !== "only") {
        //     this.scene.environment = this.virtualFBO.texture;
        //  }
        if (background) {
            this.scene.background = this.virtualFBO.texture;
        }

        // 更新
        let count = 1;
        const renderVirtual = () => {
            if (frames === Infinity || count < frames) {
                this.virtualCubeCamera.update(this.renderer, this.virtualScene);
                this._updateIBLMaterials(); // 没切换场景前不需要更新

                count++;
            }
            requestAnimationFrame(renderVirtual);
        };
        renderVirtual();
    }

    // 设置灯光
    _setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(5, 10, 5);
        this.scene.add(dirLight);
    }

    // 设置环境
    _setupEnvironment() {
        const groundGeo = new THREE.PlaneGeometry(10 + Math.random() * 10, Math.random() * 10);
        const groundMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.3, 0.3)
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground);

        // 添加车（简化为立方体）
        const carGeo = new THREE.BoxGeometry(1, 0.5, 2);
        const carMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
            emissive: 0x000000,
			metalness: 1.0,
			roughness: 0.1,
        });
        this.car = new THREE.Mesh(carGeo, carMat);
        this.car.position.set(0, 0.25, 0);
        this.scene.add(this.car);

        // 场景标识物
        const markerGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const markerMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.position.set(2, 0.3, 2);
        this.scene.add(marker);
    }

    // 保存相机状态
    saveCameraState(camera) {
        this.cameraState.position.copy(camera.position);
        this.cameraState.target.copy(camera.getWorldDirection(new THREE.Vector3()).add(camera.position));
    }

    // 应用相机状态
    applyCameraState(camera) {
        camera.position.copy(this.cameraState.position);
        camera.lookAt(this.cameraState.target);
    }
}
class CityScene extends CustomScene {}
class ForrestScene extends CustomScene {}
// 火车背景、下雨、飙车
class TrainScene extends CustomScene {}
// class BloomUtil {
// static instance = null;

// static getInstance(scene, camera, renderer, params) {
// if (!BloomUtil.instance) {
// BloomUtil.instance = new BloomUtil(scene, camera, renderer, params);
// }
// return BloomUtil.instance;
// }

// constructor(scene, camera, renderer, params) {
// this._scene = scene;
// this._camera = camera;
// this._renderer = renderer;
// this._params = params;

// this._darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
// this._materials = {};
// this._enableBloom = true;

// this._bloomPass = this._initComposers();
// }

// _initComposers() {
// const renderScene = new THREE.RenderPass(this._scene, this._camera);
// const bloomPass = new THREE.UnrealBloomPass(
// new THREE.Vector2(window.innerWidth, window.innerHeight),
// this._params.bloomStrength,
// this._params.bloomRadius,
// this._params.bloomThreshold
// );

// this._bloomComposer = new THREE.EffectComposer(this._renderer);
// this._bloomComposer.renderToScreen = false;
// this._bloomComposer.addPass(renderScene);
// this._bloomComposer.addPass(bloomPass);

// const finalPass = new THREE.ShaderPass(
// new THREE.ShaderMaterial({
// uniforms: {
// baseTexture: { value: null },
// bloomTexture: { value: this._bloomComposer.renderTarget2.texture }
// },
// vertexShader: document.getElementById('vertexshader').textContent,
// fragmentShader: document.getElementById('fragmentshader').textContent,
// defines: {}
// }),
// 'baseTexture'
// );
// finalPass.needsSwap = true;

// this._finalComposer = new THREE.EffectComposer(this._renderer);
// this._finalComposer.addPass(renderScene);
// this._finalComposer.addPass(finalPass);
// return bloomPass;
// }
// setBloomStrength(v){
// this._params.bloomStrength = v;
// this._bloomPass.strength = this._params.bloomStrength;
// }
// setBloomRadius(v){
// this._params.bloomRadius = v;
// this._bloomPass.radius = this._params.bloomRadius;
// }
// setBloomThreshold(v){
// this._params.bloomThreshold = v;
// this._bloomPass.threshold = this._params.bloomThreshold;
// }
// // =========================
// // 渲染接口：根据开关决定是否启用 Bloom
// // =========================
// render() {
// if ( !this._enableBloom ) {
// this._renderer.render( this._scene, this._camera );
// }
// else{
// this._renderBloom( true );
// this._finalComposer.render();
// }
// }

// setBloomEnabled(flag) {
// this._enableBloom = flag;
// }

// // =========================
// // 渲染bloom pass
// // =========================
// _renderBloom( mask ) {
// if ( mask === true ) {
// this._scene.traverse((obj)=> this.darkenNonBloomed(obj) );
// this._bloomComposer.render();
// this._scene.traverse((obj)=> this.restoreMaterial(obj) );
// } else {
// // flow only
// this._camera.layers.set( BLOOM_SCENE );
// this._bloomComposer.render();
// this._camera.layers.set( ENTIRE_SCENE );
// }
// }

// // =========================
// // 将非bloom项材质变黑，保留原有材质
// // =========================
// darkenNonBloomed(obj) {
// if (obj.isLine || (obj.isMesh && bloomLayer.test(obj.layers) === false)) {
// this._materials[obj.uuid] = obj.material;
// obj.material = this._darkMaterial;
// }
// }

// // =========================
// // 还原原有材质
// // =========================
// restoreMaterial(obj) {
// if (this._materials[obj.uuid]) {
// obj.material = this._materials[obj.uuid];
// delete this._materials[obj.uuid];
// }
// }
// }

class LightManager {
    static instance = null;
    static getInstance(scene, gui) {
        if (!LightManager.instance) {
            LightManager.instance = new LightManager(scene, gui);
        }
        return LightManager.instance;
    }
    constructor(scene, gui) {
        this._scene = scene;
        this._gui = gui;
        this._lightGroups = {
            bigdeng: [],
            smalldeng: [],
            dengzhao: [],
            backdeng: []
        };
        this._helpersVisible = false;
    }

    addMainLights() {
        const topLight = new THREE.DirectionalLight(0xffffff, 2);
        topLight.position.set(10, 10, 10);
        topLight.castShadow = true;

        const ambient = new THREE.AmbientLight(0x404040, 0.2);
        this._scene.add(topLight, ambient);
    }

    addSpotLight() {
        const spotLight = new THREE.SpotLight(0xffffff, 2);
        spotLight.position.set(0, 15, 0);
        spotLight.penumbra = 1;
        spotLight.angle = 0.3;
        spotLight.castShadow = true;
        spotLight.shadow.bias = -0.0001;

        spotLight.target.position.set(0, 0, 6);
        this._scene.add(spotLight.target);
        this._scene.add(spotLight);
    }

    addLightHelpers() {
        const colors = {
            directional: 0xff4444,
            point: 0x44ff44,
            spot: 0x4444ff,
            hemi: 0xffff44,
            rect: 0xff44ff
        };

        this._scene.traverse((obj) => {
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
                helper.visible = this._helpersVisible;
                this._scene.add(helper);
            }
        });
    }

    toggleHelpers() {
        this._helpersVisible = !this._helpersVisible;
        this._scene.traverse((obj) => {
            if (obj.helper)
                obj.helper.visible = this._helpersVisible;
            if (obj.isHelper)
                obj.visible = this._helpersVisible;
        });
    }

    // 把模型里的灯 mesh 加入分组
    addMesh(type, mesh) {
        if (this._lightGroups[type]) {
            this._lightGroups[type].push(mesh);
        }
    }

    // 为某一类灯创建 GUI 控制
    createMeshGUI(type, label) {
        const folder = this._gui.addFolder(label);
        const params = {
            emissiveIntensity: 1,
            color: [255, 255, 255],
            visible: true
        };

        // 控制亮度
        folder.add(params, "emissiveIntensity", 0, 10, 0.01).name("Intensity").onChange(v => {
            this._lightGroups[type].forEach(mesh => {
                if (mesh.material)
                    mesh.material.emissiveIntensity = v;
            });
        });

        // 控制显示/隐藏
        folder.add(params, "visible").name("Visible").onChange(v => {
            this._lightGroups[type].forEach(mesh => mesh.visible = v);
        });

        // 控制颜色
        folder.addColor(params, "color").name("Color").onChange(c => {
            this._lightGroups[type].forEach(mesh => {
                if (mesh.material) {
                    mesh.material.emissive.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
                    mesh.material.color.setRGB(c[0] / 255, c[1] / 255, c[2] / 255);
                }
            });
        });

        folder.open();
    }

}
class SceneConfig {
    constructor(name) {
        this.name = name;
        this.enableEnvHDR = false; // 是否启用 IBL
        this.hdrName = null; // 当前 HDR 名称
        this.iblMaterials = []; // 该场景需要更新的材质
    }
}
class SceneManager {
    static instance = null;
	static getInstance() {
        if (!SceneManager.instance) {
            SceneManager.instance = new SceneManager();
        }
        return SceneManager.instance;
    }
    constructor(hdrManager) {
        this.scenes = new Map();
        this.currentScene = null;
        this.nextScene = null;
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionSpeed = 1.0;
        this.transitionMaterial = this._createTransitionMaterial();
        this.transitionQuad = null;
        this.clock = new THREE.Clock();
        const w = window.innerWidth;
        const h = window.innerHeight; // 全局的两个 RenderTarget
        this.rtCurrent = new THREE.WebGLRenderTarget(w, h);
        this.rtNext = new THREE.WebGLRenderTarget(w, h);
        this.rtCurrent.texture.encoding = THREE.LinearEncoding;
        this.rtNext.texture.encoding = THREE.LinearEncoding;
    }
    initHDR(hdrManager) {
        this.hdrManager = hdrManager;
	}
    renderSceneToRT(scene, camera, rt) {

        this.renderer.setRenderTarget(rt);
        this.renderer.clear();
        this.renderer.render(scene, camera);
        this.renderer.setRenderTarget(null);
    }

    updateSceneIBL(sceneName) {
		if(sceneName === null){
			scene.content.scene.environment = null;
		    scene.content.scene.background = null;
			return;
		}
		
        const scene = this.scenes.get(sceneName);
		if(!scene) {return}
		const cfg = scene.config;
        const env = cfg.enableEnvHDR ? this.hdrManager.getEnv(cfg.hdrName) : null;
		scene.content.scene.environment = env;
		scene.content.scene.background = env;
    }
    updateTransitionTextures() {
        this.transitionMaterial.uniforms.tCurrent.value = this.rtCurrent.texture;
        this.transitionMaterial.uniforms.tNext.value = this.rtNext.texture;
    }

    // 添加场景
    addScene(name, scene) {
		const wrapper = { content: scene, config: new SceneConfig(name)};
		this.scenes.set(name, wrapper); 
        if (!this.currentScene)
            this.currentScene = scene;
		return wrapper.config;
    }

    // 切换场景
    transitionTo(name, speed = 0.3) {
        if (this.isTransitioning)
            return;
        const nextScene = this.scenes.get(name).content;
        if (!nextScene || nextScene === this.currentScene)
            return;

        this.nextScene = nextScene;
        this.transitionSpeed = speed;
        this.isTransitioning = true;
        this.transitionProgress = 0;

        // 保存当前场景的相机状态
        const camera = CameraManager.getInstance().getCamera();
        this.currentScene.saveCameraState(camera);
    }

    // 更新过渡
    updateTransition(dt) {
        if (!this.isTransitioning)
            return;

        this.transitionProgress += dt * this.transitionSpeed;
        this.transitionMaterial.uniforms.progress.value = this.transitionProgress;

        if (this.transitionProgress >= 1.0) {
            this.currentScene = this.nextScene;
            this.nextScene = null;
            this.isTransitioning = false;

            // 应用新场景的相机状态
            //const camera = CameraManager.getInstance().getCamera();
            //this.currentScene.applyCameraState(camera);
        }
    }

    // 渲染
    render() {
        if (this.isTransitioning) {
            // 渲染下一个场景到纹理
            this.renderSceneToRT(this.currentScene.scene, this.camera, this.rtCurrent);
            this.renderSceneToRT(this.nextScene.scene, this.camera, this.rtNext);
            this.updateTransitionTextures();

            // 渲染过渡 Quad
            if (!this.transitionQuad) {
                const geometry = new THREE.PlaneGeometry(2, 2);
                this.transitionQuad = new THREE.Mesh(geometry, this.transitionMaterial);
            }
            this.renderer.render(this.transitionQuad, new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1));
        } else {

            // 这两个场景始终颜色空间不一致
            this.renderer.render(this.currentScene.scene, this.camera);

        }
    }

    // 创建过渡材质
    _createTransitionMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                tCurrent: {
                    value: null
                },
                tNext: {
                    value: null
                },
                progress: {
                    value: 0
                },
                exposure: {
                    value: 1.0
                }
            },
            vertexShader: `
			  varying vec2 vUv;
			  void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			  }
			`,
			fragmentShader: `
			uniform sampler2D tCurrent;
			uniform sampler2D tNext;
			uniform float progress;
			uniform float exposure;
			varying vec2 vUv;

			vec3 RRTAndODTFit(vec3 v) {
				vec3 a = v * (v + 0.0245786) - 0.000090537;
				vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081;
				return a / b;
			}

			vec3 ACESFilmicToneMapping(vec3 color) {
				mat3 ACESInputMat = mat3(
					0.59719, 0.35458, 0.04823,
					0.07600, 0.90834, 0.01566,
					0.02840, 0.13383, 0.83777
				);

				mat3 ACESOutputMat = mat3(
					1.60475, -0.53108, -0.07367,
					-0.10208, 1.10813, -0.00605,
					-0.00327, -0.07276, 1.07602
				);

				color = ACESInputMat * color;
				color = RRTAndODTFit(color);
				color = ACESOutputMat * color;

				return clamp(color, 0.0, 1.0);
			}

			void main() {
				vec3 c = texture2D(tCurrent, vUv).rgb;
				vec3 n = texture2D(tNext, vUv).rgb;

				float mixAmount = smoothstep(progress - 0.02, progress, vUv.x);
				vec3 color = mix(n, c, mixAmount);

				// 曝光
				//color *= exposure;

				// ACES
				//color = ACESFilmicToneMapping(color);

				// Gamma（Linear → sRGB）
				//color = pow(color, vec3(1.0 / 2.2));

				gl_FragColor = vec4(color, 1.0);
			}`,
            depthTest: false,
            depthWrite: false
        });
    }

    // 初始化基础设施
    initBase() {
        const w = window.innerWidth;
        const h = window.innerHeight;

        const renderer = new THREE.WebGLRenderer({
            antialias: true
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        // renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.outputEncoding = THREE.LinearEncoding;
        renderer.toneMapping = THREE.NoToneMapping;
        document.body.appendChild(renderer.domElement);
        const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
        camera.position.set(0, 2, 6);
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        this.renderer = renderer;
        this.camera = camera;
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return {
            renderer,
            camera,
            controls
        };
    }
}

// =========================
// Bloom 效果
// =========================
class BloomUtil {
    static instance = null;

    static getInstance(renderer, camera) {
        if (!BloomUtil.instance) {
            BloomUtil.instance = new BloomUtil(renderer, camera);
        }
        return BloomUtil.instance;
    }

    constructor(renderer, camera) {
        this.renderer = renderer;
        this.camera = camera;
        this.bloomComposer = null;
        this.finalComposer = null;
        this.darkMaterial = new THREE.MeshBasicMaterial({
            color: 'black'
        });
        this.materials = {};
        this.enabled = true;
        this.initComposers();
    }

    initComposers() {
        const renderScene = new THREE.RenderPass(SceneManager.getInstance().currentScene.scene, this.camera);
        const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                params.bloomStrength,
                params.bloomRadius,
                params.bloomThreshold);

        this.bloomComposer = new THREE.EffectComposer(this.renderer);
        this.bloomComposer.renderToScreen = false;
        this.bloomComposer.addPass(renderScene);
        this.bloomComposer.addPass(bloomPass);

        const finalPass = new THREE.ShaderPass(
                new THREE.ShaderMaterial({
                    uniforms: {
                        baseTexture: {
                            value: null
                        },
                        bloomTexture: {
                            value: this.bloomComposer.renderTarget2.texture
                        }
                    },
                    vertexShader: `
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,
                    fragmentShader: `
              uniform sampler2D baseTexture;
              uniform sampler2D bloomTexture;
              varying vec2 vUv;
              void main() {
                vec4 base = texture2D(baseTexture, vUv);
                vec4 bloom = texture2D(bloomTexture, vUv);
                gl_FragColor = base + bloom * 0.8;
              }
            `,
                    defines: {}
                }),
                'baseTexture');
        finalPass.needsSwap = true;

        this.finalComposer = new THREE.EffectComposer(this.renderer);
        this.finalComposer.addPass(renderScene);
        this.finalComposer.addPass(finalPass);
    }

    render() {
        if (!this.enabled) {
            this.renderer.render(SceneManager.getInstance().currentScene.scene, this.camera);
            return;
        }

        this._renderBloom(true);
        this.finalComposer.render();
    }

    _renderBloom(mask) {
        if (mask) {
            const scene = SceneManager.getInstance().currentScene.scene;
            scene.traverse((obj) => this.darkenNonBloomed(obj));
            this.bloomComposer.render();
            scene.traverse((obj) => this.restoreMaterial(obj));
        }
    }

    darkenNonBloomed(obj) {
        if (obj.isMesh && !bloomLayer.test(obj.layers)) {
            this.materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
        }
    }

    restoreMaterial(obj) {
        if (this.materials[obj.uuid]) {
            obj.material = this.materials[obj.uuid];
            delete this.materials[obj.uuid];
        }
    }

    setBloomEnabled(flag) {
        this.enabled = flag;
    }

    setBloomStrength(v) {
        params.bloomStrength = v;
        this.bloomComposer.passes[1].strength = v;
    }

    setBloomRadius(v) {
        params.bloomRadius = v;
        this.bloomComposer.passes[1].radius = v;
    }

    setBloomThreshold(v) {
        params.bloomThreshold = v;
        this.bloomComposer.passes[1].threshold = v;
    }
}

class EnvironmentManager {
    getVirtualScene() {
        return this._virtualScene;
    }

    constructor(scene, renderer) {
        this._scene = scene;
        this._renderer = renderer;
        this._virtualScene = new THREE.Scene();
        this._virtualBackgroundMesh = null;
        this._clock = new THREE.Clock();
    }

    addCurvedBackdrop() {
        const radius = 25;
        const height = 18;
        const arc = Math.PI * 0.4;

        const geometry = new THREE.CylinderGeometry(
                radius, radius, height, 64, 1, true, -arc / 2, arc);
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
        this._scene.add(mesh);
    }

    addSurroundingSphere() {
        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = this._createCustomMaterial("#2de8cd");

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(100, 100, 100);
        this._scene.add(mesh);
    }

    addFloor(scene) {
        const floorGeo = new THREE.PlaneGeometry(200, 200);
        const floorMat = new THREE.MeshPhongMaterial({
            color: "#111111",
            emissive: "#000000",
            side: THREE.DoubleSide
        });

        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -1.02;
        floor.receiveShadow = true;
        this._scene.add(floor);
    }

    setEnvironment(resolution = 256, frames = 1, near = 1, far = 1000, background = false) {
        const fbo = new THREE.WebGLCubeRenderTarget(resolution);
        fbo.texture.type = THREE.HalfFloatType;
        const cubeCamera = new THREE.CubeCamera(near, far, fbo);

        this._virtualScene.add(cubeCamera);

        // 添加虚拟光源
        const topLight = this._createVirtualLight({
            intensity: 0.75,
            scale: [10, 10, 1],
            position: [0, 5, -9],
            rotation: [Math.PI / 2, 0, 0]
        });
        this._virtualScene.add(topLight);

        if (background !== "only") {
            this._scene.environment = fbo.texture;
        }
        if (background) {
            this._scene.background = fbo.texture;
        }

        const geometry = new THREE.SphereGeometry(1, 64, 64);
        const material = this._createCustomMaterial("#ff0000");

        this._virtualBackgroundMesh = new THREE.Mesh(geometry, material);
        this._virtualBackgroundMesh.scale.set(100, 100, 100);
        this._virtualScene.add(this._virtualBackgroundMesh);

        let count = 1;
        const virtualRender = () => {
            if (frames === Infinity || count < frames) {
                cubeCamera.update(this._renderer, this._virtualScene);
                count++;
            }
            requestAnimationFrame(virtualRender);
        };
        virtualRender();
    }

    _createVirtualLight({
        form = "rect",
        intensity = 1,
        color = "white",
        scale = [1, 1, 1],
        position = [0, 0, 0],
        rotation = [0, 0, 0],
        target
    }) {
        const geometry = form === "circle" ? new THREE.RingGeometry(0, 1, 64) : new THREE.PlaneGeometry();
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
        if (target)
            mesh.lookAt(new THREE.Vector3(...target));
        return mesh;
    }

    _createCustomMaterial(colorB = "black") {
        const material = new LayerMaterial({
            layers: [new Depth({
                    colorA: "#ffffff",
                    colorB,
                    alpha: 0.5,
                    near: 0,
                    far: 300,
                    origin: new THREE.Vector3(100, 100, 100)
                })]
        });
        material.side = THREE.BackSide;
        return material;
    }

    floatMesh({
        group,
        speed = 1,
        rotationIntensity = 1,
        floatIntensity = 1,
    }) {
        const offset = Math.random() * 10;
        const t = offset + this._clock.getElapsedTime();
        group.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
        group.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
        group.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
        group.position.y = ((Math.sin((t / 4) * speed) + 2) * 2) * floatIntensity;
        requestAnimationFrame(() => {
            this.floatMesh({
                group,
                speed,
                rotationIntensity,
                floatIntensity
            });
        });
    }

    setMovingSpot() {
        const groupWrap = new THREE.Group();
        const group = new THREE.Group();
        const sceneGroup = new THREE.Group();

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

            const circleLight = this._createVirtualLight(lightOptions);
            circleLight.lookAt(0, 1, 0);
            group.add(circleLight);
            const circleLight2 = circleLight.clone();
            circleLight2.isHelper = true;
        }

        groupWrap.add(group);
        this._virtualScene.add(groupWrap);
        this.spotAnimate(this._clock, group);
    }

    spotAnimate(clock, group) {
        const t = clock.getElapsedTime();
        const maxAngle = Math.PI / 6;
        group.rotation.y = Math.sin(t * 0.8) * maxAngle;
        group.rotation.x = Math.sin(t * 0.8) * maxAngle;
        requestAnimationFrame(() => {
            this.spotAnimate(clock, group);
        });
    }
}
class ModelManager {
    constructor(scene, gui) {
        this._scene = scene;
        this._gui = gui;
        this._model = null;
        this._box = null;
        this._boxPoints = {};

        document.getElementById("fileInput")
        .addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file)
                this.loadModelFromFile(file);
        });
    }

    _attachDualLights(lampMesh) {
        const lights = {
            left: null,
            right: null
        };

        const basePos = lampMesh.getWorldPosition(new THREE.Vector3());
        const dir = lampMesh.getWorldDirection(new THREE.Vector3());
        // 让光往下偏 0.2
        dir.y += 0.1;
        dir.normalize();
        // 默认左右偏移
        const offset = 0.8;

        // 左灯
        const leftLight = new THREE.SpotLight(0xffffff, 5);
        leftLight.angle = Math.PI / 4; // 15°，很窄
        leftLight.distance = 50; // 近光灯照 8 米左右
        leftLight.decay = 0.1; // 衰减快
        leftLight.penumbra = 0.2; // 边缘稍微柔和
        leftLight.intensity = 10; // 亮度适中
        leftLight.castShadow = true;
        leftLight.position.copy(basePos).add(new THREE.Vector3(-offset, 0.3, 1.6));
        leftLight.target.position.copy(leftLight.position.clone().add(dir.multiplyScalar(20)));
        this._scene.add(leftLight);
        this._scene.add(leftLight.target);
        leftLight.helper = new THREE.SpotLightHelper(leftLight);
        this._scene.add(leftLight.helper);

        // 右灯
        const rightLight = new THREE.SpotLight(0xffffff, 5);
        rightLight.angle = Math.PI / 4; // 15°，很窄
        rightLight.distance = 50; // 近光灯照 8 米左右
        rightLight.decay = 0.1; // 衰减快
        rightLight.penumbra = 0.2; // 边缘稍微柔和
        rightLight.intensity = 10; // 亮度适中
        rightLight.castShadow = true;
        rightLight.position.copy(basePos).add(new THREE.Vector3(offset, 0.3, 1.6));
        rightLight.target.position.copy(rightLight.position.clone().add(dir.multiplyScalar(2)));
        this._scene.add(rightLight);
        this._scene.add(rightLight.target);
        rightLight.helper = new THREE.SpotLightHelper(rightLight);
        this._scene.add(rightLight.helper);

        lights.left = leftLight;
        lights.right = rightLight;

        return lights;
    }

    loadModelFromFile(file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const contents = ev.target.result;
            const loader = new THREE.GLTFLoader();
            loader.parse(contents, "", (gltf) => {
                // 遍历模型，找到车灯
                // gltf.scene.traverse((child) => {
                // if (!child.isMesh) return;

                // const name = child.name.toLowerCase();

                // // 判断属于哪一类灯
                // let type = null;
                // if (name.includes("bigdeng")) type = "bigdeng";
                // else if (name.includes("smalldeng")) type = "smalldeng";
                // else if (name.includes("dengzhao")) type = "dengzhao";
                // else if (name.includes("backdeng")) type = "backdeng";


                // if (type){
                // const lm = LightManager.getInstance();
                // lm.addMesh(type, child)
                // lm.createMeshGUI(type, type);

                // child.layers.enable( BLOOM_SCENE );
                // const bloom = child.clone();
                // if (name.includes("bigdeng"))
                // dualLight = this._attachDualLights(bloom); // 只有大灯有
                // }
                // else {
                // child.layers.enable(ENTIRE_SCENE);
                // }
                // });
                // gltf.scene.position.y -= 1.0;
                //this._scene.add(gltf.scene);
                //this._model = gltf.scene;

                eventBus.emit("modelLoaded", gltf.scene);
            });
        };
        reader.readAsArrayBuffer(file);
    }

    customModel() {
        const changModel = (model, nodeName, options) => {
            model.materials[nodeName].setValues(options);
        };
        changModel(this._model, "rubber", {
            color: "#222",
            roughness: 0.6
        });
        changModel(this._model, "window", {
            color: "black",
            roughness: 0
        });
    }
}

// class CameraManager {
// constructor(camera, gui) {
// this._camera = camera;
// this._gui = gui;
// this._cameraTargetPos = new THREE.Vector3();
// this._box = null;
// this._boxPoints = {};
// this._clock = new THREE.Clock();
// }

// setupCameraGUI() {
// const guiParams = { point: "p3" };
// this._gui.add(guiParams, "point", Object.keys(this._boxPoints))
// .name("Camera Point")
// .onChange((value) => {
// const pos = this._boxPoints[value];
// this._cameraTargetPos.set(pos.x + 0.2, pos.y - 0.6, pos.z + 0.4);
// });
// }

// setCameraAnimate() {
// const mid = new THREE.Vector3().copy(this._cameraTargetPos);
// mid.y += 0.4;
// this._camera.position.lerp(mid, 0.01);
// this._camera.lookAt(this._box.getCenter(new THREE.Vector3()));
// requestAnimationFrame(() => this.setCameraAnimate());
// }
// }

// =========================
// 相机管理器
// =========================
class CameraManager {
    static instance = null;

    static getInstance() {
        if (!CameraManager.instance) {
            CameraManager.instance = new CameraManager();
        }
        return CameraManager.instance;
    }

    constructor() {
        this.camera = null;
    }

    init(camera) {
        this.camera = camera;
    }

    getCamera() {
        return this.camera;
    }
}

class HDRManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.pmrem = new THREE.PMREMGenerator(renderer);
        this.hdrList = {}; // { name: { file, envMap } }
    }
	
	static init(renderer) {
	    if (!HDRManager._instance) {
	        HDRManager._instance = new HDRManager(renderer);
	    }
	    return HDRManager._instance;
	}
	
    static getInstance() {
        if (!HDRManager._instance) {
            throw new Error("HDRManager not initialized. Call HDRManager.init(renderer) first.");
        }
        return HDRManager._instance;
    }
	createHDRWorker() {
		const workerCode = `
			importScripts('H:/jsProjects/RESUME/Playground/ThreeJS/_OfflineVersion/libs/three.js');
			importScripts('H:/jsProjects/RESUME/Playground/ThreeJS/_OfflineVersion/libs/RGBELoader.js');
			self.onmessage = function(e) {
				const buffer = e.data;
				const loader = new THREE.RGBELoader();
				const hdr = loader.parse(buffer);
				self.postMessage({
					width: hdr.width,
					height: hdr.height,
					data: hdr.data,
					type: hdr.type
				}, [hdr.data.buffer]);
			};
		`;

		const blob = new Blob([workerCode], { type: "application/javascript" });
		return new Worker(URL.createObjectURL(blob));
	}
	
	// 同步加载，rgbeloader.parse需要cpu时间
    async loadHDRFromFile(file) {
        const url = URL.createObjectURL(file);
        const hdr = await new THREE.RGBELoader().loadAsync(url);
        const envMap = this.pmrem.fromEquirectangular(hdr).texture;
        const name = file.name.replace(/\.[^/.]+$/, "");
        this.hdrList[name] = { file, envMap };
	    URL.revokeObjectURL(url);
        hdr.dispose();
        return name;
    }
	
	// 使用worker
	async loadHDRFromFileAsyncWorker(file, pmrem, hdrList) {
		const buffer = await file.arrayBuffer();
		return new Promise((resolve) => {
			const worker = this.createHDRWorker();

			worker.onmessage = (e) => {
				const { width, height, data, type } = e.data;

				const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat, type);
				texture.needsUpdate = true;
				texture.flipY = true;
				texture.mapping = THREE.EquirectangularReflectionMapping;
				const envMap = pmrem.fromEquirectangular(texture).texture;
				const name = file.name.replace(/\.[^/.]+$/, "");
				hdrList[name] = { file, envMap };

				texture.dispose();
				worker.terminate();

				resolve(name);
			};

			worker.postMessage(buffer, [buffer]); // 把 ArrayBuffer 传给 Worker
		});
	}

    getEnv(name) {
        return this.hdrList[name]?.envMap || null;
    }

    getHDRNames() {
        return Object.keys(this.hdrList);
    }
}

class GUIManager {
	constructor(sceneManager, hdrManager) {
        this.sceneManager = sceneManager;
        this.hdrManager = hdrManager;
        this.gui = new dat.GUI();
    }
	
	static init(sceneManager, hdrManager) {
	    if (!GUIManager._instance) {
	        GUIManager._instance = new GUIManager(sceneManager, hdrManager);
	    }
	    return GUIManager._instance;
	}
	
    static getInstance() {
        if (!GUIManager._instance) {
            throw new Error("GUIManager not initialized. Call GUIManager.init() first.");
        }
        return GUIManager._instance;
    }

    addSceneToGUI(sceneConfig) {
        const folder = this.gui.addFolder(sceneConfig.name);
		// 保存 folder 引用
		sceneConfig._guiFolder = folder;
    }

	refreshHDRList() {
		const hdrNames = this.hdrManager.getHDRNames();
		for (const sceneName of this.sceneManager.scenes.keys()) {
			const scene = this.sceneManager.scenes.get(sceneName);
			if(!scene){return }
			const cfg = scene.config;
			if (cfg._guiFolder) {
			    cfg._guiFolder
			    .add(cfg, "enableEnvHDR")
			    .name("启用环境 HDR")
			    .onChange((value) =>
			        this.sceneManager.updateSceneIBL(value ? cfg.name : null));
			    cfg._guiFolder
			    .add(cfg, "hdrName", hdrNames)
			    .name("HDR 环境")
			    .onChange(() => {
			        if (cfg.enableEnvHDR) {
			            this.sceneManager.updateSceneIBL(cfg.name);
			        }
			    });
			}
		}
	}
}

class UIController {
	constructor(hdrManager, guiManager) {
        this.hdrManager = hdrManager;
        this.guiManager = guiManager;
        const input = document.getElementById("hdrInput");
        input.addEventListener("change", this.onHDRUpload.bind(this));
    }
	
	static init(hdrManager, guiManager) {
	    if (!UIController._instance) {
	        UIController._instance = new UIController(hdrManager, guiManager);
	    }
	    return UIController._instance;
	}
	
    static getInstance() {
        if (!UIController._instance) {
            throw new Error("UIController not initialized. Call UIController.init() first.");
        }
        return UIController._instance;
    }
    
	setupKeyEvents(scene) {
        window.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === "t") {
                const lgtMgr = LightManager.getInstance();
                lgtMgr.toggleHelpers();
            }
        });
    }

    setupResize(camera, renderer) {
        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
	
	async onHDRUpload(e) {
        const files = Array.from(e.target.files);
		// 同步加载、快但卡
		// await Promise.all(files.map(file =>this.hdrManager.loadHDRFromFile(file))); 
		
		// worker加载、不卡但慢
		const hdrList = {};
		const pmrem = this.hdrManager.pmrem;
		for (const file of e.target.files) {
			const name = await this.hdrManager.loadHDRFromFileAsyncWorker(file, pmrem, this.hdrManager.hdrList);
			console.log("HDR loaded:", name);
		}
		
		this.guiManager.refreshHDRList();
	}
}

main();