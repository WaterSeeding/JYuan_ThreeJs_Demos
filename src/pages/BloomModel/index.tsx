import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SelectiveBloom } from "./js/SelectiveBloom";
import { DatGUI } from "./js/DatGUI";

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = async () => {
    const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      1,
      200,
    );
    camera.position.set(0, 0, 4);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.5, 0);
    controls.update();

    let selectiveBloom = new SelectiveBloom(scene, camera, renderer);
    new DatGUI(renderer, selectiveBloom);

    let light = new THREE.DirectionalLight();
    light.position.setScalar(1);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

    let { model,
      mixer }: any = await addModel(scene)

    const geometry = new THREE.BoxGeometry(1, 0.2, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    // cube.position.setX(-1)
    cube.position.setY(-0.2)
    // scene.add(cube);

    let clock = new THREE.Clock();

    window.addEventListener("resize", onResize);
    renderer.setAnimationLoop(() => {
      let delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      if (model) {
        model.material.color.set(0x000000);
        cube.material.color.set(0x000000);
      }
      renderer.setClearColor(0x000000);
      selectiveBloom.bloomComposer.render();
      if (model) {
        model.material.color.copy(model.userData.color);
        cube.material.color.set(0x00ff00);
      }
      renderer.setClearColor(0x102040);
      selectiveBloom.finalComposer.render();
    });

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      selectiveBloom.bloomComposer.setSize(window.innerWidth, window.innerHeight);
      selectiveBloom.finalComposer.setSize(window.innerWidth, window.innerHeight);
    }
  };

  const addModel = (scene: THREE.Scene) => {
    return new Promise((resolve, reject) => {
      let model: THREE.Object3D | undefined;
      let mixer: THREE.AnimationAction | undefined;
      let loader = new GLTFLoader();
      loader.load("https://cywarr.github.io/small-shop/Egg.glb", (gltf) => {
        model = gltf.scene.getObjectByName("Egg_with_Animation");
        model!.userData = {
          // @ts-ignore;
          color: new THREE.Color().copy(model.material.color)
        };

        mixer = new THREE.AnimationMixer(gltf.scene);
        mixer.clipAction(gltf.animations[0]).play();

        scene.add(model!);

        resolve({
          model,
          mixer
        })
      });
    })
  }

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
