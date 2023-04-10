import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const Sun = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  let starMesh: any;
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
        canvas: document.querySelector('canvas.webgl')!,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      renderer.setClearColor(0xfffffff, 0.0);

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        1000,
      );
      camera.position.set(20, 0, 0);
      camera.layers.enable(1);

      //bloom renderer
      const renderTarget = new THREE.WebGLRenderTarget(
        window.innerWidth,
        window.innerHeight,
      );
      composer = new EffectComposer(renderer, renderTarget);
      composer.renderToScreen = true;

      const renderScene = new RenderPass(scene, camera);
      composer.addPass(renderScene);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85,
      );
      bloomPass.threshold = 0;
      bloomPass.strength = 2; //intensity of glow
      bloomPass.radius = 0;
      composer.addPass(bloomPass);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 500;

      //ambient light
      const ambientlight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientlight);

      // galaxy geometry
      const starGeometry = new THREE.SphereGeometry(80, 64, 64);

      // galaxy material
      const starMaterial = new THREE.MeshBasicMaterial({
        map: new THREE.TextureLoader().load(require('./texture/galaxy1.png')),
        side: THREE.BackSide,
        transparent: true,
      });

      // galaxy mesh
      starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.layers.enable(1)
      scene.add(starMesh);

      // sun object
      const color = new THREE.Color('#FDB813');
      const geometry = new THREE.IcosahedronGeometry(1, 15);
      const material = new THREE.MeshBasicMaterial({ color: color });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(0, 0, 0);
      sphere.layers.enable(1);
      scene.add(sphere);

      window.addEventListener(
        'resize',
        () => {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
          composer!.setSize(window.innerWidth, window.innerHeight);
        },
        false,
      );

      stats = new Stats();
      document.body.appendChild(stats.dom);
    }

    function animate() {
      requestAnimationFrame(animate);
      stats.update();
      if (starMesh) {
        starMesh.rotation.y += 0.001;
      }
      renderer.autoClear = false;
      renderer.clear();

      camera.layers.set(1);
      if (composer) {
        composer.render();
      }

      renderer.clearDepth();
      camera.layers.set(0);
      renderer.render(scene, camera);
      // renderer.render(scene, camera);
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
