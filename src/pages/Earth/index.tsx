import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGetState } from 'ahooks';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Earth = () => {
  const heightMapContextRef = useRef<any>(null);
  const [heightMapPoint, setHeightMapPoint, getHeightMapPoint] =
    useGetState<boolean>(false);

  useEffect(() => {
    initThree();
  }, []);

  const initThree = () => {
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.CineonToneMapping;

    const scene = new THREE.Scene();
    const axesHelper = new THREE.AxesHelper(500);
    scene.add(axesHelper);

    const frustumSize = 45;
    const aspect = window.innerWidth / window.innerHeight;
    const camera = new THREE.PerspectiveCamera(frustumSize, aspect, 1, 10000);
    camera.position.set(0, 2000, 0);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();

    const earth = new THREE.Group();
    let controls: null | OrbitControls = null;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    controls.maxPolarAngle = 1.5;

    window.addEventListener(
      'resize',
      () => {
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false,
    );

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.intensity = 0.8;
    light.position.set(0, 1000, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -5;
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 10;
    scene.add(light);
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    scene.add(lightHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const textLoader = new THREE.TextureLoader();

    const heightMap = textLoader.load(
      require('./images/earth_specular_2048.jpg'),
      (texture) => {
        let canvas = document.createElement('canvas');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;
        console.log('canvas', canvas);

        heightMapContextRef.current = canvas.getContext('2d');
        heightMapContextRef.current.drawImage(texture.image, 0, 0);
      },
    );
    heightMap.wrapS = THREE.RepeatWrapping;
    heightMap.wrapT = THREE.RepeatWrapping;
    heightMap.anisotropy = 16;

    const textureMap = textLoader.load(
      require('./images/earth_atmos_4096.jpg'),
    );
    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;

    textureMap.wrapS = THREE.RepeatWrapping;
    textureMap.wrapT = THREE.RepeatWrapping;
    textureMap.anisotropy = 16;

    const planeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        bumpTexture: { value: heightMap },
        bumpScale: { value: -20 },
        terrainTexture: { value: textureMap },
      },
      vertexShader: `
      // Uniforms类型常量作为着色器之间共享的数据内容
      // 这些数据内容在整个帧中都是一致的

      // 高度贴图图像的uniform类型常量
      uniform sampler2D bumpTexture;
      // 缩放常量的uniform类型常量
      uniform float bumpScale;

      // Varyings类型变量作为顶点着色器中确定的值

      // 用于存储点高度的varying类型变量
      varying float vAmount;
      varying vec2 vUV;

      void main() {
        // UV映射表示中的“坐标”
        vUV = uv;

        // 这些坐标处的高度图数据
        vec4 bumpData = texture2D(bumpTexture, uv);

        // 高度贴图是灰度的，所以使用r、g或b都无关紧要
        vAmount = bumpData.r;

        // 沿着法线移动位置
        vec3 newPosition = position + normal * bumpScale * vAmount;

        // 使用标准公式计算顶点的位置
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
      `,
      fragmentShader: `
      uniform sampler2D terrainTexture;

      // 从顶点着色器获取varying类型数据
      varying vec2 vUV;

      void main() {
        // 从纹理贴图中获取片段的颜色，设置到UV贴图中的那个坐标处
        gl_FragColor = texture2D(terrainTexture, vUV);
      }
      `,
      side: THREE.FrontSide,
    });

    const planet = new THREE.Mesh(
      new THREE.PlaneGeometry(2048, 1024, 256, 256),
      planeMaterial,
    );

    planet.position.setZ(20);
    earth.add(planet);
    earth.rotateX(-Math.PI / 2);
    scene.add(earth);

    let pointPos = new THREE.Vector3(50, 0, 0);

    const animate = () => {
      if (!getHeightMapPoint())
        setSpherePoint(earth, pointPos, heightMapContextRef.current);

      requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const setSpherePoint = (
    group: THREE.Group,
    position: THREE.Vector3,
    context: CanvasRenderingContext2D,
  ) => {
    if (!context) return;
    setHeightMapPoint(true);
    let dotGeometry = new THREE.BoxGeometry(8, 2, 8),
      dotMaterial = new THREE.MeshLambertMaterial({ color: 'crimson' });

    for (var i = 0; i < 1000; i++) {
      // random Three.js coordinates
      var tx = THREE.MathUtils.randFloat(-1024, 1024),
        ty = 0,
        tz = THREE.MathUtils.randFloat(-512, 512);

      // convert to pixel coordinates
      var x = Math.round(tx / 2 + 512),
        y = 0,
        z = Math.round(tz / 2 + 256);

      // get pixel color
      var pixel = context.getImageData(x, z, 1, 1);
      y = pixel.data[0]; // use the red component
      ty = THREE.MathUtils.mapLinear(y, 0, 252, 0, 20);

      // create a dot
      var dot = new THREE.Mesh(dotGeometry, dotMaterial);
      dot.rotateX(-Math.PI / 2);
      dot.position.set(tx, tz, ty);

      group.add(dot);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <canvas className="webgl"></canvas>
    </div>
  );
};

export default Earth;
