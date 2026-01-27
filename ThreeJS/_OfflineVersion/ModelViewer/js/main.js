
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
const cameraInfo = { x: 0, y: 0, z: 0 };

const ENTIRE_SCENE = 0, BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set( BLOOM_SCENE );
const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );
const materials = {};

const gui = new dat.GUI();
gui.add(cameraInfo, 'x').listen();
gui.add(cameraInfo, 'y').listen();
gui.add(cameraInfo, 'z').listen();

let g_uniforms = {
  u_time: { value: new THREE.Clock().getElapsedTime() }
};
// guimanager?

gui.add(params, "showLight").name("Show Light Layer").onChange(v => {
	const sceneInstance = SceneManager.getInstance();
	const cam = sceneInstance.getCamera();
    if (v) { 
		// 只显示车灯层 
		cam.layers.set(BLOOM_SCENE); 
	} else { 
		// 显示车身 + 灯光 
		cam.layers.enable(ENTIRE_SCENE); 
		cam.layers.enable(BLOOM_SCENE); 
	}
});

// 参数对象（和 BloomUtil 初始化时一致）
const bloomParams = {
    enabled: true,
    bloomStrength: 1.5,
    bloomRadius: 0.4,
    bloomThreshold: 0.85
};

// 开关控制
gui.add(bloomParams, 'enabled').name('Bloom Enabled').onChange(v => {
	const bloomUtil = BloomUtil.getInstance();
    bloomUtil.setBloomEnabled(v);
});

// 强度
gui.add(bloomParams, 'bloomStrength', 0, 3).step(0.1).name('Bloom Strength').onChange(v => {
	const bloomUtil = BloomUtil.getInstance();
    bloomUtil.setBloomStrength(v);
});

// 半径
gui.add(bloomParams, 'bloomRadius', 0, 1).step(0.01).name('Bloom Radius').onChange(v => {
	const bloomUtil = BloomUtil.getInstance();
    bloomUtil.setBloomRadius(v);
});

// 阈值
gui.add(bloomParams, 'bloomThreshold', 0, 1).step(0.01).name('Bloom Threshold').onChange(v => {
	const bloomUtil = BloomUtil.getInstance();
    bloomUtil.setBloomThreshold(v);
});



// =========================
//  主入口
// =========================
function main() {
	
	// 1. 初始化场景、相机、渲染器 
	const sceneManager = SceneManager.getInstance();
	const { scene, camera, renderer } = sceneManager.initBase(); 
	sceneManager.setupResize();
	
	// 2. 灯光系统 
	const lightManager = LightManager.getInstance(scene, gui); 

	// lightManager.addLightHelpers();
	
	// 3. 环境系统 
	const envManager = new EnvironmentManager(scene, renderer); 
	envManager.setEnvironment(256, Infinity); 
	envManager.addFloor();
	envManager.addSurroundingSphere();
	envManager.setupHDRInput();
	envManager.addCurvedBackdrop();
	envManager.setMovingSpot();
	
	// 4. 模型系统 
	const modelManager = new ModelManager(scene, gui); 
	document.getElementById("fileInput")
	.addEventListener("change", (e) => 
	{ 
		const file = e.target.files[0]; 
		if (file) modelManager.loadModelFromFile(file); 
	});

	// 5. 相机系统 
	const cameraManager = new CameraManager(camera, gui);
  
    // 6. Bloom 后期处理
	const bloomUtil = BloomUtil.getInstance(scene, camera, renderer, { 
		bloomStrength: bloomParams.bloomStrength,
		bloomRadius: bloomParams.bloomRadius,
		bloomThreshold: bloomParams.bloomThreshold,
	});

	bloomUtil.setBloomEnabled(bloomParams.enabled);
						
	  sceneManager.animate();

	  // 8. 其它交互 

	  const util = CommonUtil.getInstance();
	  util.setupKeyEvents(camera);
	  util.setupResize(camera, renderer);
}

class BloomUtil {
    static instance = null;

    static getInstance(scene, camera, renderer, params) {
        if (!BloomUtil.instance) {
            BloomUtil.instance = new BloomUtil(scene, camera, renderer, params);
        }
        return BloomUtil.instance;
    }

