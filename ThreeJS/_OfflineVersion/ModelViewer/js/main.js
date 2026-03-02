const stats = new Stats();
stats.showPanel(0); // 0=FPS 1=MS 2=MB
document.body.appendChild(stats.dom);
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
const ModelManager2 = (() => {
    const loadModel = (file, name = '', toScene = '', isBg = false) => {
        const loader = new THREE.GLTFLoader();
        loader.load(file, gltf => {
            if (isBg) {
                eventBus.emit("sceneLoaded", gltf, name, toScene)
            } else {
                eventBus.emit("carLoaded", gltf, name, toScene);
            }
        });
    };

    const loadHDRI = (url, renderer, scene) => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        new THREE.RGBELoader().load(url, (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            scene.scene.environment = envMap;
            scene.scene.background = envMap;
            texture.dispose();
            pmremGenerator.dispose();
        });
    }

    const setEntityColor = (targetMat, webColor) => {
        const sceneManager = SceneManager.getInstance();
        if (!sceneManager.currentScene || !sceneManager.currentScene.content.carGroup) {
            return;
        }
        const currentCar = sceneManager.currentScene.content.carGroup.getObjectByName("carMain");
        currentCar && currentCar.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
                if (obj.material.name.startsWith(targetMat) || obj.material.name === 'Mt_MirrorCover' || obj.material.name === 'CustomTexture') {
                    const hex = parseInt(webColor.replace("#", "0x"));
                    obj.material.color = new THREE.Color(hex).convertSRGBToLinear();
                }
            }
        });
    };
    const attachOverlay = (obj, texture1) => {
        const overlay = obj.parent.getObjectByName(obj.name + "_overlay");
        if (overlay) {
            overlay.material.map = texture1;
            return;
        }

        const mat = new THREE.MeshBasicMaterial({
            map: texture1,
            transparent: true,
            blending: THREE.NormalBlending,
        });
        mat.needsUpdate = true;

        const clone = obj.clone();
        clone.material = mat;

        clone.position.copy(obj.position);
        clone.rotation.copy(obj.rotation);
        clone.scale.copy(obj.scale);
        clone.scale.multiplyScalar(1.001);

        clone.name = obj.name + "_overlay";

        obj.parent.add(clone);
        return clone;
    };
    const setEntityTexture = (targetMat, texture) => {
        const sceneManager = SceneManager.getInstance();
        if (!sceneManager.currentScene || !sceneManager.currentScene.content.carGroup) {
            return;
        }
        const currentCar = sceneManager.currentScene.content.carGroup.getObjectByName("carMain");
        currentCar && currentCar.traverse(obj => {
            if (obj instanceof THREE.Mesh) {
                if (obj.material.name.startsWith(targetMat)) {
                    const loader = new THREE.TextureLoader();
                    const loadTexture = (url) => {
                        return new Promise((resolve, reject) => {
                            loader.load(
                                url,
                                (texture) => resolve(texture),
                                undefined,
                                (error) => reject(error));
                        });
                    };

                    // 加载多个纹理
                    Promise.all([
                            loadTexture('assets/' + texture + '.png'),
                        ]).then(([texture1]) => {
                        console.log('所有纹理加载完成');
                        texture1.flipY = false;
                        texture1.encoding = THREE.sRGBEncoding;
                        texture.wrapS = THREE.ClampToEdgeWrapping; // 超过 0~1 就裁剪
                        texture.wrapT = THREE.ClampToEdgeWrapping;
                        attachOverlay(obj, texture1);
                    }).catch((error) => {
                        console.error('纹理加载失败:', error);
                    });
                }
            }
        });
    }
    return {
        loadModel,
        loadHDRI,
        setEntityColor,
        setEntityTexture
    }
})();

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
    0: "Start",
    1: "City",
    2: "Forrest",
    //3: "Desert",
};
let sceneId = 1;
//let transitionPending = false; // 防止重复触发
const BG_RESET_Z = -1000;
const BG_RESET_ZPOS = 100;
const clock = new THREE.Clock();
// =========================
//  主入口
// =========================
async function main() {
    // 初始化场景、相机、渲染器，在首个场景中完成，共用
    const sceneManager = SceneManager.getInstance();
    const { renderer, camera } = sceneManager.initBase();
    const hdrManager = HDRManager.init(renderer);
    sceneManager.initHDR(hdrManager);
    const guiManager = GUIManager.init(sceneManager, hdrManager);
    const uiController = UIController.init(hdrManager, guiManager);

    // 初始化相机管理器
    CameraManager.getInstance().init(camera);

    // 创建场景
    const startScene = new StartScene("Start", 0xFF0000, renderer, camera);

    const cityScene = new CityScene("City", 0x443333, renderer, camera);
    /* cityScene.enableCarSSR = true; */
    /* const bgCb = (delta, scene) => {

    };
    cityScene.updateCallback = bgCb; */

    const forrestScene = new ForrestScene("Forrest", 0xB7D1C4, renderer, camera);

    //const desertScene = new CustomScene("Desert", 0x000000, renderer);

    // 4. 加载场景
    forrestScene.load();
    //desertScene.load();
    cityScene.load();
    startScene.load();

    UserInterface.initialize();
    let isReturning = false;
    let isRunning = false;
    UserInterface.setOnStart((isOn) => {
        if (isOn) {
            sceneId = 1;
            isRunning = true;
            sceneManager.transitionTo(sceneTransitions[sceneId]);
        } else {
            isRunning = false;
            isReturning = true; // 新增
        }
    });
    UserInterface.setOnLight((isOn) => {
        isOn ? startScene.turnOnLights() : startScene.turnOffLights();
    });
    UserInterface.setOnEntityColor(ModelManager2.setEntityColor);
    UserInterface.setOnEntityTexture(ModelManager2.setEntityTexture)

    sceneManager.onTransitionComplete = () => {
        if (!isRunning) {
            if (isReturning) {
                isReturning = false;
                sceneManager.transitionTo(sceneTransitions[0]);
            }
            return;
        }
        sceneId = sceneId >= 2 ? 1 : sceneId + 1;
        sceneManager.transitionTo(sceneTransitions[sceneId]);
    };
    // 5. 添加场景到管理器
    // Start
    const scene0 = sceneManager.addScene("Start", startScene);
    guiManager.addSceneToGUI(scene0.config);
    // 添加 SSR 效果
    ssrConfig = scene0.effectComposer.addConfig(new SSRConfig({
                enabled: true,
                opacity: 0.2,
                maxDistance: 0.3,
                thickness: 0.1,
                infiniteThick: false,
                output: 0,
            }));
    guiManager.addSSRToGUI("Start", ssrConfig);

    //scene0.effectComposer.addConfig(new SMAAConfig()); // 作用不大


    // City
    const scene1 = sceneManager.addScene("City", cityScene);
    /*     const cityBloom = new BloomConfig({
    enabled: true,
    strength: 0.2,
    radius: 0.4,
    threshold: 0.5,
    }) */
    /*     const cityBloomConfig = scene1.effectComposer.addConfig(cityBloom);
    guiManager.addBloomToGUI("City", cityBloomConfig);
    guiManager.addSceneToGUI(scene1.config); */
    // scene1.effectComposer.addConfig(new SSAOConfig());

    /*     // 测试物体
    const geometry = new THREE.IcosahedronGeometry(.5, 4);
    const material = new THREE.MeshStandardMaterial({
    color: 'cyan'
    });
    const mesh = new THREE.Mesh(geometry, material);
    sceneManager.addObject("City", mesh); */

    // Forrest
    const scene2 = sceneManager.addScene("Forrest", forrestScene);
    const forrestBloom = new BloomConfig({
        enabled: true,
        selective: true,
        strength: 1.3,
        radius: 0.4,
        threshold: 0.5,
    })

        bloomConfig = scene2.effectComposer.addConfig(forrestBloom);
    guiManager.addBloomToGUI("Forrest", bloomConfig);

    /*     const scene2 = sceneManager.addScene("Start", forrestScene);
    guiManager.addSceneToGUI(scene2.config); */
    /*     const scene3 = sceneManager.addScene("Desert", desertScene);
    guiManager.addSceneToGUI(scene3.config); */

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
    /*     const modelManager = new ModelManager(); */

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

    // 资源加载
    ModelManager2.loadModel('models/carMain.glb', name = 'carMain', toScene = '');
    // City
    ModelManager2.loadModel('models/city.glb', name = 'city', toScene = 'City', isBg = true);
    ModelManager2.loadHDRI('models/hdri/sunflowers_puresky_2k.hdr', renderer, cityScene);

    // Forrest
    ModelManager2.loadModel('models/blackCar.glb', name = 'car1', toScene = 'Forrest');
    ModelManager2.loadModel('models/forrestMountain.glb', name = 'forrestMountain', toScene = 'Forrest', isBg = true);

    let frameCount = 0;

    // 10. 动画循环
    function animate() {
        requestAnimationFrame(animate);
        if (!sceneManager.isReady)
            return;
        stats.begin();

        const dt = sceneManager.clock.getDelta();
        sceneManager.updateTransition(dt);
        sceneManager.updateSceneMovement(dt);
        sceneManager.updateSceneMisc(frameCount, dt);
        frameCount++;

        sceneManager.controls.update();

        // 使用后处理渲染
        // postProcessManager.render();
        sceneManager.render(renderer, camera);
        stats.end();
    }
    animate();

    // orbit
    sceneManager.enableAutoOrbit({
        target: new THREE.Vector3(0, 0.5, 0),
        radius: 24
    });
    const bar = document.querySelector('#loading-bar');
    const text = document.querySelector('#loading-text');

    sceneManager.waitAllReady((progress) => {
        bar.style.width = `${progress * 100}%`;
        text.textContent = `${Math.floor(progress * 100)}%`;
    }).then(() => {
        document.querySelector('#loading').style.display = 'none';
    });
}

