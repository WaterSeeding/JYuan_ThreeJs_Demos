import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import {
  Clock,
  Color,
  PerspectiveCamera,
  ReinhardToneMapping,
  Scene,
  WebGLRenderer,
} from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Tetrahedra } from './js/Tetrahedra';
import { Postprocessing } from './js/Postprocessing';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  const initScene: any = () => {
    let renderer: any, scene: any, camera: any, controls: any;
    let stats: any;

    let bg = {
      on: 0x321632,
      off: 0x000000,
    };

    function init() {
      let bg = {
        on: 0x321632,
        off: 0x000000,
      };
      let scene = new Scene();
      scene.background = new Color(bg.on);
      let camera = new PerspectiveCamera(
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

      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = ReinhardToneMapping;
      window.addEventListener('resize', (event) => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        postprocessing.bloomComposer.setSize(
          window.innerWidth,
          window.innerHeight,
        );
        postprocessing.finalComposer.setSize(
          window.innerWidth,
          window.innerHeight,
        );
      });

      let controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.enablePan = false;
      controls.autoRotate = true;

      let gu = {
        globalBloom: { value: 0 },
      };

      let tetraCount = 10;
      let tetrahedra = new Tetrahedra(tetraCount, gu);
      tetrahedra.material.linewidth = 0.25;
      tetrahedra.items.forEach((t, i) => {
        t.position
          .randomDirection()
          .setLength(Math.sqrt(Math.pow(50, 2) * Math.random()));
        t.scale.setScalar(5);
        t.userData = {
          rotInit: {
            x: Math.random() * Math.PI * 2,
            y: Math.random() * Math.PI * 2,
            z: Math.random() * Math.PI * 2,
          },
          rotSpeed: {
            x: Math.random() * Math.PI * 0.2,
            y: Math.random() * Math.PI * 0.2,
            z: Math.random() * Math.PI * 0.2,
          },
        };
        tetrahedra.setColorAt(i, Math.random() < 0.5 ? 0xff0000 : 0x007fff);
      });
      tetrahedra.items[0].position.set(0, 0, 0);
      tetrahedra.items[0].scale.setScalar(50);
      tetrahedra.setColorAt(0, 0xff00ff);
      scene.add(tetrahedra);

      let postprocessing = new Postprocessing(scene, camera, renderer);

      let clock = new Clock();

      renderer.setAnimationLoop((_) => {
        controls.update();
        let t = clock.getElapsedTime();
        tetrahedra.items.forEach((ti, idx) => {
          let ud = ti.userData;
          let ri = ud.rotInit;
          let rs = ud.rotSpeed;
          let dir = idx % 2 === 0 ? -1 : 1;
          ti.rotation.set(
            ri.x + rs.x * t * dir,
            ri.y + rs.y * t * dir,
            ri.z + rs.z * t * dir,
          );
        });
        tetrahedra.update();

        // postprocessing
        gu.globalBloom.value = 1;
        scene.background.set(bg.off);
        postprocessing.bloomComposer.render();
        gu.globalBloom.value = 0;
        scene.background.set(bg.on);
        postprocessing.finalComposer.render();

        // renderer.render(scene, camera);
      });
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
