/**
 * DecalManager - 贴花管理器类
 * 用于在Three.js网格对象上添加和管理贴花
 */
class DecalManager {
    /**
     * 构造函数
     * @param {THREE.Scene} scene - Three.js场景对象
     * @param {THREE.Camera} camera - Three.js相机对象
     * @param {HTMLElement} domElement - 用于监听事件的DOM元素
     * @param {Object} options - 配置选项
     */
    constructor(scene, camera, domElement, options = {}) {
        this.scene = scene;
        this.camera = camera;
        this.domElement = domElement;
        
        // 配置参数
        this.params = {
            minScale: options.minScale || 10,
            maxScale: options.maxScale || 20,
            rotate: options.rotate !== undefined ? options.rotate : true,
            decalDiffuseUrl: options.decalDiffuseUrl || 'textures/decal/decal-diffuse.png',
            decalNormalUrl: options.decalNormalUrl || 'textures/decal/decal-normal.jpg',
            ...options
        };
        
        // 贴花数组
        this.decals = [];
        
        // 目标网格
        this.targetMesh = null;
        
        // 射线检测相关
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.intersects = [];
        
        // 交点信息
        this.intersection = {
            intersects: false,
            point: new THREE.Vector3(),
            normal: new THREE.Vector3()
        };
        
        // 鼠标辅助器
        this.mouseHelper = null;
        
        // 位置和方向
        this.position = new THREE.Vector3();
        this.orientation = new THREE.Euler();
        this.size = new THREE.Vector3(10, 10, 10);
        
        // 辅助线
        this.line = null;
        
        // 贴花材质
        this.decalMaterial = null;
        
        // 是否移动标记
        this.moved = false;
        
        // 初始化
        this._init();
    }
    