// =========================
// 单个场景类
// =========================
class CustomScene {
    constructor(name, bgColor, renderer, camera = null) {
        this.name = name;
        this.camera = camera;
        this.carGroup = new THREE.Group();
        this.bgGroup = new THREE.Group();
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x443333, 0.1, 800);
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
        this.mixers = [];
        this.updateCallback = null;
        this.enableCarSSR = false;

        this._pending = new Set();
        this._total = this._pending.size;
        this.ready = new Promise(resolve => {
            this._readyResolve = resolve;
        });

        // 子类构造函数执行完后检查，用 microtask 确保子类已经填充了 _pending
        Promise.resolve().then(() => {
            if (this._pending.size === 0) {
                this._readyResolve();
            }
        });

        eventBus.on("carLoaded", (...args) => this.HandleCarLoaded(...args));
        eventBus.on("sceneLoaded", (...args) => this.HandleBgLoaded(...args));
    }
    updateResourceNeeded(pending) {
        this._pending = pending;
        this._total = this._pending.size;
    }
    _markLoaded(key) {
        if (!this._pending.has(key))
            return;
        this._pending.delete(key);

        const progress = (this._total - this._pending.size) / this._total;
        eventBus.emit("sceneLoadProgress", {
            name: this.name,
            progress
        });

        if (this._pending.size === 0) {
            this._readyResolve(); // 只 resolve，不重复 emit
        }
    }
    moveBg(dt, resetCb) {
        const stillBg = this.bgGroup;
        if (!stillBg)
            return;
        const speed = 80;
        stillBg.position.z -= speed * dt; // 超过长度后复位
        if (stillBg.position.z < BG_RESET_Z) {
            stillBg.position.z = BG_RESET_ZPOS;
            resetCb && resetCb();
        }
    }
    PlayCarAnimation(gltf, clone) {
        if (!gltf.animations?.length)
            return;
        const mixer = new THREE.AnimationMixer(clone);
        gltf.animations.forEach(clip => mixer.clipAction(clip).play());
        this.mixers.push(mixer);
    }

    HandleBgLoaded(gltf, name, toScene) {
        if (toScene !== '' && this.name !== toScene)
            return;
        if (toScene === 'City') {
            gltf.scene.traverse(c => {
                if (c.isMesh) {
                    if (c.name.startsWith('shadow')) {
                        c.castShadow = true;
                    }
                    c.receiveShadow = true;
                }
            });
        }
        const clone = gltf.scene.clone(true);
        clone.name = name;
        this.bgGroup.add(clone);
    }

    HandleCarLoaded(gltf, name, toScene) {
        if (toScene !== '' && this.name !== toScene)
            return;
        const clone = gltf.scene.clone(true);
        clone.name = name; // 设置唯一标识
        // 克隆材质
        clone.traverse((child) => {
            if (child.isMesh) {
                child.material = child.material.clone();
            }
        });
        this.PlayCarAnimation(gltf, clone);

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
        if (this.mixers) {
            this.mixers.forEach(m => m.update(delta));
        }
    }

    // 背景动画回调
    updateBgAnimation(delta) {
        if (this.updateCallback) {
            this.updateCallback(delta, this);
        }
    }

    // 子类自定义
    updateMisc(frameCount, dt) {}
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
            color: `hsl(${(20 + Math.random() * (80 - 20)) * 360 + 137.5}, 70%, 50%)`,
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
                    colorB: "black",
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
        const ambient = new THREE.AmbientLight(0x8ab4f8, 0.2);
        this.lights.ambient = ambient;
        this.scene.add(ambient);

       /*  const dirLight = new THREE.DirectionalLight(0xfff4e0, 1.07);
        dirLight.position.set(424, 559, -518); */
       /*  dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 4096;
        dirLight.shadow.mapSize.height = 4096;
        dirLight.shadow.bias = -0.005;
        // 关键！扩大阴影相机范围覆盖城市
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 3000;
        dirLight.shadow.camera.left = -500;
        dirLight.shadow.camera.right = 500;
        dirLight.shadow.camera.top = 500;
        dirLight.shadow.camera.bottom = -500;
        dirLight.shadow.camera.updateProjectionMatrix();
        this.renderer.shadowMap.enabled = true; */
        /* const shadowCamHelper = new THREE.CameraHelper(dirLight.shadow.camera);
        this.scene.add(shadowCamHelper); */
        /* this.lights.directional = dirLight; */

        // 加辅助线
        /*        const dirLightHelper = new THREE.DirectionalLightHelper(dirLight, 50, 0xff0000);
        this.scene.add(dirLightHelper); */

        /* this.scene.add(dirLight); */
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
        /*         const markerGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const markerMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.8, 0.5)
        });
        const marker = new THREE.Mesh(markerGeo, markerMat);
        marker.castShadow = true;
        marker.position.set(0, 10, 0.4);
        this.scene.add(marker); */
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

