import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const getCubeMapTexture = (renderer: THREE.WebGLRenderer, path: string) => {
  return new Promise((resolve, reject) => {
    new RGBELoader().load(
      path,
      (texture: any) => {
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        pmremGenerator.dispose();

        resolve(envMap);
      },
      undefined,
      reject,
    );
  });
};

export const initScene = (cb?: Function, updateCb?: Function): void => {
  const BLOOM_SCENE = 1;
  const bloomLayer = new THREE.Layers();
  bloomLayer.set(BLOOM_SCENE);

  const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
  const materials: any = {};

  const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas.webgl')!,
    antialias: true,
  });
  renderer.setClearColor(0x000000);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.LinearToneMapping;

  const scene = new THREE.Scene();
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  const frustumSize = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(frustumSize, aspect, 1, 10000);
  camera.position.set(0, 800, 500);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  camera.layers.enable(1);

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
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    },
    false,
  );

  const light = new THREE.DirectionalLight(0xffffff, 0.2);
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

  getCubeMapTexture(renderer, './img/hdr/DS360_Volume_2_bonus_Ref.hdr').then(
    (envMap: THREE.Texture | any) => {
      console.log('envMap', renderer.toneMappingExposure);
      scene.environment = envMap;
      scene.background = envMap;
      renderer.toneMappingExposure = 1.0;
    },
  );

  const composer = addComposer(renderer, scene, camera, canvas);

  // 🌏
  const textLoader = new THREE.TextureLoader();
  let planetMap = textLoader.load('./img/earth/earth_atmos_4096.jpg');
  let planetNormalMap = textLoader.load('./img/earth/earth_normal.jpeg');
  let planetRoughnessMap = textLoader.load('./img/earth/earth_rough.jpeg');
  const planet = new THREE.Mesh(
    new THREE.PlaneGeometry(2048, 1024),
    new THREE.MeshStandardMaterial({
      side: THREE.FrontSide,
      map: planetMap,
      normalMap: planetNormalMap,
      roughnessMap: planetRoughnessMap,
      normalScale: new THREE.Vector2(10, 10),
      metalness: 0.1,
    }),
  );
  earth.add(planet);
  earth.rotateX(-Math.PI / 2);
  scene.add(earth);

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN && TWEEN.update();
    controls?.update();
    updateCb?.();

    renderer.autoClear = false;
    renderer.clear();
    camera.layers.set(1);
    if (composer) {
      composer.render();
    }
    renderer.clearDepth();
    camera.layers.set(0);
    renderer.render(scene, camera);
  };
  animate();

  cb?.({
    earth,
    camera,
    controls,
    light,
    lightHelper,
  });
};

const addComposer = (
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement,
) => {
  let renderScene = new RenderPass(scene, camera);
  let effectFXAA = new ShaderPass(FXAAShader);
  effectFXAA.uniforms.resolution.value.set(
    1 / canvas.offsetWidth,
    1 / canvas.offsetHeight,
  );

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(canvas.offsetWidth, canvas.offsetHeight),
    1.0,
    0.0,
    0.0,
  );

  const renderTarget = new THREE.WebGLRenderTarget(
    canvas.offsetWidth,
    canvas.offsetHeight,
  );
  let composer = new EffectComposer(renderer, renderTarget);

  composer.addPass(renderScene);
  composer.addPass(effectFXAA);
  composer.addPass(bloomPass);
  return composer;
};
