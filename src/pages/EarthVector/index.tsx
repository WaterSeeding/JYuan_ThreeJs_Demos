import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGetState } from 'ahooks';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setSvg } from './svg';

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
    // controls.maxPolarAngle = 1.5;

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
      side: THREE.DoubleSide,
      transparent: true,
    });

    const planet = new THREE.Mesh(
      new THREE.PlaneGeometry(2048, 1024, 256, 256),
      planeMaterial,
    );

    planet.position.setZ(20);
    earth.add(planet);
    earth.rotateX(-Math.PI / 2);
    scene.add(earth);

    const animate = () => {
      if (!getHeightMapPoint())
        setSpherePoint(scene, heightMapContextRef.current);

      requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const setSpherePoint = async (
    scene: THREE.Scene,
    context: CanvasRenderingContext2D,
  ) => {
    if (!context) return;
    setHeightMapPoint(true);

    let model = await loadModel();
    setModel(scene, model, context);

    // const amount = parseInt(window.location.search.slice(1)) || 10;
    // const count = Math.pow(amount, 3);
    // const dummy = new THREE.Object3D();

    // let instancedMeshArr: any[] = [];

    // let pointSvg: any = await setSvg('./svg/weibojizhan.svg');
    // pointSvg.group.traverse((object3D: any) => {
    //   if (object3D instanceof THREE.Mesh) {
    //     let mesh = new THREE.InstancedMesh(
    //       object3D.geometry,
    //       object3D.material,
    //       count,
    //     );
    //     mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    //     mesh.instanceMatrix.needsUpdate = true;
    //     mesh.computeBoundingSphere();

    //     scene.add(mesh);
    //     instancedMeshArr.push(mesh);
    //   }
    // });

    // for (let i = 0; i < 1000; i++) {
    //   // random Three.js coordinates
    //   let tx = THREE.MathUtils.randFloat(-1024, 1024),
    //     ty = 0,
    //     tz = THREE.MathUtils.randFloat(-512, 512);

    //   // convert to pixel coordinates
    //   let x = Math.round(tx + 512 * 2),
    //     y = 0,
    //     z = Math.round(tz + 256 * 2);

    //   // get pixel color
    //   let pixel = context.getImageData(x, z, 1, 1);
    //   y = pixel.data[0]; // use the red component
    //   ty = THREE.MathUtils.mapLinear(y, 0, 252, 20, 0);

    //   dummy.position.set(tx, ty + 2, tz);
    //   dummy.updateMatrix();

    //   console.log("instancedMeshArr[0]", instancedMeshArr);

    //   // instancedMeshArr[0].setMatrixAt(i++, dummy.matrix);
    // }
  };

  const loadModel = () => {
    return new Promise((resolve, reject) => {
      const loader = new THREE.BufferGeometryLoader();
      loader.load(
        './models/json/suzanne_buffergeometry.json',
        function (geometry) {
          geometry.computeVertexNormals();
          geometry.scale(6, 6, 6);

          let material = new THREE.MeshNormalMaterial();
          let mesh = new THREE.Mesh(geometry, material);
          resolve(mesh);
        },
      );
    });
  };

  const setModel = (
    scene: THREE.Scene,
    model: THREE.Mesh,
    context: CanvasRenderingContext2D,
  ) => {
    const amount = parseInt(window.location.search.slice(1)) || 10;
    const count = Math.pow(amount, 3);
    const instancedMeshArr: any[] = [];

    const group = new THREE.Group();
    scene.add(group);

    let mesh = new THREE.InstancedMesh(model!.geometry, model!.material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.instanceMatrix.needsUpdate = true;
    // @ts-ignore;
    mesh.computeBoundingSphere();
    group.add(mesh);
    instancedMeshArr.push(mesh);

    traversalInstancedMesh(count, context, instancedMeshArr);
  };

  const traversalInstancedMesh = (
    count: number,
    context: CanvasRenderingContext2D,
    instancedMeshArr: THREE.InstancedMesh[],
  ): void => {
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // random Three.js coordinates
      let tx = THREE.MathUtils.randFloat(-1024, 1024),
        ty = 0,
        tz = THREE.MathUtils.randFloat(-512, 512);

      // convert to pixel coordinates
      let x = Math.round(tx + 512 * 2),
        y = 0,
        z = Math.round(tz + 256 * 2);

      // get pixel color
      let pixel = context.getImageData(x, z, 1, 1);
      y = pixel.data[0]; // use the red component
      ty = THREE.MathUtils.mapLinear(y, 0, 252, 20, 0);

      dummy.position.set(tx, ty + 2, tz);
      dummy.updateMatrix();

      instancedMeshArr.forEach((mesh) => {
        mesh.setMatrixAt(i++, dummy.matrix);
      });
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