class StartScene extends CustomScene {
    constructor(name, bgColor, renderer, camera) {
        super(name, bgColor, renderer, camera);
    }
    static IS_DEBUG = true;
    static SCENE_COLOR = 0x0a0a0f;
    static LIGHT_SIZE = new THREE.Vector2(24, 12);
    static LIGHT_INTENSITY = 2;
    static LIGHT_COLOR = 0xffffff;
    static LIGHT_POS_LEFT = new THREE.Vector2(0, 16, -18);
    static LIGHT_ROT_LEFT = new THREE.Euler(-135 * Math.PI / 180, 0, -180 * Math.PI / 180);
    static LIGHT_POS_RIGHT = new THREE.Vector2(0, 16, 18);
    static LIGHT_ROT_RIGHT = new THREE.Euler(-45 * Math.PI / 180, 0, 0);
    mTestObject = null;
    leftLight = null;
    rightLight = null;
    lightsOn = false;
    lightTargets = [];
    initLights() {
        this.lightTargets = [this.leftLight, this.rightLight].map(l => l.intensity);
        // 初始状态灯是灭的
        //[this.leftLight, this.rightLight].forEach(l => l.intensity = 0);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    rampUp(light, target, duration) {
        return new Promise(resolve => {
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min((now - start) / duration, 1);
                light.intensity = target * (1 - Math.pow(1 - t, 3));
                t < 1 ? requestAnimationFrame(tick) : resolve();
            };
            requestAnimationFrame(tick);
        });
    }

    async flickerOn(light, targetIntensity) {
        light.intensity = 0;
        const flickerCount = 2 + Math.floor(Math.random() * 4);

        for (let i = 0; i < flickerCount; i++) {
            light.intensity = targetIntensity * (0.3 + Math.random() * 0.4);
            await this.wait(30 + Math.random() * 80);
            light.intensity = 0;
            await this.wait(50 + Math.random() * 150);
        }

        await this.rampUp(light, targetIntensity, 400 + Math.random() * 300);
    }

    async turnOnLights() {
        if (this.lightsOn)
            return;
        this.lightsOn = true;

        // 环境光和平行光渐入
        this.fadeLightIn(this.ambientLight, 0.5, 1500);
        this.fadeLightIn(this.dirLight, 2, 1500);

        const lights = [this.leftLight, this.rightLight];
        for (let i = 0; i < lights.length; i++) {
            this.flickerOn(lights[i], this.lightTargets[i]);
            await this.wait(300 + Math.random() * 500);
        }
    }

    async turnOffLights() {
        if (!this.lightsOn)
            return;
        this.lightsOn = false;

        // 环境光和平行光渐出
        this.fadeLightOut(this.ambientLight, 1500);
        this.fadeLightOut(this.dirLight, 1500);

        const lights = [this.leftLight, this.rightLight];
        for (const light of lights) {
            light.intensity *= 0.3;
            await this.wait(50);
            light.intensity = 0;
        }
    }

    fadeLightIn(light, targetIntensity, duration) {
        if (!light)
            return;
        const start = performance.now();
        const tick = () => {
            const t = Math.min((performance.now() - start) / duration, 1);
            light.intensity = targetIntensity * t;
            if (t < 1)
                requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    fadeLightOut(light, duration) {
        if (!light)
            return;
        const startIntensity = light.intensity;
        const start = performance.now();
        const tick = () => {
            const t = Math.min((performance.now() - start) / duration, 1);
            light.intensity = startIntensity * (1 - t);
            if (t < 1)
                requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    HandleCarLoaded(gltf, name, toScene) {
        if (toScene !== '' && this.name !== toScene)
            return;
        const clone = gltf.scene.clone(true);
        clone.name = name; // 设置唯一标识
        clone.traverse((child) => {
            if (child.isMesh && child.name === 'Obj_Shadow_Plane') {
                // 丢弃指定的 阴影
                child.parent.remove(child);
            }
        });

        if (this.carMixer === null) {
            this.carMixer = new THREE.AnimationMixer(clone);
        }

        // 播放所有动画（如果有多个）
        if (this.carMixer && gltf.animations && gltf.animations.length > 0) {
            gltf.animations.forEach(clip => {
                const action = this.carMixer.clipAction(clip);
                action.play();
            });
        }
        this.carGroup.add(clone);
    }
    addAmbientLight() {
        this.ambientLight = new THREE.AmbientLight(0x1a1a2e, 1);
        this.scene.add(this.ambientLight);

        this.dirLight = new THREE.DirectionalLight(0xfff0d0, 2);
        this.dirLight.position.set(5, 10, 5);
        this.scene.add(this.dirLight);
    };
    addTestObject() {
        if (this.mTestObject) {
            this.scene.remove(this.mTestObject);
            this.mTestObject.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => mat.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.mTestObject = null;
        }

        const geo = new THREE.BoxGeometry(1, 1, 1);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            metalness: 0.1,
            roughness: 0.2
        });

        const cube = new THREE.Mesh(geo, mat);
        cube.name = "添加测试物体";
        cube.position.y = 2;
        this.mTestObject = cube;
        this.scene.add(cube);
        return cube;
    };
    createAreaLight(color, intensity, size, visible) {
        const rectLight = new THREE.RectAreaLight(color, intensity, size.x, size.y);
        /* if (visible) {
        const rectHelper = new THREE.RectAreaLightHelper(rectLight, 0xffffff);
        // rectLight.add(rectHelper);
        } */
        return rectLight;
    }

    _setupLights() {
        // rect light
        THREE.RectAreaLightUniformsLib.init();
        this.leftLight = this.createAreaLight(StartScene.LIGHT_COLOR, StartScene.LIGHT_INTENSITY, StartScene.LIGHT_SIZE, StartScene.IS_DEBUG);
        this.leftLight.position.set(StartScene.LIGHT_POS_LEFT.x, StartScene.LIGHT_POS_LEFT.y, -18);
        this.leftLight.rotation.copy(StartScene.LIGHT_ROT_LEFT);
        this.scene.add(this.leftLight);

        this.rightLight = this.createAreaLight(StartScene.LIGHT_COLOR, StartScene.LIGHT_INTENSITY, StartScene.LIGHT_SIZE, StartScene.IS_DEBUG);
        this.rightLight.position.set(StartScene.LIGHT_POS_RIGHT.x, StartScene.LIGHT_POS_RIGHT.y, 18);
        this.rightLight.rotation.copy(StartScene.LIGHT_ROT_RIGHT);
        this.scene.add(this.rightLight);

        // ambient
        this.addAmbientLight();

        // 存储初始arealight强度
        this.initLights();
    };
    _setupEnvironment() {
        // camera
        this.camera.position.set(0,2, 24);
        this.camera.lookAt(0, 0, 0);
        // bg
        this.scene.background = new THREE.Color(StartScene.SCENE_COLOR);
        this.scene.fog = new THREE.Fog(StartScene.SCENE_COLOR, 30, 100);
        //this.addTestObject();

        // ground
        /*       const groundGeometry = new THREE.PlaneGeometry(250, 250);
        const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground); */
    };
    _setVirtualEnvironment() {};
}
class CarController {
    constructor(mesh, options = {}) {
        this.mesh = mesh;
        this.speed = options.speed ?? 5;
        this.isFast = options.isFast ?? false;
        this.wheelbase = options.wheelbase ?? 10;
        this.lookahead = options.lookahead ?? 12;
        this.maxSteerAngle = options.maxSteerAngle ?? THREE.MathUtils.degToRad(4);
        this.overtakeLaneX = options.overtakeLaneX ?? 4.0;
        this.defaultLaneX = options.defaultLaneX ?? 0;
        this.targetX = this.defaultLaneX;
        // 记录初始状态用于复位
        this._initPosition = mesh.position.clone();
        this._initQuaternion = mesh.quaternion.clone();
        // 当前目标横向位置
        this.targetX = this.defaultLaneX;
        this.movingBg = options.bgGroup;
    }
    reset(other) {
        this.mesh.position.copy(this._initPosition);
        // 用初始四元数复位，而不是 rotation.y
        this.mesh.quaternion.copy(this._initQuaternion); // 见下方
        this.targetX = this.defaultLaneX;
        if (other)
            other.reset();
    }
    setTargetLane(x) {
        this.targetX = x;
    }

    update(delta, other = null) {
        // 1. 超车决策（只有快车才执行）
        if (this.isFast && other) {
            const relativeZ = other.mesh.position.z - this.mesh.position.z;
            if (relativeZ > -425 && relativeZ < 320) {
                this.targetX = this.overtakeLaneX;
            } else {
                this.targetX = this.defaultLaneX;
            }
        }

        // 2. Pure Pursuit：计算前视目标点
        //    localForward：车头方向在世界坐标的投影
        const localForward = new THREE.Vector3(0, 0, this.lookahead);
        localForward.applyQuaternion(this.mesh.quaternion);

        //    目标点：横向对准 targetX，纵向在车头前方
        const targetPos = new THREE.Vector3(
                this.targetX,
                0,
                this.mesh.position.z + this.lookahead);

        //    转换到车的本地坐标系（车自己是原点，车头是 +Z）
        const localTarget = this.mesh.worldToLocal(targetPos.clone());

        //    alpha：目标点偏离车头方向的角度
        const distance = localTarget.length();
        const alpha = Math.atan2(localTarget.x, localTarget.z);

        //    Pure Pursuit 转向角公式
        let steeringAngle = Math.atan2(
                2 * this.wheelbase * Math.sin(alpha),
                distance);

        // 3. 转向角限位
        steeringAngle = THREE.MathUtils.clamp(
                steeringAngle,
                -this.maxSteerAngle,
                this.maxSteerAngle);

        // 4. 应用动力学
        // 偏航角变化率 = (速度 / 轴距) * tan(转向角)
        const yawRate = (this.speed / this.wheelbase) * Math.tan(steeringAngle);
        // 绕世界 Y 轴旋转一个增量四元数
        const deltaYaw = new THREE.Quaternion();
        deltaYaw.setFromAxisAngle(
            new THREE.Vector3(0, 1, 0), // 世界 Y 轴
            yawRate * delta);
        this.mesh.quaternion.premultiply(deltaYaw); // premultiply = 世界空间旋转

        // 强制只保留 Y 轴旋转
        const euler = new THREE.Euler().setFromQuaternion(this.mesh.quaternion, 'YXZ');
        euler.x = 0;
        euler.z = 0;
        this.mesh.quaternion.setFromEuler(euler);

        // 位移：沿车身本地 +Z 轴前进
        const direction = new THREE.Vector3(0, 0, 1);
        direction.applyQuaternion(this.mesh.quaternion);
        this.mesh.position.add(direction.multiplyScalar(this.speed * delta));
    }
};

class CityScene extends CustomScene {
    constructor(name, bgColor, renderer, camera) {
        super(name, bgColor, renderer, camera);
        this.updateResourceNeeded(new Set(['carMain', 'city']));
    }
    HandleBgLoaded(gltf, name, toScene) {
        if (toScene !== '' && this.name !== toScene)
            return;
        if (toScene === 'City') {
            gltf.scene.traverse(c => {
                if (c.isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });
        }
        const clone = gltf.scene.clone(true);
        clone.name = name;
        clone.rotation.y = Math.PI / 2;
        clone.scale.set(6, 6, 6);
        clone.position.x += 29;
        clone.position.z += 144;

        this.bgGroup.add(clone);

        /* // 添加一个地面接收阴影
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = 4;
        ground.receiveShadow = true;
        this.scene.add(ground);

        // 添加一个方块投射阴影
        const boxGeo = new THREE.BoxGeometry(10, 10, 10);
        const boxMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(0, 15, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box); */

        // 遍历设置强度
        clone.traverse(child => {
            if (child.isMesh && child.material) {
                child.material.envMapIntensity = 0.2;
                child.material.needsUpdate = true;
            }
        });
        this._markLoaded(name);

    }
    HandleCarLoaded(gltf, name, toScene) {
        super.HandleCarLoaded(gltf, name, toScene);
        // 遍历设置强度
        this.carGroup.traverse(child => {
            if (child.isMesh && child.material) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.envMapIntensity = 0.8;
                child.material.needsUpdate = true;
            }
        });
        this._markLoaded(name);

    }
    updateMisc(frameCount, dt) {
        this.moveBg(dt)

    }
}
class ForrestScene extends CustomScene {

    constructor(name, bgColor, renderer, camera) {
        super(name, bgColor, renderer, camera);
        this.scene.fog = new THREE.Fog(0x0a0f1a, 0.1, 2800);
        this.cubeCamera = null;
        this.skyMat = null;
        this.cubeRT = null;
        this.sky = null;
        this.fastCar = null;
        this.slowCar = null;
        /*         const axesHelper = new THREE.AxesHelper(10);
        this.scene.add(axesHelper); */

        this.updateResourceNeeded(new Set(['carMain', 'car1', 'forrestMountain']));
    }

    _setupLights() {
        /* // rect light
        THREE.RectAreaLightUniformsLib.init();
        this.leftLight = this.createAreaLight(StartScene.LIGHT_COLOR, StartScene.LIGHT_INTENSITY, StartScene.LIGHT_SIZE, StartScene.IS_DEBUG);
        this.leftLight.position.set(StartScene.LIGHT_POS_LEFT.x, StartScene.LIGHT_POS_LEFT.y, -18);
        this.leftLight.rotation.copy(StartScene.LIGHT_ROT_LEFT);
        this.scene.add(this.leftLight);

        this.rightLight = this.createAreaLight(StartScene.LIGHT_COLOR, StartScene.LIGHT_INTENSITY, StartScene.LIGHT_SIZE, StartScene.IS_DEBUG);
        this.rightLight.position.set(StartScene.LIGHT_POS_RIGHT.x, StartScene.LIGHT_POS_RIGHT.y, 18);
        this.rightLight.rotation.copy(StartScene.LIGHT_ROT_RIGHT);
        this.scene.add(this.rightLight);

        // ambient
        this.addAmbientLight();

        // 存储初始arealight强度
        this.initLights(); */

    };
    _setupEnvironment() {
        //this.scene.fog = new THREE.FogExp2(0x0a1a2e, 0.1);
        // camera
        this.camera.position.set(0, 1.5, 5);
        this.camera.lookAt(0, 0, 0);
        // bg
        this.scene.background = null;

        // sky
        this.skyMat = new THREE.ShaderMaterial({
            uniforms: {
                iTime: {
                    value: 0
                },
                iResolution: {
                    value: new THREE.Vector2(innerWidth, innerHeight)
                }
            },
            vertexShader: document.getElementById('aurora-vert').textContent,
            fragmentShader: document.getElementById('aurora-frag').textContent,
            side: THREE.BackSide,
            depthWrite: false
        });

        this.sky = new THREE.Mesh(new THREE.SphereGeometry(1600, 64, 32), this.skyMat);
        this.scene.add(this.sky);

        // ambient
        this.scene.add(new THREE.AmbientLight(0x223355, 0.4));

        // cube camera
        this.cubeRT = new THREE.WebGLCubeRenderTarget(32, {
            format: THREE.RGBAFormat,
            generateMipmaps: true,
            minFilter: THREE.LinearMipmapLinearFilter,
            encoding: THREE.sRGBEncoding
        });
        this.cubeCamera = new THREE.CubeCamera(0.1, 1400, this.cubeRT);
        this.scene.add(this.cubeCamera);

        /* // bg
        this.scene.background = new THREE.Color(StartScene.SCENE_COLOR);
        this.scene.fog = new THREE.Fog(StartScene.SCENE_COLOR, 30, 100);
        this.addTestObject();

        // ground
        const groundGeometry = new THREE.PlaneGeometry(250, 250);
        const groundMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.2
        });

        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        this.scene.add(ground); */
    };
    _setVirtualEnvironment() {};

    HandleBgLoaded(gltf, name, toScene) {
        super.HandleBgLoaded(gltf, name, toScene);
        const forrestMountain = this.bgGroup.getObjectByName("forrestMountain");
        if (!forrestMountain)
            return;
        forrestMountain.rotation.y = 2 * (Math.PI / 180);
        forrestMountain.position.set(583, -263.4, 582);
        forrestMountain.scale.setScalar(7);

        forrestMountain.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                // 桥面能遮挡光（产生阴影）
                obj.castShadow = true;
                // 桥面下方能接收阴影
                obj.receiveShadow = true;
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                materials.forEach(mat => {
                    mat.envMap = this.cubeRT && this.cubeRT.texture;
                    mat.needsUpdate = true;

                });
            }
        });

        this._markLoaded(name);
    }
    HandleCarLoaded(gltf, name, toScene) {
        if (toScene !== '' && this.name !== toScene)
            return;
        const clone = gltf.scene.clone(true);
        clone.name = name;
        clone.traverse((obj) => {
            if (obj.isMesh && obj.material) {
                obj.layers.enable(BloomConfig.BLOOM_LAYER);
                const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                materials.forEach(mat => {
                    mat.envMap = this.cubeRT && this.cubeRT.texture;
                    mat.envMapIntensity = 2.5;
                    //mat.roughness = 0.1;
                    //mat.metalness = 0.9;
                    mat.needsUpdate = true;
                });
            }
        });

        const interiorGroup = new THREE.Group();
        interiorGroup.name = name;
        interiorGroup.add(clone);
        this.carGroup.add(interiorGroup);
        // 车同名组
        this.setupHeadLights(interiorGroup);
        this.setupCarOvertake();
        this.PlayCarAnimation(gltf, clone);

        this._markLoaded(name);
    }
    setupCarOvertake() {
        const containerA = this.carGroup.getObjectByName("carMain");
        const containerB = this.carGroup.getObjectByName("car1");
        if (!containerA || !containerB) {
            return;
        }

        this.slowCar = new CarController(containerA, {
            speed: 0,
            isFast: false,
            bgGroup: this.bgGroup
        });
        containerB.position.set(0, 0, -400);
        // setupCarOvertake 里，模型加载完直接打印

        this.fastCar = new CarController(containerB, {
            speed: 80,
            isFast: true,
            wheelbase: 10,
            overtakeLaneX: 20.0,
            lookahead: 150,
        });
    }
    setupHeadLights(carGroup) {
        const sceneMgr = SceneManager.getInstance();
        const wrapper = sceneMgr.getScene(this.name);
        const car = carGroup.getObjectByName(carGroup.name);
        if (!wrapper || !wrapper.effectComposer || !car)
            return;
        const bloom = wrapper.effectComposer.getConfig('Bloom');

        // 车头灯
        const headLightContainer = carGroup.getObjectByName('Obj_HeadLight');
        let targetHeadMesh = null;
        if (headLightContainer) {
            headLightContainer.traverse((child) => {
                if (child.isMesh) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    if (materials.some(mat => mat.name === "Mt_Light_Emissive")) {
                        targetHeadMesh = child;
                    }
                }
            });
        }
        if (targetHeadMesh) {
            targetHeadMesh.material.emissive = new THREE.Color(4.0, 4.0, 4.0);
            bloom?.addMesh(targetHeadMesh);
        }

        // 尾灯
        const tailLightContainer = car.getObjectByName('Obj_Tail_Light');
        const targetTailMesh = [];
        const emissiveMap = {
            "Mt_Reflector_BL": new THREE.Color(1, 0.1, 0.05),
            "Mt_Reflector_TL": new THREE.Color(1, 0.6, 0.0),
            "Mt_Reflector_RL": new THREE.Color(1, 1, 1),
            "LIGT_RED.001":    new THREE.Color(1, 0, 0),
        };

        if (tailLightContainer) {
            tailLightContainer.traverse((child) => {
                if (!child.isMesh)
                    return;
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    const emissiveColor = emissiveMap[mat.name];
                    if (emissiveColor) {
                        mat.emissive = emissiveColor;
                        mat.emissiveIntensity = 1.0;
                        mat.needsUpdate = true;
                        if (!targetTailMesh.includes(child))
                            targetTailMesh.push(child);
                    }
                });
            });
        }
        targetTailMesh.forEach(mesh => bloom?.addMesh(mesh));

        // 计算包围盒（世界坐标）
        const box = new THREE.Box3().setFromObject(car);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // size.z > size.x 说明车身沿z轴更长，车头朝z方向
        const isFacingZ = size.z > size.x;
        const sideSize = isFacingZ ? size.x : size.z;

        // 车头朝 -z（box.min.z）还是 +z（box.max.z）、-x 还是 +x
        // 根据模型约定：isFacingZ时车头在 -z 侧，否则车头在 -x 侧
        const forwardDir = isFacingZ
             ? new THREE.Vector3(0, 0, 1)
             : new THREE.Vector3(-1, 0, 0);

        // 灯位置（世界坐标），放在车头两侧
        const headZ = isFacingZ ? box.min.z : center.z;
        const headX = isFacingZ ? center.x : box.min.x;

        const leftPos = new THREE.Vector3(
                isFacingZ ? center.x - sideSize * 0.3 : headX + size.x * 0.05,
                center.y + size.y * 0.1,
                isFacingZ ? headZ + 24 : center.z - sideSize * 0.3);
        const rightPos = new THREE.Vector3(
                isFacingZ ? center.x + sideSize * 0.3 : headX + size.x * 0.05,
                center.y + size.y * 0.1,
                isFacingZ ? headZ + 24 : center.z + sideSize * 0.3);

        // target：沿车头方向延伸，略微向下
        const leftTargetPos = leftPos.clone().addScaledVector(forwardDir, sideSize * 2);
        leftTargetPos.y += size.y * 0.1;
        const rightTargetPos = rightPos.clone().addScaledVector(forwardDir, sideSize * 2);
        rightTargetPos.y += size.y * 0.1;

        // 创建灯和target
        this.leftTarget = new THREE.Object3D();
        this.rightTarget = new THREE.Object3D();

        const makeSpotLight = (target) => {
            const light = new THREE.SpotLight(0xffffff, 4);
            light.layers.set(BloomConfig.NO_BLOOM_LAYER);
            light.angle = Math.PI / 8;
            light.penumbra = 1.0;
            light.distance = 100;
            light.castShadow = true;
            light.shadow.bias = -0.1;
            light.target = target;
            return light;
        };

        this.leftLight = makeSpotLight(this.leftTarget);
        this.rightLight = makeSpotLight(this.rightTarget);

        carGroup.add(this.leftLight, this.leftTarget, this.rightLight, this.rightTarget);

        // 转为 carGroup 局部坐标后设置灯位置
        carGroup.worldToLocal(leftPos);
        carGroup.worldToLocal(rightPos);
        carGroup.worldToLocal(leftTargetPos);
        carGroup.worldToLocal(rightTargetPos);

        this.leftLight.position.copy(leftPos);
        this.rightLight.position.copy(rightPos);
        this.leftTarget.position.copy(leftTargetPos);
        this.rightTarget.position.copy(rightTargetPos);
    }
    updateMisc(frameCount, dt) {
        const t = clock.getElapsedTime();
        if (frameCount % 3 === 0) {
            this.sky.position.copy(this.camera.position); // 天空盒跟随相机
            this.skyMat.uniforms.iTime.value = t;
            this.cubeCamera.position.set(0, 1.05, 0); // 暂时固定
            this.carGroup.visible = false;
            this.cubeCamera.update(this.renderer, this.scene);
            this.carGroup.visible = true;
        }

        this.moveBg(dt, () => this.slowCar && this.slowCar.reset(this.fastCar))

        if (!this.slowCar || !this.fastCar) {
            return;
        }
        this.slowCar.update(dt, this.fastCar);
        this.fastCar.update(dt, this.slowCar);

    }

}
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

