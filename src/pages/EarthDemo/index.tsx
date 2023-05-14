import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene } from './main';

const Earth = () => {
  let earthRef = useRef<THREE.Group | any>(null);
  let cameraRef = useRef<THREE.PerspectiveCamera | any>(null);
  let controlsRef = useRef<OrbitControls | any>(null);

  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene(
        ({
          earth,
          camera,
          controls,
          light,
          lightHelper,
        }: {
          earth: THREE.Group;
          camera: THREE.PerspectiveCamera;
          controls: OrbitControls;
          light: THREE.DirectionalLight;
          lightHelper: THREE.DirectionalLightHelper;
        }) => {
          earthRef.current = earth;
          cameraRef.current = camera;
          controlsRef.current = controls;

          addBox(earth);
        },
        () => {},
      );
    }
  }, []);

  const addBox = (earth: THREE.Group) => {
    let boxGroup = new THREE.Group();
    boxGroup.scale.set(10, 10, 10);
    earth.add(boxGroup);
    let box = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }),
    );
    box.position.z = 0.25;
    box.layers.enable(1);
    boxGroup.add(box);

    let boxBack = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 1),
      new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false }),
    );
    boxBack.position.z = -2.25;
    boxGroup.add(boxBack);
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
