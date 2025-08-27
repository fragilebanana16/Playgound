import {
    Scene,
    PerspectiveCamera,
    WebGLRenderer,
    SpotLight,
    AmbientLight,
    Group,
    WebGLCubeRenderTarget,
    CubeCamera,
    Mesh,
    Vector3,
    Color,
    SphereGeometry,
    MeshPhongMaterial,
    PlaneGeometry,
    Clock,
    HalfFloatType,
    ACESFilmicToneMapping,
    sRGBEncoding,
    PCFSoftShadowMap,
    DoubleSide,
} from "three";
import { GLTFLoader } from "../../utils/loaders/GLTFLoader.js";
// import { DRACOLoader } from "../../utils/loaders/DRACOLoader";
import { OrbitControls } from "../../utils/controls/OrbitControls.js";
const RADIO = window.innerWidth / window.innerHeight;
// RENDERER
const renderer = new WebGLRenderer({ antialias: true });
let camera = new PerspectiveCamera(30, RADIO);
// 光
const ambientLight = new AmbientLight(0x404040);
const spotLight = new SpotLight();
// 场景对象
let scene;
// 模型的接触阴影对象
const shadowGroup = new Group();
// 相机控制对象
let controls;
// 虚拟场景对象
let virtualScene = new Scene();
// 虚拟背景
let virtualBackgroundMesh;
const setContactShadow = () => {
    // shadowGroup.position.set(0, -1.01, modelZ);
    // shadowGroup.rotation.set(0, Math.PI / 2, 0);
    // scene.add(shadowGroup);
    // createContactShadow(scene, renderer, shadowGroup);
};

const setRender = () => {
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
  
    // GLTFLoader 将自动配置从 .gltf 或 .glb 文件引用的纹理。
    renderer.outputEncoding = sRGBEncoding;
  
    //是否使用物理上正确的光照模式。默认为false。
    // renderer.physicallyCorrectLights = true;
  
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
  
    // BakeShadows
    renderer.shadowMap.autoUpdate = false;
    renderer.shadowMap.needsUpdate = true;
};
const setCamera = () => {
    camera.position.set(0, 0.8, 8);
    camera.castShadow = true;
    scene.add(camera);
};
const setSpotLight = () => {
    spotLight.position.set(0, 15, 0);
    //intensity - (可选参数) 光照强度。 缺省值 1。
    spotLight.intensity = 2;
    //聚光锥的半影衰减百分比。在0和1之间的值。默认为0。
    spotLight.penumbra = 1;
    //从聚光灯的位置以弧度表示聚光灯的最大范围。应该不超过 Math.PI/2。默认值为 Math.PI/3。
    spotLight.angle = 0.8;
    spotLight.shadow.bias = -0.0001;
    spotLight.castShadow = true;
    spotLight.target.position.set(0, 0, 6);
    scene.add(spotLight.target);
  
    scene.add(spotLight);
};
const setAmbientLight = () => {
    //intensity - (参数可选)光照的强度。缺省值为 1。
    ambientLight.intensity = 0.2;
    scene.add(ambientLight);
};

const load3DModel = async () => {
    // glb 是压缩的gltf，需要使用 dracoLoader 解压缩
    // const dracoLoader = new DRACOLoader().setDecoderPath("/libs/draco/");
    // gltf 加载器
    const gltfLoader = new GLTFLoader() // .setDRACOLoader(dracoLoader);
  
    // 加载模型获取，模型对象信息
    new GLTFLoader().load('models/lamborghini_centenario_roadster_sdc.glb', function (gltf) {
        gltf.scene.traverse(function (object) {
                object.castShadow = true;
        });
        scene.add(gltf.scene);
        gltf.scene.scale.set(3,3,3);
    });
};
const addControls = () => {
    controls = new OrbitControls(camera, renderer.domElement);
};
const autoRender = () => {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(autoRender);
};

const setEnvironment = (
    scene,
    resolution = 256,
    frames = 1,
    near = 1,
    far = 1000,
    background = false
  ) => {
    const fbo = new WebGLCubeRenderTarget(resolution);
    fbo.texture.type = HalfFloatType;
    const cubeCamera = new CubeCamera(near, far, fbo);
  
    virtualScene.add(cubeCamera);
  
    // 天花板灯
    const topLight = generateVirtualLight({
      intensity: 0.75,
      scale: [10, 10, 1],
      position: [0, 5, -9],
      rotation: [Math.PI / 2, 0, 0],
    });
  
    // 四周灯光
    const leftTopLight = generateVirtualLight({
      intensity: 4,
      scale: [20, 0.1, 1],
      position: [-5, 1, -1],
      rotation: [0, Math.PI / 2, 0],
    });
    const leftBottomLight = generateVirtualLight({
      intensity: 1,
      scale: [20, 0.5, 1],
      position: [-5, -1, -1],
      rotation: [0, Math.PI / 2, 0],
    });
    const rightTopLight = generateVirtualLight({
      intensity: 1,
      scale: [20, 1, 1],
      position: [10, 1, 0],
      rotation: [0, -Math.PI / 2, 0],
    });
  
    const floatLight = generateVirtualLight({
      form: "ring",
      color: "red",
      intensity: "1",
      scale: 10,
      position: [-15, 4, -18],
      target: [0, 0, 0],
    });
  
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
  
    const geometry = new SphereGeometry(1, 64, 64);
    const material = createCustomMaterial(backLightColor.value);
  
    virtualBackgroundMesh = new Mesh(geometry, material);
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
const initScene = async () => {
    // 创建场景
    scene = new Scene();
    // 设置渲染器
    setRender();
    // 设置环境光
    setAmbientLight();
    // 设置相机
    setCamera();
    // 加载3d 模型
    load3DModel();
    // 自动以3d模型
    // customModel();
    // 设置聚光灯
    setSpotLight();
  
    // const t = 600;
    // setTimeout(() => {
    //   // 设置 HDR环境（模拟HDR贴图）
    //   setEnvironment(scene, 256, Infinity);
    //   // 设置运动光源，获得打光效果
    //   setMovingSpot(virtualScene);
    // }, t * 2);
    // setTimeout(() => {
    //   spotLight.visible = false;
    //   // 设置舞台聚光灯
    // //   setBigSpotLight();
    //   // 设置接触阴影
    //   setContactShadow();
    // }, 3 * t);
  
    // 添加控制效果
    addControls();
  
    // 将渲染结果写入html dom中
    document.body.appendChild(renderer.domElement);
    // 开启实时渲染，无需手动渲染
    autoRender();
};
initScene()
