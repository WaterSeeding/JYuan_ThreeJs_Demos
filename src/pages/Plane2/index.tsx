import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene } from './main';
import { setModel } from './setModel';

const Earth = () => {
  let earthRef = useRef<THREE.Group | any>(null);
  let cameraRef = useRef<THREE.PerspectiveCamera | any>(null);
  let controlsRef = useRef<OrbitControls | any>(null);

  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  let uniforms = {
    time: { value: 0.0, number: 0.0 },
  };

  const clock = new THREE.Clock();

  useEffect(() => {
    let plane: THREE.Mesh | null = null;
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

          setModel(earth, './glb/1F_01.glb').then((res: any) => {
            let model = res.model as THREE.Object3D
            model.position.set(0, 0, 0);
            model.scale.set(100, 100, 100)
            model.rotateX(-Math.PI / 2);
            model.position.setY(0)
          });

          plane = addPlane2(earth);
          console.log('plane!.material', plane!.material);
        },
        () => {
          const dt = clock.getDelta();
          uniforms['time'].value += dt;
          uniforms['time'].number = Math.floor(uniforms['time'].value);

          if (plane) {
            plane!.material!.uniforms.uTime = {
              value: uniforms['time'].number,
            };
          }
        },
      );
    }
  }, []);

  const addPlane2 = (earth: THREE.Group): THREE.Mesh => {
    const colorMap = new THREE.TextureLoader().load(
      require('./image/color.png'),
    );
    colorMap.center = new THREE.Vector2(0.5, 0.5);
    colorMap.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(80 * 12, 48);
    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        colorMap: {
          value: colorMap,
        },
        uTime: {
          value: 0,
        },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D colorMap;
        uniform float uTime;
        varying vec2 vUv;
        vec4 color = vec4(1.0, 1.0, 1.0, 1.0);
        void main() {
          color = texture2D(colorMap, vUv);
          if (vUv.x > (uTime / 100.0)) {
            color = vec4(color.r * 0.5, color.g, color.b, color.a);
          }
          gl_FragColor = color;
        }
      `,
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.set(0, 0, 1);
    earth.add(plane);
    return plane;
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