class AutoOrbit {
    constructor(camera, controls, target = new THREE.Vector3(0, 0, 0)) {
        this.camera = camera;
        this.controls = controls;
        this.target = target;
        this.enabled = true;
        this.userInteracting = false;
        this.resumeDelay = 3000;
        this.resumeTimer = null;

        // 当前角度
        this.theta = 0;
        this.phi = Math.PI / 2; // 从平视开始
        this.radius = 8;
        this.baseRadius = 8;

        // 目标角度
        this.targetTheta = 0;
        this.targetPhi = Math.PI / 2;
        this.targetRadius = 8;

        // Roll（绕相机Z轴/视线方向旋转）
        this.roll = 0;
        this.targetRoll = 0;

        // 速度
        this.baseSpeed = 0.003;
        this.time = 0;

        // 垂直角限制：平视到水平面以上30°
        this.minPhi = Math.PI / 3; // 60°，俯视30°
        this.maxPhi = Math.PI / 2; // 90°，平视

        this._bindEvents();
    }

    _bindEvents() {
        const onStart = () => {
            this.userInteracting = true;
            clearTimeout(this.resumeTimer);
        };
        const onEnd = () => {
            clearTimeout(this.resumeTimer);
            this.resumeTimer = setTimeout(() => {
                this.userInteracting = false;
                this._syncFromCamera();
            }, this.resumeDelay);
        };
        this.controls.addEventListener('start', onStart);
        this.controls.addEventListener('end', onEnd);
    }

