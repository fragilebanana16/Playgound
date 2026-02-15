<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>PHP 项目展示</title>
    <style>
        body { font-family: Arial; margin: 20px; }
        video { max-width: 600px; }
        #threejs-container { width: 600px; height: 400px; border: 1px solid #ccc; }
    </style>
</head>
<body>
    <h1>我的 PHP 学习项目</h1>
    
    <!-- PHP 动态生成内容 -->
    <p>服务器时间: <?php echo date('Y-m-d H:i:s'); ?></p>
    
    <!-- 视频播放 -->
    <h2>视频播放器</h2>
    <video controls>
        <source src="video.mp4" type="video/mp4">
    </video>
    
    <!-- Three.js -->
    <h2>Three.js 3D 场景</h2>
    <div id="threejs-container"></div>
    
    <script type="importmap">
    {
        "imports": {
            "three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"
        }
    }
    </script>
    
    <script type="module">
        import * as THREE from 'three';
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, 600/400, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer();
        
        renderer.setSize(600, 400);
        document.getElementById('threejs-container').appendChild(renderer.domElement);
        
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        
        camera.position.z = 5;
        
        function animate() {
            requestAnimationFrame(animate);
            cube.rotation.x += 0.01;
            cube.rotation.y += 0.01;
            renderer.render(scene, camera);
        }
        animate();
    </script>
</body>
</html>