    constructor(scene, camera, renderer, params) {
        this._scene = scene;
        this._camera = camera;
        this._renderer = renderer;
        this._params = params;

        this._darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
        this._materials = {};
        this._enableBloom = true;

        this._bloomPass = this._initComposers();
    }

    _initComposers() {
        const renderScene = new THREE.RenderPass(this._scene, this._camera);
        const bloomPass = new THREE.UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            this._params.bloomStrength,
            this._params.bloomRadius,
            this._params.bloomThreshold
        );

        this._bloomComposer = new THREE.EffectComposer(this._renderer);
        this._bloomComposer.renderToScreen = false;
        this._bloomComposer.addPass(renderScene);
        this._bloomComposer.addPass(bloomPass);

        const finalPass = new THREE.ShaderPass(
            new THREE.ShaderMaterial({
                uniforms: {
                    baseTexture: { value: null },
                    bloomTexture: { value: this._bloomComposer.renderTarget2.texture }
                },
                vertexShader: document.getElementById('vertexshader').textContent,
                fragmentShader: document.getElementById('fragmentshader').textContent,
                defines: {}
            }),
            'baseTexture'
        );
        finalPass.needsSwap = true;

        this._finalComposer = new THREE.EffectComposer(this._renderer);
        this._finalComposer.addPass(renderScene);
        this._finalComposer.addPass(finalPass);
		return bloomPass;
    }
	setBloomStrength(v){
	     this._params.bloomStrength = v;
		 this._bloomPass.strength = this._params.bloomStrength; 
	}
	setBloomRadius(v){
	    this._params.bloomRadius = v;
		this._bloomPass.radius = this._params.bloomRadius; 
	}
	setBloomThreshold(v){
        this._params.bloomThreshold = v;
		this._bloomPass.threshold = this._params.bloomThreshold; 
	}
    // =========================
    // 渲染接口：根据开关决定是否启用 Bloom
    // =========================
    render() {
		if ( !this._enableBloom ) {
			this._renderer.render( this._scene, this._camera );
		}
		else{
			this._renderBloom( true );
			this._finalComposer.render();
		}
    }

    setBloomEnabled(flag) {
        this._enableBloom = flag;
    }
	
	// =========================
	// 渲染bloom pass
	// =========================
	_renderBloom( mask ) {
		if ( mask === true ) {
			this._scene.traverse((obj)=> this.darkenNonBloomed(obj) );
			this._bloomComposer.render();
			this._scene.traverse((obj)=> this.restoreMaterial(obj) );
		} else {
			// flow only
			this._camera.layers.set( BLOOM_SCENE );
			this._bloomComposer.render();
			this._camera.layers.set( ENTIRE_SCENE );
		}
	}
	
    // =========================
    // 将非bloom项材质变黑，保留原有材质
    // =========================
    darkenNonBloomed(obj) {
        if (obj.isLine || (obj.isMesh && bloomLayer.test(obj.layers) === false)) {
            this._materials[obj.uuid] = obj.material;
            obj.material = this._darkMaterial;
        }
    }

    // =========================
    // 还原原有材质
    // =========================
    restoreMaterial(obj) {
        if (this._materials[obj.uuid]) {
            obj.material = this._materials[obj.uuid];
            delete this._materials[obj.uuid];
        }
    }
}

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
            if (obj.helper) obj.helper.visible = this._helpersVisible;
            if (obj.isHelper) obj.visible = this._helpersVisible;
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
                if (mesh.material) mesh.material.emissiveIntensity = v;
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
                    mesh.material.emissive.setRGB(c[0]/255, c[1]/255, c[2]/255);
					mesh.material.color.setRGB(c[0]/255, c[1]/255, c[2]/255);
                }
            });
        });

        folder.open();
    }


}

class SceneManager {
	static instance = null; 
	static getInstance() 
	{ 
		if (!SceneManager.instance) 
		{ 
			SceneManager.instance = new SceneManager(); 
		}
		return SceneManager.instance; 
	}
    constructor() {
        this._scene = null;
        this._camera = null;
        this._renderer = null;
        this._controls = null;
		this._clock = new THREE.Clock();
    }

