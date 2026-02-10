
class EventBus {
    constructor() {
        this.events = {};
    }
    on(event, handler) {
        (this.events[event] || (this.events[event] = [])).push(handler);
    }
    emit(event, ...args) {
        (this.events[event] || []).forEach(h => h(...args));
    }
}


const eventBus = new EventBus();
let dualLight;

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

let gui, bloomConfig, ssrConfig;


const sceneTransitions = {
    0: "City",
    1: "Desert",
    2: "Forest",
};
let sceneId = 1;
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
    const cityScene = new CustomScene("City", 0xA7B8C9, renderer, camera);
	cityScene.enableCarSSR = true;
	cityScene.updateCallback = (delta, scene) => {
		const stillBg = scene.bgGroup;
		if(!stillBg) return;
		const speed = 8;
		stillBg.position.x += speed * delta; // 超过长度后复位
		if (stillBg.position.x > 60) {
			stillBg.position.x = -100;
		}
	};
	
    const forestScene = new CustomScene("Forest", 0xB7D1C4, renderer);
    const desertScene = new CustomScene("Desert", 0xE8DCC2, renderer);

    // 4. 加载场景
    forestScene.load();
    desertScene.load();
    cityScene.load();

    // 5. 添加场景到管理器
	const scene1 = sceneManager.addScene("City", cityScene);
	
	
	// 测试物体
	const geometry = new THREE.IcosahedronGeometry(.5, 4);
	const material = new THREE.MeshStandardMaterial({ color: 'cyan' });
	const mesh = new THREE.Mesh(geometry, material);
	sceneManager.addObject("City", mesh);
	
	guiManager.addSceneToGUI(scene1.config);
    const scene2 = sceneManager.addScene("Forest", forestScene);
	guiManager.addSceneToGUI(scene2.config);
    const scene3 = sceneManager.addScene("Desert", desertScene);
	guiManager.addSceneToGUI(scene3.config);
    
	// 添加 SSR 效果
	ssrConfig = scene1.effectComposer.addConfig(new SSRConfig({
		enabled: true,
		opacity: 0.5,
		maxDistance: 0.2,
		thickness: 0.018,
		infiniteThick: false,
		output: 0,
		selects: [mesh]
	}));
	guiManager.addSSRToGUI("City", ssrConfig);
	
	// 添加 Bloom 效果
    bloomConfig = scene1.effectComposer.addConfig(new BloomConfig({
		enabled: false,
		strength: 1.2,
		radius: 0.4,
		threshold: 0.45,
	}));
	guiManager.addBloomToGUI("City", bloomConfig);

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
    //const bloomUtil = BloomUtil.getInstance(renderer, camera);

    sceneManager.transitionTo("Desert"); // c => d => f


    // 10. 动画循环
    function animate() {
        requestAnimationFrame(animate);
        const dt = sceneManager.clock.getDelta();
        sceneManager.updateTransition(dt);
		sceneManager.updateSceneMovement(dt);
        controls.update();
 		if (sceneManager.transitionProgress >= 1.0 && !sceneManager.isTransitioning) {
			requestAnimationFrame(() => {
				if (++sceneId > 2) sceneId = 0;
				sceneManager.transitionTo(sceneTransitions[sceneId]);
			});
		} 
		
		// 使用后处理渲染
		// postProcessManager.render();
        sceneManager.render(renderer, camera);
    }
    animate();
}

