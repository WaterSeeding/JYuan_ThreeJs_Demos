import styles from './index.less';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  const stats = new Stats();
  const composerRef = useRef<any>(null);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    const BLOOM_SCENE = 1;
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_SCENE);

    const params = {
      exposure: 1,
      bloomStrength: 2.0,
      bloomRadius: 0,
    };

    const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.toneMapping = THREE.LinearToneMapping;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200,
    );
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1;
    controls.maxDistance = 100;

    addLight(scene);

    composerRef.current = addComposer(renderer, scene, camera, params);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    animate();
  };

  const addComposer = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    params: any,
  ) => {
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85,
    );
    bloomPass.threshold = 0;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    let composer = new EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    const gui = new GUI();

    gui.add(params, 'exposure', 0.1, 2).onChange(function (value: any) {
      renderer.toneMappingExposure = Math.pow(value, 4.0);
    });

    gui.add(params, 'bloomStrength', 0.0, 10.0).onChange(function (value: any) {
      bloomPass.strength = Number(value);
    });

    gui
      .add(params, 'bloomRadius', 0.0, 10.0)
      .step(0.01)
      .onChange(function (value: any) {
        bloomPass.radius = Number(value);
      });

    return composer;
  };

  const addLight = (scene: THREE.Scene) => {
    scene.add(new THREE.AmbientLight(0x404040));
  };

  const animate = () => {
    requestAnimationFrame(animate);
    stats.update();
    composerRef.current.render();
  };

  return (
    <div className={styles.container}>
      <canvas
        className="webgl"
        style={{ width: '100%', height: '100%' }}
      ></canvas>
    </div>
  );
};

export default Earth;
