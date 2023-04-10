import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const params = {
  exposure: 1,
  bloomStrength: 5,
  bloomThreshold: 0,
  bloomRadius: 0,
  scene: 'Scene with Glow',
};

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
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.toneMapping = THREE.CineonToneMapping;

  const scene = new THREE.Scene();
  const axesHelper = new THREE.AxesHelper(500);
  scene.add(axesHelper);

  const frustumSize = 45;
  const aspect = window.innerWidth / window.innerHeight;
  const camera = new THREE.PerspectiveCamera(frustumSize, aspect, 1, 10000);
  camera.position.set(0, 1000, 500);
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
      renderer.toneMappingExposure = 1.4;
    },
  );

  let { bloomComposer, finalComposer } = addBloom(
    scene,
    camera,
    renderer,
    params,
  );

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

  function renderBloom(mask: any) {
    scene.traverse(darkenNonBloomed);
    bloomComposer.render();
    scene.traverse(restoreMaterial);
  }

  function darkenNonBloomed(obj: any) {
    if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
      materials[obj.uuid] = obj.material;
      obj.material = darkMaterial;
    }
  }

  function restoreMaterial(obj: any) {
    if (materials[obj.uuid]) {
      obj.material = materials[obj.uuid];
      delete materials[obj.uuid];
    }
  }

  const animate = () => {
    requestAnimationFrame(animate);
    TWEEN && TWEEN.update();
    controls?.update();
    updateCb?.();
    // renderer.render(scene, camera);
    renderBloom(true);
    finalComposer.render();
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

const addBloom = (
  scene: THREE.Scene,
  camera: THREE.Camera,
  renderer: THREE.WebGLRenderer,
  params: any,
) => {
  const renderScene = new RenderPass(scene, camera);

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85,
  );
  bloomPass.threshold = params.bloomThreshold;
  bloomPass.strength = params.bloomStrength;
  bloomPass.radius = params.bloomRadius;

  const bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderScene);
  bloomComposer.addPass(bloomPass);

  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
      fragmentShader: `
          uniform sampler2D baseTexture;
          uniform sampler2D bloomTexture;
          varying vec2 vUv;
          void main() {
            gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
          }
        `,
      defines: {},
    }),
    'baseTexture',
  );
  finalPass.needsSwap = true;

  const finalComposer = new EffectComposer(renderer);
  finalComposer.addPass(renderScene);
  finalComposer.addPass(finalPass);
  return { bloomComposer, finalComposer };
};