// =========================
// 单个场景类
// =========================
class CustomScene {
    constructor(name, bgColor, renderer, camera=null) {
        this.name = name;
		this.camera = camera;
		this.carGroup = new THREE.Group();
		this.bgGroup = new THREE.Group();
        this.scene = new THREE.Scene();
		this.scene.fog = new THREE.Fog(0x443333, 0.1, 300);
		this.scene.add(this.carGroup);
		this.scene.add(this.bgGroup);
        this.scene.background = new THREE.Color(bgColor);
		this.lights = {
			ambient: new THREE.AmbientLight(0xffffff, 1), 
			directional: new THREE.DirectionalLight(0xffffff, 1)
		};
        this.cameraState = {
            position: new THREE.Vector3(),
            target: new THREE.Vector3()
        };
        this.bloomParams = {
            strength: 1.5,
            radius: 0.4,
            threshold: 0.15
        };
        this.renderer = renderer;
        this.iblMaterials = [];
	    this.carMixer = null;
		this.updateCallback = null;
		this.enableCarSSR = false;

		
        eventBus.on("carLoaded", gltf => { // 每个场景自己决定怎么处理
            const clone = gltf.scene.clone(true);
            clone.rotation.y = -Math.PI / 2;
			clone.position.z = -1.1;
			 // 创建 AnimationMixer
			 if(this.carMixer === null){
				 this.carMixer = new THREE.AnimationMixer(clone);
			 }

			// 播放所有动画（如果有多个）
			if (this.carMixer && gltf.animations && gltf.animations.length > 0) {
				gltf.animations.forEach(clip => {
					const action = this.carMixer.clipAction(clip);
					action.play();
				});
			}
			if (this.enableCarSSR) {
			    const selects = [];
			    clone.traverse(c => {
			        if (c.isMesh) {
						if(c.name.startsWith('carBody')){
						    c.castShadow = true;
			                selects.push(c);
						}
			        }

			        /*if (obj.isMesh && obj.material) {
			        // 克隆材质
			        if (Array.isArray(obj.material)) {
			        obj.material = obj.material.map(mat => mat.clone());
			        } else {
			        obj.material = obj.material.clone();
			        }

			        if (obj.material.isMeshStandardMaterial || obj.material.isMeshPhysicalMaterial) {
			        this.iblMaterials.push(obj.material);
			        }
			        } */
			    });
			    // 添加反射物体
			    ssrConfig.updateParams({
			        selects: selects // 可能必须要是mesh?
			    });
			}
			
			// TEST:创建一个地板
			/* const floorGeometry = new THREE.PlaneGeometry(200, 200); // 尺寸可调
			const floorMaterial = new THREE.MeshStandardMaterial({
			  color: 0x888888,
			  roughness: 1,   // 粗糙表面，不反射
			  metalness: 0    // 非金属
			});
			const floor = new THREE.Mesh(floorGeometry, floorMaterial);

			// 旋转到水平面
			floor.rotation.x = -Math.PI / 2;

			// 设置接收阴影
			floor.receiveShadow = true;

			// 把地板也加到 carGroup 里
			this.carGroup.add(floor); */

            this.carGroup.add(clone);

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
	
	// animation
	updateCarAnimation(delta) {
	    if (this.carMixer) {
	        this.carMixer.update(delta);
	    }
	}
	
	// 背景动画回调
    updateBgAnimation(delta) {
        if (this.updateCallback) {
            this.updateCallback(delta, this);
        }
    }
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
            //this.scene.background = this.virtualFBO.texture;
        }
        //this.scene.environment = this.virtualFBO.texture;
        // 更新，暂时车和场景都一个，免得不协调
        /* let count = 1;
        const renderVirtual = () => {
            if (frames === Infinity || count < frames) {
                this.virtualCubeCamera.update(this.renderer, this.virtualScene);
                this._updateIBLMaterials(); // 没切换场景前不需要更新

                count++;
            }
            requestAnimationFrame(renderVirtual);
        };
        renderVirtual(); */
    }

    // 设置灯光
    _setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.8);
		this.lights.ambient = ambient;
        this.scene.add(ambient);

		const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
		dirLight.position.set(100, 200, 100); // 高度和距离拉大
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 4096;
		dirLight.shadow.mapSize.height = 4096;

		dirLight.shadow.camera.left = -200;
		dirLight.shadow.camera.right = 200;
		dirLight.shadow.camera.top = 200;
		dirLight.shadow.camera.bottom = -200;
		dirLight.shadow.camera.near = 1;
		dirLight.shadow.camera.far = 500;

		this.lights.directional = dirLight;


		

