import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { initScene } from './main';
import { setFlyLine } from './flyLine';

const Earth = () => {
  let earthRef = useRef<THREE.Group | any>(null);
  let cameraRef = useRef<THREE.PerspectiveCamera | any>(null);
  let controlsRef = useRef<OrbitControls | any>(null);

  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  let uniforms = {
    time: { value: 0.0 },
    startTime: { value: 0.0 },
  };

  const clock = new THREE.Clock();

  let isStart = true;

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

          const lineData = [
            {
              source: {
                x: 500,
                y: 0,
                z: 0,
              },
              target: {
                x: -500,
                y: 0,
                z: 0,
              },
              color: '#00ffff',
              speed: 0.2,
              size: 400,
              height: 100,
              rang: 100,
            },
          ];
          let flyLineGroup = new THREE.Group();
          setFlyLine(flyLineGroup, lineData, uniforms);
          earth.add(flyLineGroup);
        },
        () => {
          const dt = clock.getDelta();
          uniforms['time'].value += dt;
          if (isStart) {
            uniforms['startTime'].value += dt * 0.5;
            if (uniforms['startTime'].value >= 1) {
              uniforms['startTime'].value = 1;
              isStart = false;
            }
          }
        },
      );
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