    /**
     * 初始化
     * @private
     */
    _init() {
        // 加载贴花纹理
        const textureLoader = new THREE.TextureLoader();
        const decalDiffuse = textureLoader.load(this.params.decalDiffuseUrl);
        const decalNormal = textureLoader.load(this.params.decalNormalUrl);
        
        // 创建贴花材质
        this.decalMaterial = new THREE.MeshPhongMaterial({
            specular: 0x444444,
            map: decalDiffuse,
            normalMap: decalNormal,
            normalScale: new THREE.Vector2(1, 1),
            shininess: 30,
            transparent: true,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -4,
            wireframe: false
        });
        
        // 创建鼠标辅助器
        this.mouseHelper = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.1, 4),
            new THREE.MeshNormalMaterial()
        );
        this.mouseHelper.visible = true;
        this.scene.add(this.mouseHelper);
        
        // 创建辅助线
        const geometry = new THREE.BufferGeometry();
        geometry.setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
        this.line = new THREE.Line(geometry, new THREE.LineBasicMaterial());
        this.scene.add(this.line);
        
        // 绑定事件
        this._bindEvents();
    }
    
    /**
     * 绑定事件
     * @private
     */
    _bindEvents() {
        this._onPointerDown = this._handlePointerDown.bind(this);
        this._onPointerUp = this._handlePointerUp.bind(this);
        this._onPointerMove = this._handlePointerMove.bind(this);
        
        this.domElement.addEventListener('pointerdown', this._onPointerDown);
        this.domElement.addEventListener('pointerup', this._onPointerUp);
        this.domElement.addEventListener('pointermove', this._onPointerMove);
    }
    
    /**
     * 处理鼠标按下事件
     * @private
     */
    _handlePointerDown() {
        this.moved = false;
    }
    
    /**
     * 处理鼠标抬起事件
     * @private
     */
    _handlePointerUp(event) {
        if (!this.moved) {
            this._checkIntersection(event.clientX, event.clientY);
            if (this.intersection.intersects) {
                this.addDecal();
            }
        }
    }
    
    /**
     * 处理鼠标移动事件
     * @private
     */
    _handlePointerMove(event) {
        if (event.isPrimary) {
            this._checkIntersection(event.clientX, event.clientY);
        }
    }
    
    /**
     * 检查射线交点
     * @private
     */
    _checkIntersection(x, y) {
        if (!this.targetMesh) return;
        
        this.mouse.x = (x / this.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(y / this.domElement.clientHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        this.raycaster.intersectObject(this.targetMesh, false, this.intersects);
        
        if (this.intersects.length > 0) {
            const p = this.intersects[0].point;
            this.mouseHelper.position.copy(p);
            this.intersection.point.copy(p);
            
            const n = this.intersects[0].face.normal.clone();
            n.transformDirection(this.targetMesh.matrixWorld);
            n.multiplyScalar(4);
            n.add(this.intersects[0].point);
            
            this.intersection.normal.copy(this.intersects[0].face.normal);
            this.mouseHelper.lookAt(n);
            
            const positions = this.line.geometry.attributes.position;
            positions.setXYZ(0, p.x, p.y, p.z);
            positions.setXYZ(1, n.x, n.y, n.z);
            positions.needsUpdate = true;
            
            this.intersection.intersects = true;
            this.intersects.length = 0;
        } else {
            this.intersection.intersects = false;
        }
    }
    
    /**
     * 设置目标网格
     * @param {THREE.Mesh} mesh - 要应用贴花的网格对象
     */
    setTargetMesh(mesh) {
        this.targetMesh = mesh;
    }
    
    /**
     * 添加贴花
     * @param {Object} customOptions - 自定义选项（可选）
     */
    addDecal(customOptions = {}) {
        if (!this.targetMesh) {
            console.warn('请先设置目标网格');
            return;
        }
        
        this.position.copy(this.intersection.point);
        this.orientation.copy(this.mouseHelper.rotation);
        
        if (this.params.rotate) {
            this.orientation.z = Math.random() * 2 * Math.PI;
        }
        
        const scale = this.params.minScale + 
            Math.random() * (this.params.maxScale - this.params.minScale);
        this.size.set(scale, scale, scale);
        
        const material = this.decalMaterial.clone();
        
        // 自定义颜色或随机颜色
        if (customOptions.color) {
            material.color.set(customOptions.color);
        } else {
            material.color.setHex(Math.random() * 0xffffff);
        }
        
        const decalGeometry = new THREE.DecalGeometry(
            this.targetMesh,
            this.position,
            this.orientation,
            this.size
        );
        
        const decalMesh = new THREE.Mesh(decalGeometry, material);
        
        this.decals.push(decalMesh);
        this.scene.add(decalMesh);
        
        return decalMesh;
    }
    
    /**
     * 清除所有贴花
     */
    clearDecals() {
        this.decals.forEach(decal => {
            this.scene.remove(decal);
            decal.geometry.dispose();
            decal.material.dispose();
        });
        this.decals.length = 0;
    }
    
    /**
     * 移除指定贴花
     * @param {THREE.Mesh} decal - 要移除的贴花网格
     */
    removeDecal(decal) {
        const index = this.decals.indexOf(decal);
        if (index > -1) {
            this.scene.remove(decal);
            decal.geometry.dispose();
            decal.material.dispose();
            this.decals.splice(index, 1);
        }
    }
    
    /**
     * 设置参数
     * @param {Object} params - 新的参数对象
     */
    setParams(params) {
        Object.assign(this.params, params);
    }
    
    /**
     * 获取参数
     * @returns {Object} 当前参数对象
     */
    getParams() {
        return { ...this.params };
    }
    
    /**
     * 显示/隐藏辅助器
     * @param {boolean} visible - 是否可见
     */
    setHelperVisible(visible) {
        if (this.mouseHelper) {
            this.mouseHelper.visible = visible;
        }
        if (this.line) {
            this.line.visible = visible;
        }
    }
    
    /**
     * 标记为已移动（用于与OrbitControls配合）
     */
    markAsMoved() {
        this.moved = true;
    }
    
    /**
     * 销毁管理器
     */
    dispose() {
        // 移除事件监听
        this.domElement.removeEventListener('pointerdown', this._onPointerDown);
        this.domElement.removeEventListener('pointerup', this._onPointerUp);
        this.domElement.removeEventListener('pointermove', this._onPointerMove);
        
        // 清除所有贴花
        this.clearDecals();
        
        // 移除辅助对象
        if (this.mouseHelper) {
            this.scene.remove(this.mouseHelper);
            this.mouseHelper.geometry.dispose();
            this.mouseHelper.material.dispose();
        }
        
        if (this.line) {
            this.scene.remove(this.line);
            this.line.geometry.dispose();
            this.line.material.dispose();
        }
        
        // 清理材质
        if (this.decalMaterial) {
            this.decalMaterial.dispose();
        }
    }
}

// 导出类（如果使用模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DecalManager;
}
