import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SelectiveGlow } from "./js/SelectiveGlow";
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      innerWidth / innerHeight,
      1,
      100,
    );
    camera.position.set(0, 10, 10);
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    let m1 = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: "red" })
    );
    m1.position.set(-3 * 2, 0, 0);
    scene.add(m1);

    let m2 = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: "green" })
    );
    m2.position.set(3 * 2, 0, 0);
    scene.add(m2);

    let m0 = new THREE.Mesh(
      new THREE.SphereGeometry(1),
      new THREE.MeshBasicMaterial({ color: "blue" })
    );
    m0.position.set(0, 0, 0);
    scene.add(m0);

    let sg = new SelectiveGlow(scene, camera, renderer);
    console.log(sg);

    let gui = new GUI();
    let bp1 = gui.addFolder("bloomPass1");
    bp1.add(sg.bloomPass1, "strength", 0.0, 10.0);
    bp1.add(sg.bloomPass1, "radius", 0.0, 1.0);
    let bp2 = gui.addFolder("bloomPass2");
    bp2.add(sg.bloomPass2, "strength", 0.0, 10.0);
    bp2.add(sg.bloomPass2, "radius", 0.0, 1.0);

    renderer.setAnimationLoop(() => {
      m0.material.color.set(0x000000);

      m1.material.color.set(0xff0000);
      m2.material.color.set(0x000000);
      sg.bloom1.render();

      m1.material.color.set(0x000000);
      m2.material.color.set(0x00ff00);
      sg.bloom2.render();

      m0.material.color.set(0x0000ff);
      m1.material.color.set(0xff0000);
      m2.material.color.set(0x00ff00);
      sg.final.render();
      //renderer.render(scene, camera);
    });
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
