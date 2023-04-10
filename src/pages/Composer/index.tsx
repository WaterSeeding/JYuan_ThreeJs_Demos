import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const Sun = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  let composer: null | EffectComposer;

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    let renderer: any, scene: any, camera: any, controls: any;
    let stats: any;

    init();
    animate();

    function init() {
      const canvas = document.querySelector(
        'canvas.webgl',
      ) as HTMLCanvasElement;
      renderer = new THREE.WebGLRenderer({
        canvas: canvas!,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000);

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000,
      );
      camera.position.set(-5, 5, 5);
      camera.layers.enable(1);

      let light = new THREE.DirectionalLight(0xffffff, 0.75);
      light.position.setScalar(100);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0xffffff, 0.25));

      let obj = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 4),
        new THREE.MeshLambertMaterial({ color: 0xffffff, wireframe: false }),
      );
      obj.position.z = 0.25;
      // obj.layers.enable(1);
      scene.add(obj);

      let objBack = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 1),
        new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false }),
      );
      objBack.position.z = -2.25;
      objBack.layers.enable(1);
      scene.add(objBack);

      /** COMPOSER */
      let renderScene = new RenderPass(scene, camera);
      let effectFXAA = new ShaderPass(FXAAShader);
      effectFXAA.uniforms.resolution.value.set(
        1 / window.innerWidth,
        1 / window.innerHeight,
      );

      let bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85,
      );
      bloomPass.threshold = 0.05;
      bloomPass.strength = 1.2;
      bloomPass.radius = 0.55;
      bloomPass.renderToScreen = true;

      const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
      );
      composer = new EffectComposer(renderer, renderTarget);

      composer.addPass(renderScene);
      composer.addPass(effectFXAA);
      composer.addPass(bloomPass);

      // renderer.gammaInput = true;
      // renderer.gammaOutput = true;
      // renderer.toneMappingExposure = Math.pow(0.9, 4.0);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 500;

      stats = new Stats();
      document.body.appendChild(stats.dom);
    }

    function animate() {
      requestAnimationFrame(animate);
      stats.update();
      renderer.autoClear = false;
      renderer.clear();

      camera.layers.set(1);
      if (composer) {
        composer.render();
      }

      renderer.clearDepth();
      camera.layers.set(0);
      renderer.render(scene, camera);
    }
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

export default Sun;