		// 加辅助线
		const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 2, 0xff0000);
		this.scene.add(dirLightHelper);

        this.scene.add(dirLight);
    }

    // 设置环境
    _setupEnvironment() {
        // 添加车（简化为立方体）
/*         const carGeo = new THREE.BoxGeometry(1, 0.5, 2);
        const carMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6),
            emissive: 0x000000,
			metalness: 1.0,
			roughness: 0.1,
        });
        this.car = new THREE.Mesh(carGeo, carMat);
        this.car.position.set(0, 1, 0);
        this.scene.add(this.car); */

        // 场景标识物
        const markerGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const markerMat = new THREE.MeshStandardMaterial({
            color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
		marker.castShadow = true;
        marker.position.set(0, 2, 0.4);
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
		
		// 各自场景
		eventBus.on("sceneLoaded", (file, sceneName) => {
            const scene = this.scenes.get(sceneName);
		    if(!scene) {return}
			file.traverse(c => {
			    if (c.isMesh) {
					if(c.name.startsWith('shadow')){
						c.castShadow = true;
					}
			        c.receiveShadow = true;
			    }
			});
            scene.content.bgGroup.add(file);
        });
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
		const wrapper = { content: scene, config: new SceneConfig(name), effectComposer: new PostProcessManager(this.renderer, scene.scene, this.camera)};
		this.scenes.set(name, wrapper); 
        if (!this.currentScene)
            this.currentScene = wrapper;
		return wrapper;
    }
	
	addObject(name, object) {
		const targetScene = this.getScene(name);
		if (!targetScene) {
			console.warn('addObject: target scene not found');
			return null;
		}

		targetScene.scene.add(object);
	}

	getScene(name) {
		const sceneWrapper = this.scenes.get(name);
		return sceneWrapper && sceneWrapper.content;
	}

    // 切换场景
    transitionTo(name, speed = 0.1) {
        if (this.isTransitioning)
            return;
        const nextScene = this.scenes.get(name);
        if (!nextScene || nextScene.content === this.currentScene.content)
            return;

        this.nextScene = nextScene;
        this.transitionSpeed = speed;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        // this.renderer.clear();
		
        // 保存当前场景的相机状态
        const camera = CameraManager.getInstance().getCamera();
        this.currentScene.content.saveCameraState(camera);
    }
	
	// 场景后移
	updateSceneMovement(delta) {
		const scenes = [this.currentScene, this.nextScene];
		for (const s of scenes) {
			if (!s || !s.content) continue;
			s.content.updateCarAnimation(delta);
			s.content.updateBgAnimation(delta);
		}
	}
	
    // 更新过渡
    updateTransition(dt) {
        if (!this.isTransitioning)
            return;

        this.transitionProgress += dt * this.transitionSpeed;
        this.transitionMaterial.uniforms.progress.value = this.transitionProgress;
        if (this.transitionProgress >= 1.0) {
			console.log(`Transition ${this.currentScene.content.name} to ${this.nextScene.content.name} done.`)
            this.currentScene = this.nextScene;
            this.nextScene = null;
            this.isTransitioning = false;

            // 应用新场景的相机状态
            //const camera = CameraManager.getInstance().getCamera();
            //this.currentScene.content.applyCameraState(camera);
        }
    }

    // 渲染
    render() {
        if (this.isTransitioning) {
            // 渲染下一个场景到纹理
            // this.renderSceneToRT(this.currentScene.content.scene, this.camera, this.rtCurrent);
            // this.renderSceneToRT(this.nextScene.content.scene, this.camera, this.rtNext);

			this.currentScene.effectComposer.render();
			this.nextScene.effectComposer.render();
			
			this.transitionMaterial.uniforms.tCurrent.value = this.currentScene.effectComposer.composer.readBuffer.texture;// 这里可能用的是renderpass，也可能用的是最后一个pass
            this.transitionMaterial.uniforms.tNext.value    = this.nextScene.effectComposer.composer.readBuffer.texture;
			
            // 渲染过渡 Quad
            if (!this.transitionQuad) {
                const geometry = new THREE.PlaneGeometry(2, 2);
                this.transitionQuad = new THREE.Mesh(geometry, this.transitionMaterial);
            }
			
            this.renderer.render(this.transitionQuad, new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1));
			
        } else {

            // 这两个场景始终颜色空间不一致
			this.currentScene.effectComposer.render();
			this.transitionMaterial.uniforms.tCurrent.value = this.currentScene.effectComposer.composer.readBuffer.texture;
			            if (!this.transitionQuad) {
                const geometry = new THREE.PlaneGeometry(2, 2);
                this.transitionQuad = new THREE.Mesh(geometry, this.transitionMaterial);
            }
			
            this.renderer.render(this.transitionQuad, new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1));
            //this.renderer.render(this.currentScene.content.scene, this.camera);
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
		renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 可选，柔和阴影

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

// ===============================================
// 后处理配置基类
// ===============================================
class PostProcessConfig {
	constructor(name, enabled = true) {
		this.name = name;
		this.enabled = enabled;
		this.pass = null;
	}

	createPass(scene, camera, renderer, size) {
		throw new Error('createPass() must be implemented');
	}

	updateParams(params) {
		throw new Error('updateParams() must be implemented');
	}

	getPass() {
		return this.pass;
	}

	setEnabled(enabled) {
		this.enabled = enabled;
		if (this.pass) {
			this.pass.enabled = enabled;
		}
	}

	dispose() {
		if (this.pass && this.pass.dispose) {
			this.pass.dispose();
		}
	}
}
 // ===============================================
// SSR 后处理配置
// ===============================================
class SSRConfig extends PostProcessConfig {
	constructor(params = {}) {
		super('SSR', params.enabled !== undefined ? params.enabled : true);
		
		this.params = {
			output: params.output !== undefined ? params.output : 0,
			opacity: params.opacity !== undefined ? params.opacity : 0.5,
			maxDistance: params.maxDistance !== undefined ? params.maxDistance : 0.2,
			thickness: params.thickness !== undefined ? params.thickness : 0.018,
			tempColor: params.tempColor !== undefined ? params.tempColor : new THREE.Color(1, 1, 1),
            selects: params.selects || [], // null 是全部反射
			infiniteThick: params.infiniteThick !== undefined ? params.infiniteThick : false,
		};
	}

	createPass(scene, camera, renderer, size) {
		this.pass = new THREE.SSRPass({
			renderer: renderer,
			scene: scene,
			camera: camera,
			width: size.width !== undefined ? size.width : innerWidth,
			height: size.height !== undefined ? size.height : innerHeight,
			selects: this.params.selects|| [],
		});

		// 打印SSRPass的所有属性，用于调试
		console.log('SSRPass properties:', this.pass);
		
		// 设置初始参数
		this.applyParams();
		this.pass.enabled = this.enabled;
		
		return this.pass;
	}

	applyParams() {
		if (!this.pass) return;

		// 直接设置所有可能的属性
		if (this.pass.output !== undefined) {
			this.pass.output = this.params.output;
		}
		
		if (this.pass.opacity !== undefined) {
			this.pass.opacity = this.params.opacity;
		}
		
		if (this.pass.maxDistance !== undefined) {
			this.pass.maxDistance = this.params.maxDistance;
		}
		
		if (this.pass.thickness !== undefined) {
			this.pass.thickness = this.params.thickness;
		}
		
		if (this.pass.infiniteThick !== undefined) {
			this.pass.infiniteThick = this.params.infiniteThick;
		}

		// 尝试通过 ssrMaterial 设置（有些版本的SSRPass参数在material中）
		if (this.pass.ssrMaterial) {
			if (this.pass.ssrMaterial.uniforms) {
				if (this.pass.ssrMaterial.uniforms.opacity) {
					this.pass.ssrMaterial.uniforms.opacity.value = this.params.opacity;
				}
				if (this.pass.ssrMaterial.uniforms.maxDistance) {
					this.pass.ssrMaterial.uniforms.maxDistance.value = this.params.maxDistance;
				}
				if (this.pass.ssrMaterial.uniforms.thickness) {
					this.pass.ssrMaterial.uniforms.thickness.value = this.params.thickness;
				}
			}
		}

		// 强制更新
		if (this.pass.ssrMaterial && this.pass.ssrMaterial.needsUpdate !== undefined) {
			this.pass.ssrMaterial.needsUpdate = true;
		}

		if (this.params.selects && Array.isArray(this.params.selects)) {
		  this.pass.selects = [
			...(this.pass.selects || []),
			...this.params.selects
		  ];
		}
		console.log('Applied SSR params:', this.params);
	}

	updateParams(params) {
	  if (!this.pass) return;
	  for (const key in params) {
		if (key === 'selects' && Array.isArray(params[key])) {
		  // 合并而不是覆盖
		  this.params.selects = [
			...(this.params.selects || []),
			...params.selects
		  ];
		} else {
		  this.params[key] = params[key];
		}
	  }

	  this.applyParams();
	}

	getParams() {
		return Object.assign({}, this.params);
	}
}

// ===============================================
// Bloom 后处理配置
// ===============================================
class BloomConfig extends PostProcessConfig {
	constructor(params = {}) {
		super('Bloom', params.enabled !== undefined ? params.enabled : true);
		
		this.params = {
			strength: params.strength !== undefined ? params.strength : 1.5,
			radius: params.radius !== undefined ? params.radius : 0.4,
			threshold: params.threshold !== undefined ? params.threshold : 0.85,
		};
	}

	createPass(scene, camera, renderer, size) {
		const resolution = new THREE.Vector2(
			size.width !== undefined ? size.width : innerWidth, 
			size.height !== undefined ? size.height : innerHeight
		);
		
		this.pass = new THREE.UnrealBloomPass(
			resolution,
			this.params.strength,
			this.params.radius,
			this.params.threshold
		);

		this.pass.enabled = this.enabled;
		return this.pass;
	}

	updateParams(params) {
		if (!this.pass) return;

		Object.assign(this.params, params);

		if (params.strength !== undefined) {
			this.pass.strength = params.strength;
		}
		if (params.radius !== undefined) {
			this.pass.radius = params.radius;
		}
		if (params.threshold !== undefined) {
			this.pass.threshold = params.threshold;
		}
	}

	getParams() {
		return Object.assign({}, this.params);
	}
}


		
class ModelManager {
    constructor(scene, gui) {
        this._scene = scene;
        this._gui = gui;
        this._model = null;
        this._box = null;
        this._boxPoints = {};

        document.getElementById("carInput")
        .addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file)
                this.loadCarFromFile(file);
        });
		
		document.getElementById("sceneInput")
			.addEventListener("change", (e) => {
				const files = Array.from(e.target.files);
				files.forEach(file => {
					const sceneName = file.name.replace(/\.[^/.]+$/, ""); // 去掉扩展名
					this.loadSceneFromFile(file, sceneName);
				});
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
    loadSceneFromFile(file, sceneName){
		const url = URL.createObjectURL(file);
		const loader = new THREE.GLTFLoader();
		loader.load(url, gltf => {
			eventBus.emit("sceneLoaded", gltf.scene, sceneName);
			URL.revokeObjectURL(url);
		});
	}
    loadCarFromFile(file) {
		const url = URL.createObjectURL(file);
		const loader = new THREE.GLTFLoader();
		loader.load(url, gltf => {
			eventBus.emit("carLoaded", gltf);
			URL.revokeObjectURL(url);
		});
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

class PostProcessManager {
	constructor(renderer, scene, camera) {
		this.renderer = renderer;
		this.scene = scene;
		this.camera = camera;

		// 创建 EffectComposer
		this.composer = new THREE.EffectComposer(renderer);
		this.composer.renderToScreen = false;
		
		// 添加基础渲染 Pass
		this.renderPass = new THREE.RenderPass(scene, camera);
		this.renderPass.renderToScreen = false;
		this.composer.addPass(this.renderPass);
		
		// 后处理配置数组
		this.configs = [];
		
		// 是否启用后处理
		this.enabled = true;
	}

	addConfig(config) {
		const size = this.renderer.getSize(new THREE.Vector2());
		const pass = config.createPass(this.scene, this.camera, this.renderer, size);
		pass.renderToScreen = false;
		this.composer.addPass(pass);
		this.configs.push(config);
		return config;
	}

	removeConfig(nameOrConfig) {
		const config = typeof nameOrConfig === 'string'
			? this.getConfig(nameOrConfig)
			: nameOrConfig;
			
		if (!config) return;

		const index = this.configs.indexOf(config);
		if (index !== -1) {
			const pass = config.getPass();
			if (pass) {
				this.composer.passes = this.composer.passes.filter(p => p !== pass);
			}
			config.dispose();
			this.configs.splice(index, 1);
		}
	}

	getConfig(name) {
		return this.configs.find(c => c.name === name);
	}

	render(deltaTime = 0) {
		if (this.enabled) {
			this.composer.render(deltaTime);
		} else {
			this.renderer.render(this.scene, this.camera);
		}
	}

	setSize(width, height) {
		this.composer.setSize(width, height);
	}

	setPixelRatio(ratio) {
		this.composer.setPixelRatio(ratio);
	}

	setEnabled(enabled) {
		this.enabled = enabled;
	}

	dispose() {
		this.configs.forEach(config => config.dispose());
		this.configs = [];
		
		this.composer.passes.forEach(pass => {
			if (pass.dispose) {
				pass.dispose();
			}
		});
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
	addSSRToGUI(sceneName, bloomConfig){
		const scene = this.sceneManager.scenes.get(sceneName);
		if(!scene){return }
		const cfg = scene.config;
		if (cfg._guiFolder) {
			cfg._guiFolder.add(ssrConfig, 'enabled').name('启用 SSR').onChange(value => {
                ssrConfig.setEnabled(value);
            });

            const outputModes = {
                'Default (默认)': 0,
                'SSR Only (仅反射)': 1,
                'Beauty (美化)': 2,
                'Depth (深度)': 3,
                'Normal (法线)': 4,
                'Metalness (金属度)': 5
            };

            cfg._guiFolder.add(ssrConfig.params, 'output', outputModes).name('输出模式').onChange(value => {
                ssrConfig.updateParams({ output: parseInt(value) });
            });

            cfg._guiFolder.add(ssrConfig.params, 'opacity', 0, 1, 0.01).name('反射不透明度').onChange(value => {
                ssrConfig.updateParams({ opacity: value });
            });

            cfg._guiFolder.add(ssrConfig.params, 'maxDistance', 0, 20, 1).name('最大追踪距离').onChange(value => {
                ssrConfig.updateParams({ maxDistance: value });
            });

            cfg._guiFolder.add(ssrConfig.params, 'thickness', 0, 0.2, 0.001).name('表面厚度').onChange(value => {
                ssrConfig.updateParams({ thickness: value });
            });

            cfg._guiFolder.add(ssrConfig.params, 'infiniteThick').name('无限厚度(快速)').onChange(value => {
                ssrConfig.updateParams({ infiniteThick: value });
            });
		}
	}
	addBloomToGUI(sceneName, bloomConfig){
		const scene = this.sceneManager.scenes.get(sceneName);
		if(!scene){return }
		const cfg = scene.config;
		if (cfg._guiFolder) {
		    cfg._guiFolder.add(bloomConfig, 'enabled').name('启用 Bloom').onChange(value => {
		        bloomConfig.setEnabled(value);
		    });
		    cfg._guiFolder.add(bloomConfig.params, 'strength', 0, 3, 0.01).name('强度').onChange(value => {
		        bloomConfig.updateParams({
		            strength: value
		        });
		    });

		    cfg._guiFolder.add(bloomConfig.params, 'radius', 0, 1, 0.01).name('半径').onChange(value => {
		        bloomConfig.updateParams({
		            radius: value
		        });
		    });

		    cfg._guiFolder.add(bloomConfig.params, 'threshold', 0, 1, 0.01).name('阈值').onChange(value => {
		        bloomConfig.updateParams({
		            threshold: value
		        });
		    });
		}
	}
			
	addSceneToGUI(sceneConfig) {
		const folder = this.gui.addFolder(sceneConfig.name);
		sceneConfig._guiFolder = folder;

		// 通过 SceneManager 获取灯光
		const sceneManager = this.sceneManager;  
		const scene = sceneManager.getScene(sceneConfig.name);

		const ambient = scene.lights.ambient;
		const directional = scene.lights.directional;
		
		// Ambient Light
		const ambFolder = folder.addFolder("Ambient Light");
		ambFolder.addColor({ color: ambient.color.getHex() }, "color")
			.name("Color")
			.onChange(v => ambient.color.set(v));

		ambFolder.add(ambient, "intensity", 0, 5, 0.01)
			.name("Intensity");

		// Directional Light
		const dirFolder = folder.addFolder("Directional Light");
		dirFolder.addColor({ color: directional.color.getHex() }, "color")
			.name("Color")
			.onChange(v => directional.color.set(v));

		dirFolder.add(directional, "intensity", 0, 5, 0.01)
			.name("Intensity");

		dirFolder.add(directional.position, "x", -50, 50);
		dirFolder.add(directional.position, "y", -50, 50);
		dirFolder.add(directional.position, "z", -50, 50);
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