	animate() {
	  requestAnimationFrame(()=>this.animate());

	  this._scene.traverse((obj) => {
		if (obj.isSpotLight && obj.helper) obj.helper.update();
	  });

	  cameraInfo.x = this._camera.position.x;
	  cameraInfo.y = this._camera.position.y;
	  cameraInfo.z = this._camera.position.z;

	  g_uniforms.u_time.value = this._clock.getElapsedTime();
	  
		const bloomUtil = BloomUtil.getInstance();
		bloomUtil.render();
	}
	
    initBase() {
        this._scene = new THREE.Scene();

        this._camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this._camera.position.set(0, 0, 3);

        this._renderer = new THREE.WebGLRenderer({ antialias: true });
        this._renderer.setSize(window.innerWidth, window.innerHeight);
		this._renderer.setPixelRatio(window.devicePixelRatio)
        this._renderer.outputEncoding = THREE.sRGBEncoding;
        this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this._renderer.toneMappingExposure = 1;
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this._renderer.domElement);

        this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
        this._controls.update();

        return { scene: this._scene, camera: this._camera, renderer: this._renderer };
    }

    setupResize() {
        window.addEventListener("resize", () => {
            this._camera.aspect = window.innerWidth / window.innerHeight;
            this._camera.updateProjectionMatrix();
            this._renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
	
	getScene() { return this._scene; } 
	getCamera() { return this._camera; } 
	getRenderer() { return this._renderer; } 
	getControls() { return this._controls; }
}
class EnvironmentManager {
	getVirtualScene() { return this._virtualScene; } 
	
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
        const topLight = this._createVirtualLight({ intensity: 0.75, scale: [10, 10, 1], position: [0, 5, -9], rotation: [Math.PI / 2, 0, 0] });
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

    setupHDRInput() {
        document.getElementById("hdrInput").addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (ev) => {
                const buffer = ev.target.result;
                const loader = new THREE.RGBELoader();
                const hdr = loader.parse(buffer);

                const texture = new THREE.DataTexture(hdr.data, hdr.width, hdr.height, THREE.RGBAFormat, hdr.type);
                texture.needsUpdate = true;
                texture.mapping = THREE.EquirectangularReflectionMapping;

                const pmrem = new THREE.PMREMGenerator(this._renderer);
                const envMap = pmrem.fromEquirectangular(texture).texture;

                this._scene.environment = envMap;
                this._scene.background = envMap;

                pmrem.dispose();
                texture.dispose();
            };
            reader.readAsArrayBuffer(file);
        });
    }

    _createVirtualLight({ form = "rect", intensity = 1, color = "white", scale = [1,1,1], position=[0,0,0], rotation=[0,0,0], target }) {
        const geometry = form === "circle" ? new THREE.RingGeometry(0, 1, 64) : new THREE.PlaneGeometry();
        const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, toneMapped: false });
        material.color.multiplyScalar(intensity);

        const mesh = new THREE.Mesh(geometry, material);
        mesh.scale.set(...scale);
        mesh.position.set(...position);
        mesh.rotation.set(...rotation);
        if (target) mesh.lookAt(new THREE.Vector3(...target));
        return mesh;
    }

    _createCustomMaterial(colorB = "black") {
        const material = new LayerMaterial({
            layers: [new Depth({ colorA: "#ffffff", colorB, alpha: 0.5, near: 0, far: 300, origin: new THREE.Vector3(100, 100, 100) })]
        });
        material.side = THREE.BackSide;
        return material;
    }
	
	floatMesh({
	  group,
	  speed = 1,
	  rotationIntensity = 1,
	  floatIntensity = 1,
	}){
	  const offset = Math.random() * 10;
	  const t = offset + this._clock.getElapsedTime();
	  group.rotation.x = (Math.cos((t / 4) * speed) / 8) * rotationIntensity;
	  group.rotation.y = (Math.sin((t / 4) * speed) / 8) * rotationIntensity;
	  group.rotation.z = (Math.sin((t / 4) * speed) / 20) * rotationIntensity;
	  group.position.y = ((Math.sin((t / 4) * speed)  + 2) * 2) * floatIntensity;
	  requestAnimationFrame(() => {
		this.floatMesh({ group, speed, rotationIntensity, floatIntensity });
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
	
	spotAnimate(clock, group){
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
	  leftLight.angle = Math.PI / 4;   // 15°，很窄
		leftLight.distance = 50;           // 近光灯照 8 米左右
		leftLight.decay = 0.1;            // 衰减快
		leftLight.penumbra = 0.2;         // 边缘稍微柔和
		leftLight.intensity = 10;          // 亮度适中
	  leftLight.castShadow = true;
	  leftLight.position.copy(basePos).add(new THREE.Vector3(-offset, 0.3, 1.6));
	  leftLight.target.position.copy(leftLight.position.clone().add(dir.multiplyScalar(20)));
	  this._scene.add(leftLight);
	  this._scene.add(leftLight.target);
	  leftLight.helper = new THREE.SpotLightHelper(leftLight);
	  this._scene.add(leftLight.helper);

	  // 右灯
	  const rightLight = new THREE.SpotLight(0xffffff, 5);
		rightLight.angle = Math.PI / 4;   // 15°，很窄
		rightLight.distance = 50;           // 近光灯照 8 米左右
		rightLight.decay = 0.1;            // 衰减快
		rightLight.penumbra = 0.2;         // 边缘稍微柔和
		rightLight.intensity = 10;          // 亮度适中
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
			  gltf.scene.traverse((child) => {
				  if (!child.isMesh) return;

				  const name = child.name.toLowerCase();

				  // 判断属于哪一类灯
				  let type = null;
				  if (name.includes("bigdeng")) type = "bigdeng";
				  else if (name.includes("smalldeng")) type = "smalldeng";
				  else if (name.includes("dengzhao")) type = "dengzhao";
				  else if (name.includes("backdeng")) type = "backdeng";


				  if (type){
					  const lm = LightManager.getInstance();
					  lm.addMesh(type, child)
					  lm.createMeshGUI(type, type);

					  child.layers.enable( BLOOM_SCENE );
					  const bloom = child.clone();
					  if (name.includes("bigdeng")) 
						  dualLight = this._attachDualLights(bloom); // 只有大灯有
				  }
				  else { 
				      child.layers.enable(ENTIRE_SCENE);
				  }
				});
                gltf.scene.position.y -= 1.0;
                this._scene.add(gltf.scene);
                this._model = gltf.scene;
            });
        };
        reader.readAsArrayBuffer(file);
    }

    customModel() {
        const changModel = (model, nodeName, options) => {
            model.materials[nodeName].setValues(options);
        };
        changModel(this._model, "rubber", { color: "#222", roughness: 0.6 });
        changModel(this._model, "window", { color: "black", roughness: 0 });
    }
}
class CameraManager {
    constructor(camera, gui) {
        this._camera = camera;
        this._gui = gui;
        this._cameraTargetPos = new THREE.Vector3();
        this._box = null;
        this._boxPoints = {};
        this._clock = new THREE.Clock();
    }

    setupCameraGUI() {
        const guiParams = { point: "p3" };
        this._gui.add(guiParams, "point", Object.keys(this._boxPoints))
            .name("Camera Point")
            .onChange((value) => {
                const pos = this._boxPoints[value];
                this._cameraTargetPos.set(pos.x + 0.2, pos.y - 0.6, pos.z + 0.4);
            });
    }

    setCameraAnimate() {
        const mid = new THREE.Vector3().copy(this._cameraTargetPos);
        mid.y += 0.4;
        this._camera.position.lerp(mid, 0.01);
        this._camera.lookAt(this._box.getCenter(new THREE.Vector3()));
        requestAnimationFrame(() => this.setCameraAnimate());
    }
}

class CommonUtil{
	static instance = null; 
	static getInstance() 
	{ 
		if (!CommonUtil.instance) 
		{ 
			CommonUtil.instance = new CommonUtil(); 
		}
		return CommonUtil.instance; 
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
}

main();