    _syncFromCamera() {
        const offset = this.camera.position.clone().sub(this.target);
        this.radius = offset.length();
        this.baseRadius = this.radius;
        this.theta = Math.atan2(offset.x, offset.z);
        this.phi = Math.acos(Math.max(-1, Math.min(1, offset.y / this.radius)));
        this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));

        this.targetTheta = this.theta;
        this.targetPhi = this.phi;
        this.targetRadius = this.radius;

        // 恢复自动时，roll也平滑归零
        this.targetRoll = 0;
    }

    update(deltaTime) {
        if (!this.enabled || this.userInteracting)
            return;
        this.time += deltaTime;

        // 水平旋转
        const speed = this.baseSpeed + Math.sin(this.time * 0.3) * 0.001;
        this.targetTheta += speed;

        // 垂直漂移，在 [minPhi, maxPhi] 内来回
        this.targetPhi += Math.sin(this.time * 0.08) * 0.002;
        this.targetPhi = Math.max(this.minPhi, Math.min(this.maxPhi, this.targetPhi));

        // 远近漂移
        this.targetRadius = this.baseRadius + Math.sin(this.time * 0.12) * 2;

        // Roll 漂移（绕视线轴轻微摇晃，±15°）
        this.targetRoll = Math.sin(this.time * 0.05) * (Math.PI / 12);

        // Lerp 平滑
        this.theta += (this.targetTheta - this.theta) * 0.05;
        this.phi += (this.targetPhi - this.phi) * 0.05;
        this.radius += (this.targetRadius - this.radius) * 0.03;
        this.roll += (this.targetRoll - this.roll) * 0.02;

        // 球坐标 → 笛卡尔
        const sinPhi = Math.sin(this.phi);
        const cosPhi = Math.cos(this.phi);
        const sinTheta = Math.sin(this.theta);
        const cosTheta = Math.cos(this.theta);

        const x = this.target.x + this.radius * sinPhi * sinTheta;
        const y = this.target.y + this.radius * cosPhi;
        const z = this.target.z + this.radius * sinPhi * cosTheta;

        this.camera.position.lerp(new THREE.Vector3(x, y, z), 0.05);

        // 计算带 roll 的 up 向量
        // 先求出不带 roll 时的默认 up（垂直于视线且朝向Y轴侧）
        const forward = new THREE.Vector3()
            .subVectors(this.target, this.camera.position)
            .normalize();

        // 世界Y轴在视线平面上的投影作为基准 up
        const worldUp = new THREE.Vector3(0, 1, 0);
        const right = new THREE.Vector3().crossVectors(forward, worldUp).normalize();
        const baseUp = new THREE.Vector3().crossVectors(right, forward).normalize();

        // 绕 forward 旋转 roll 角
        const rollQuat = new THREE.Quaternion().setFromAxisAngle(forward, this.roll);
        const rolledUp = baseUp.clone().applyQuaternion(rollQuat);

        this.camera.up.copy(rolledUp);
        this.camera.lookAt(this.target);

        if (this.controls.target) {
            this.controls.target.copy(this.target);
        }
        this.controls.update();
    }

    setTarget(target) {
        this.target.copy(target);
    }

    setRadius(r) {
        this.radius = r;
        this.baseRadius = r;
        this.targetRadius = r;
    }

    dispose() {
        clearTimeout(this.resumeTimer);
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
    controls = null;
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
        this.onTransitionComplete = null;
        this.isReady = false;
        this.autoOrbit = null; // 全局共享

        // 车均为一个，各自场景以文件名区分
        eventBus.on("sceneLoaded", (file, sceneName) => {
            const scene = this.scenes.get(sceneName);
            if (!scene) {
                return
            }
            if (sceneName === 'City') {
                file.traverse(c => {
                    if (c.isMesh) {
                        if (c.name.startsWith('shadow')) {
                            c.castShadow = true;
                        }
                        c.receiveShadow = true;
                    }
                });
            }

            scene.content.bgGroup.add(file);
        });

        eventBus.on("sceneLoadProgress", ({
                name,
                progress
            }) => {
            console.log(`${name} ${progress * 100}%`);
        });
    }
    initHDR(hdrManager) {
        this.hdrManager = hdrManager;
    }
    enableAutoOrbit(options = {}) {
        if (this.autoOrbit)
            this.autoOrbit.dispose();
        this.autoOrbit = new AutoOrbit(
                this.camera,
                this.controls,
                options.target || new THREE.Vector3(0, 0, 0));
        if (options.radius)
            this.autoOrbit.setRadius(options.radius);
    }

    disableAutoOrbit() {
        this.autoOrbit?.dispose();
        this.autoOrbit = null;
    }
    renderSceneToRT(scene, camera, rt) {
        this.renderer.setRenderTarget(rt);
        this.renderer.clear();
        this.renderer.render(scene, camera);
        this.renderer.setRenderTarget(null);
    }

    updateSceneIBL(sceneName) {
        if (sceneName === null) {
            scene.content.scene.environment = null;
            scene.content.scene.background = null;
            return;
        }

        const scene = this.scenes.get(sceneName);
        if (!scene) {
            return
        }
        const cfg = scene.config;
        const env = cfg.enableEnvHDR ? this.hdrManager.getEnv(cfg.hdrName) : null;
        scene.content.scene.environment = env;
        scene.content.scene.background = env;
    }
    updateTransitionTextures() {
        this.transitionMaterial.uniforms.tCurrent.value = this.rtCurrent.texture;
        this.transitionMaterial.uniforms.tNext.value = this.rtNext.texture;
    }
    _warmupByComposer(name, effectComposer) {
        // 直接用它自己的 composer 渲染一帧到它自己的 buffer
        // composer 内部会自己管理 renderTarget，不会干扰其他 composer
        effectComposer.render();
        console.log(`${name}预热完成:`, this.renderer.info.programs?.length);
    }

    async waitAllReady(onProgress) {
        const scenes = [...this.scenes.values()];
        const total = scenes.length;

        // 记录每个场景的进度
        const progressMap = new Map(scenes.map(s => [s.content.name, 0]));

        eventBus.on("sceneLoadProgress", ({
                name,
                progress
            }) => {
            progressMap.set(name, progress);
            // 所有场景进度求平均
            const totalProgress = [...progressMap.values()].reduce((a, b) => a + b, 0) / total;
            onProgress?.(totalProgress);
        });

        await Promise.all(scenes
            .filter(s => s.content.ready)
            .map(s => s.content.ready.then(() => {
                    this._warmupByComposer(s.content.name, s.effectComposer);
                })));

        this.isReady = true;
    }

    // 添加场景
    addScene(name, scene) {
        console.log('addScene called:', name);
        const wrapper = {
            content: scene,
            config: new SceneConfig(name),
            effectComposer: new PostProcessManager(this.renderer, scene.scene, this.camera)
        };
        this.scenes.set(name, wrapper);
        if (!this.currentScene)
            this.currentScene = wrapper;

        return wrapper;
    }

    addObject(name, object) {
        const targetScene = this.getScene(name).content;
        if (!targetScene) {
            console.warn('addObject: target scene not found');
            return null;
        }

        targetScene.scene.add(object);
    }

    getScene(name) {
        const sceneWrapper = this.scenes.get(name);
        return sceneWrapper;
    }

    // 切换场景
    transitionTo(name, speed = 0.3) {
        if (this.isTransitioning)
            return;
        const nextScene = this.scenes.get(name);
        if (!nextScene || nextScene.content === this.currentScene.content)
            return;

        // 随机选一个角 0~3
        const corner = Math.floor(Math.random() * 4);
        this.transitionMaterial.uniforms.corner.value = corner;
        // 随机速度，影响边界模糊程度
        this.transitionMaterial.uniforms.edgeWidth.value = 0.03 + Math.random() * 0.1;
        this.nextScene = nextScene;

        this.transitionSpeed = speed;

        this.isTransitioning = true;
        this.transitionProgress = 0;
        // this.renderer.clear();

        // 保存当前场景的相机状态
        this.currentScene.content.saveCameraState(this.camera);
    }

    // 场景后移
    updateSceneMovement(delta) {
        const scenes = [this.currentScene, this.nextScene];
        for (const s of scenes) {
            if (!s || !s.content)
                continue;
            s.content.updateCarAnimation(delta);
            s.content.updateBgAnimation(delta);

        }

        this.autoOrbit?.update(delta);
    }

    // 只更新当前是不行的，因为过渡是渐进，需要同时
    updateSceneMisc(frameCount, dt) {
        const scenes = [this.currentScene, this.nextScene];
        for (const s of scenes) {
            if (!s || !s.content)
                continue;
            // 眨眼补帧
            s.content.updateMisc(frameCount, dt);
        }
    }

    // 更新过渡
    updateTransition(dt) {
        if (!this.isTransitioning)
            return;

        this.transitionProgress += dt * this.transitionSpeed;
        this.transitionMaterial.uniforms.progress.value = Math.min(this.transitionProgress, 1.0);
        if (this.transitionProgress >= 1.0) {
            console.log(`Transition ${this.currentScene.content.name} to ${this.nextScene.content.name} done.`)
            this.currentScene = this.nextScene;
            this.nextScene = null;
            this.isTransitioning = false;
            setTimeout(() => {
                console.log('Complete triggered')
                this.onTransitionComplete?.();
            }, 4500);

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

            this.transitionMaterial.uniforms.tCurrent.value = this.currentScene.effectComposer.composer.readBuffer.texture; // 这里可能用的是renderpass，也可能用的是最后一个pass
            this.transitionMaterial.uniforms.tNext.value = this.nextScene.effectComposer.composer.readBuffer.texture;

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
            this.transitionMaterial.uniforms.progress.value = 0.0;
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
                corner: {
                    value: 0
                }, // 0=左上 1=右上 2=左下 3=右下
                edgeWidth: {
                    value: 0.05
                },
            },
            vertexShader: `
			  varying vec2 vUv;
			  void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
			  }
			`,
            fragmentShader: `
precision mediump float;
uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform float progress;
uniform int corner;
uniform float edgeWidth;
varying vec2 vUv;

vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
        mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(vec2 p) {
    float value = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 3; i++) {
        value += amp * noise(p * freq);
        amp *= 0.5;
        freq *= 2.0;
    }
    return value;
}

void main() {
    vec3 c = texture2D(tCurrent, vUv).rgb;
    vec3 n = texture2D(tNext, vUv).rgb;

    // 选定角的坐标
    vec2 origin;
    if (corner == 0)      origin = vec2(0.0, 1.0); // 左上
    else if (corner == 1) origin = vec2(1.0, 1.0); // 右上
    else if (corner == 2) origin = vec2(0.0, 0.0); // 左下
    else                  origin = vec2(1.0, 0.0); // 右下

    // 到该角的距离，最大值是对角线长度 sqrt(2) ≈ 1.414
    float dist = distance(vUv, origin) / 1.414;

    float noiseVal = dist + fbm(vUv * 3.0) * 0.15;
    float mixAmount = smoothstep(progress - edgeWidth, progress + edgeWidth, noiseVal);

    vec3 color = mix(n, c, mixAmount);
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
            antialias: true,
            logarithmicDepthBuffer: true
        });
        renderer.setSize(w, h);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap; // 可选，柔和阴影

        // renderer.outputEncoding = THREE.sRGBEncoding;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 2.0;
        renderer.outputEncoding = THREE.sRGBEncoding;
        // renderer.outputColorSpace = THREE.SRGBColorSpace;
        // // renderer.outputEncoding = THREE.LinearEncoding;
        // renderer.toneMapping = THREE.NoToneMapping;
        document.body.appendChild(renderer.domElement);
        const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 2600);
        camera.position.set(0, 2, 3);
        this.controls = new THREE.OrbitControls(camera, renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.01;
        this.controls.maxPolarAngle = Math.PI / 2;
        this.controls.minDistance = 18; // 最近能推到多近
        this.controls.maxDistance = 50; // 最远能拉到多远
        this.renderer = renderer;
        this.camera = camera;
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        return {
            renderer,
            camera
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
                new THREE.Vector2(window.innerWidth * this.renderer.getPixelRatio(), window.innerHeight * this.renderer.getPixelRatio()),
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

class SSAOConfig extends PostProcessConfig {
    constructor() {
        super('SSAO', true);
    }

    createPass(scene, camera, renderer, size) {
        this.pass = new THREE.SSAOPass(
                scene,
                camera,
                size.width || window.innerWidth,
                size.height || window.innerHeight);
        this.pass.kernelRadius = 16;
        this.pass.kernelSize = 64;
        this.pass.sigma = 4;
        this.pass.rings = 4;
        this.pass.minDistance = 0.005;
        this.pass.maxDistance = 0.2;
        return this.pass;
    }
}
class SMAAConfig extends PostProcessConfig {
    constructor() {
        super('SMAA', true);
    }
    createPass(scene, camera, renderer, size) {
        this.pass = new THREE.SMAAPass(
                size.width || window.innerWidth,
                size.height || window.innerHeight);
        return this.pass;
    }
}
class FXAAConfig extends PostProcessConfig {
    constructor() {
        super('FXAA', true);
    }
    createPass(scene, camera, renderer, size) {
        this.pass = new THREE.ShaderPass(THREE.FXAAShader);
        const w = size.width || window.innerWidth;
        const h = size.height || window.innerHeight;
        this.pass.uniforms['resolution'].value.set(1 / w, 1 / h);
        return this.pass;
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
        const groundReflector = new THREE.ReflectorForSSRPass(
                new THREE.PlaneGeometry(550, 550), {
                clipBias: 0.0003,
                textureWidth: innerWidth,
                textureHeight: innerHeight,
                color: 0x888888,
                useDepthTexture: true,
            });
        groundReflector.material.depthWrite = false;
        groundReflector.rotation.x = -Math.PI / 2;
        groundReflector.visible = false;
        scene.add(groundReflector);
        /* 			const boxHelper = new THREE.BoxHelper(groundReflector, 0xffff00);
        scene.add(boxHelper); */
        // 然后传给 SSRPass
        this.pass = new THREE.SSRPass({
            renderer: renderer,
            scene: scene,
            camera: camera,
            width: size.width !== undefined ? size.width : innerWidth,
            height: size.height !== undefined ? size.height : innerHeight,
            selects: this.params.selects || [],
            groundReflector: groundReflector,
        });

		groundReflector.maxDistance = this.pass.maxDistance;
        groundReflector.opacity = this.pass.opacity;
        
        // 打印SSRPass的所有属性，用于调试
        console.log('SSRPass properties:', this.pass);

        // 设置初始参数
        this.applyParams();
        this.pass.enabled = this.enabled;

        return this.pass;
    }

    applyParams() {
        if (!this.pass)
            return;

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
        if (!this.pass)
            return;
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
    static BLOOM_LAYER = 1;
    static NO_BLOOM_LAYER = 1;
    constructor(params = {}) {
        super('Bloom', params.enabled !== undefined ? params.enabled : true);

        this.selective = params.selective !== undefined ? params.selective : false;
        this.params = {
            strength: params.strength !== undefined ? params.strength : 1.5,
            radius: params.radius !== undefined ? params.radius : 0.4,
            threshold: params.threshold !== undefined ? params.threshold : 0.85,
        };
        this.bloomComposer = null;
        this.bloomPass = null;
    }

    addMesh(mesh) {
        mesh.layers.enable(BloomConfig.BLOOM_LAYER);
    }

    createPass(scene, camera, renderer, size) {
        const resolution = new THREE.Vector2(size.width || innerWidth, size.height || innerHeight);
        this.bloomPass = new THREE.UnrealBloomPass(resolution, this.params.strength, this.params.radius, this.params.threshold);

        if (this.selective) {
            // bloom composer 只渲染 layer 1，结果存到 renderTarget
            this.bloomComposer = new THREE.EffectComposer(renderer);
            this.bloomComposer.renderToScreen = false;
            this.bloomComposer.addPass(new THREE.RenderPass(scene, camera));
            this.bloomComposer.addPass(this.bloomPass);
            const emptyTexture = new THREE.WebGLRenderTarget(1, 1).texture;
            // 主 composer 用混合 shader
            const mixShader = {
                uniforms: {
                    baseTexture: {
                        value: null
                    },
                    bloomTexture: {
                        value: emptyTexture
                    },
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
                        gl_FragColor = texture2D(baseTexture, vUv) + texture2D(bloomTexture, vUv);
                    }
                `,
            };
            this.pass = new THREE.ShaderPass(mixShader, 'baseTexture');
            this.pass.needsSwap = true;
        } else {
            // 普通 bloom，直接加到主 composer
            this.pass = this.bloomPass;
        }

        this.pass.enabled = this.enabled;
        this.camera = camera;
        return this.pass;
    }

    renderBloom() {
        if (!this.selective || !this.bloomComposer || !this.enabled)
            return;
        this.camera.layers.enableAll();
        this.camera.layers.disable(BloomConfig.NO_BLOOM_LAYER);
        this.bloomComposer.render();
        this.camera.layers.enableAll();
        this.pass.uniforms.bloomTexture.value = this.bloomComposer.renderTarget2.texture;
    }

    updateParams(params) {
        if (!this.bloomPass)
            return;
        Object.assign(this.params, params);
        if (params.strength !== undefined)
            this.bloomPass.strength = params.strength;
        if (params.radius !== undefined)
            this.bloomPass.radius = params.radius;
        if (params.threshold !== undefined)
            this.bloomPass.threshold = params.threshold;
    }

    getParams() {
        return Object.assign({}, this.params);
    }

    dispose() {
        if (this.bloomComposer) {
            this.bloomComposer.dispose();
        }
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
    // 定义哪些是永远在最后的pass
    static FINAL_PASSES = ['SMAA', 'GammaCorrection'];
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // 创建 EffectComposer
        const renderTarget = new THREE.WebGLRenderTarget(
                window.innerWidth * window.devicePixelRatio,
                window.innerHeight * window.devicePixelRatio, {
                samples: 4
            });
        this.composer = new THREE.EffectComposer(renderer, renderTarget);
        this.composer.setPixelRatio(window.devicePixelRatio);
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
    setConfigEnabled(name, enabled) {
        const config = this.getConfig(name);
        if (config?.getPass()) {
            config.getPass().enabled = enabled;
        }
    }

    addConfig(config) {
        const size = this.renderer.getSize(new THREE.Vector2());
        const pass = config.createPass(this.scene, this.camera, this.renderer, size);
        pass.renderToScreen = false;

        // 移除所有末尾pass
        const finalConfigs = this.configs.filter(c => PostProcessManager.FINAL_PASSES.includes(c.name));
        this.composer.passes = this.composer.passes.filter(
                p => !finalConfigs.some(c => c.getPass() === p));

        // 插入新pass
        this.composer.addPass(pass);
        this.configs.push(config);

        // 末尾pass按顺序重新加回：GammaCorrection -> SMAA
        finalConfigs
        .sort((a, b) => PostProcessManager.FINAL_PASSES.indexOf(a.name) - PostProcessManager.FINAL_PASSES.indexOf(b.name))
        .forEach(c => this.composer.addPass(c.getPass()));

        return config;
    }

    removeConfig(nameOrConfig) {
        const config = typeof nameOrConfig === 'string'
             ? this.getConfig(nameOrConfig)
             : nameOrConfig;

        if (!config)
            return;

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
            this.getConfig('Bloom')?.renderBloom();
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

        const blob = new Blob([workerCode], {
            type: "application/javascript"
        });
        return new Worker(URL.createObjectURL(blob));
    }

    // 同步加载，rgbeloader.parse需要cpu时间
    async loadHDRFromFile(file) {
        const url = URL.createObjectURL(file);
        const hdr = await new THREE.RGBELoader().loadAsync(url);
        const envMap = this.pmrem.fromEquirectangular(hdr).texture;
        const name = file.name.replace(/\.[^/.]+$/, "");
        this.hdrList[name] = {
            file,
            envMap
        };
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
                hdrList[name] = {
                    file,
                    envMap
                };

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
    addSSRToGUI(sceneName, bloomConfig) {
        const scene = this.sceneManager.scenes.get(sceneName);
        if (!scene) {
            return
        }
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
                ssrConfig.updateParams({
                    output: parseInt(value)
                });
            });

            cfg._guiFolder.add(ssrConfig.params, 'opacity', 0, 100, 0.01).name('反射不透明度').onChange(value => {
                ssrConfig.updateParams({
                    opacity: value
                });
            });

            cfg._guiFolder.add(ssrConfig.params, 'maxDistance', 0, 200, 1).name('最大追踪距离').onChange(value => {
                ssrConfig.updateParams({
                    maxDistance: value
                });
            });

            cfg._guiFolder.add(ssrConfig.params, 'thickness', 0, 200, 0.001).name('表面厚度').onChange(value => {
                ssrConfig.updateParams({
                    thickness: value
                });
            });

            cfg._guiFolder.add(ssrConfig.params, 'infiniteThick').name('无限厚度(快速)').onChange(value => {
                ssrConfig.updateParams({
                    infiniteThick: value
                });
            });
        }
    }
    addBloomToGUI(sceneName, bloomConfig) {
        const scene = this.sceneManager.scenes.get(sceneName);
        if (!scene) {
            return
        }
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
        const scene = sceneManager.getScene(sceneConfig.name).content;

        const ambient = scene.lights.ambient;
        const directional = scene.lights.directional;

        // Ambient Light
        const ambFolder = folder.addFolder("Ambient Light");
        ambFolder.addColor({
            color: ambient.color.getHex()
        }, "color")
        .name("Color")
        .onChange(v => ambient.color.set(v));

        ambFolder.add(ambient, "intensity", 0, 5, 0.01)
        .name("Intensity");

        // Directional Light
        const dirFolder = folder.addFolder("Directional Light");
        dirFolder.addColor({
            color: directional.color.getHex()
        }, "color")
        .name("Color")
        .onChange(v => directional.color.set(v));

        dirFolder.add(directional, "intensity", 0, 5, 0.01)
        .name("Intensity");

        // 位置范围扩大，适配城市场景
        dirFolder.add(directional.position, "x", -2000, 4000, 1).name("Pos X")
        .onChange(() => directional.position.needsUpdate = true);
        dirFolder.add(directional.position, "y", -2000, 4000, 1).name("Pos Y");
        dirFolder.add(directional.position, "z", -2000, 4000, 1).name("Pos Z");

    }

    refreshHDRList() {
        const hdrNames = this.hdrManager.getHDRNames();
        for (const sceneName of this.sceneManager.scenes.keys()) {
            const scene = this.sceneManager.scenes.get(sceneName);
            if (!scene) {
                return
            }
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