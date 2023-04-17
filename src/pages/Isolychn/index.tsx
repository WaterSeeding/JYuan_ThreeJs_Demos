import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tetrahedra } from './js/Tetrahedra';
import { Postprocessing } from './js/Postprocessing';
import setSpherePoint from './setSpherePoint';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  const initScene: any = () => {
    let renderer: any;
    let bg = {
      on: 0x321632,
      off: 0x000000,
    };

    function init() {
      let scene = new THREE.Scene();
      scene.background = new THREE.Color(bg.on);
      let camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        1,
        1000,
      );
      camera.position.set(0, 0, 100);

      const canvas = document.querySelector(
        'canvas.webgl',
      ) as HTMLCanvasElement;
      renderer = new THREE.WebGLRenderer({
        canvas: canvas!,
        antialias: true,
      });
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.LinearToneMapping;

      const sphereGroup = new THREE.Group();
      scene.add(sphereGroup);

      let controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.autoRotate = false;

      let gu = {
        globalBloom: { value: 0 },
      };

      let tetraCount = 10;
      let tetrahedra = new Tetrahedra(scene, tetraCount, gu);
      tetrahedra.material.linewidth = 0.25;
      tetrahedra.items.forEach((t, i) => {
        t.position
          .randomDirection()
          .setLength(Math.sqrt(Math.pow(50, 2) * Math.random()));
        t.scale.setScalar(5);
        tetrahedra.setColorAt(i, Math.random() < 0.5 ? 0xff0000 : 0x007fff);
      });
      tetrahedra.items[0].position.set(0, 0, 0);
      tetrahedra.items[0].scale.setScalar(10);
      tetrahedra.setColorAt(0, 0xff00ff);
      tetrahedra.items.forEach((item) => {
        setSpherePoint(sphereGroup, item.position, 0x00ff00);
      });

      scene.add(tetrahedra);

      let postprocessing = new Postprocessing(scene, camera, renderer);
      postprocessing.bloomComposer!.setSize(
        window.innerWidth,
        window.innerHeight,
      );
      postprocessing.finalComposer!.setSize(
        window.innerWidth,
        window.innerHeight,
      );

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        tetrahedra.update();
        gu.globalBloom.value = 1;
        scene.background!.set(bg.off);
        postprocessing.bloomComposer!.render();
        gu.globalBloom.value = 0;
        scene.background!.set(bg.on);
        postprocessing.finalComposer!.render();
      };
      animate();
    }

    init();
  };

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

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
