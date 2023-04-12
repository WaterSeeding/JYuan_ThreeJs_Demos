import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene } from './main';
import { setFlyLine } from './flyLine';

const Earth = () => {
  let earthRef = useRef<THREE.Group | any>(null);
  let cameraRef = useRef<THREE.PerspectiveCamera | any>(null);
  let controlsRef = useRef<OrbitControls | any>(null);
  let fatLineRef = useRef<Line2 | any>(null);

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

          addObj(earth);

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
              height: 200,
              rang: 100,
            },
          ];
          let flyLineGroup = new THREE.Group();
          setFlyLine(flyLineGroup, lineData, uniforms);
          setFatLine(flyLineGroup, lineData);
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

          fatLineRef.current?.resolution.set(
            window.innerWidth,
            window.innerHeight,
          );
        },
      );
    }
  }, []);

  const setFatLine = (group: THREE.Group, option: any): any => {
    const { source, target, height } = option[0];

    const _source = new THREE.Vector3(source.x, source.y, source.z);
    const _target = new THREE.Vector3(target.x, target.y, target.z);
    const _center = _target.clone().lerp(_source, 0.5);
    _center.z += height;

    let number = parseInt(
      _source.distanceTo(_center) + _target.distanceTo(_center) + '',
    );

    console.log('number', number);
    if (number < 300) {
      number = 300;
    }

    const positions = [];
    const colors = [];

    const spline: THREE.QuadraticBezierCurve3 = new THREE.QuadraticBezierCurve3(
      _source,
      _center,
      _target,
    );

    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0, l = number; i < l; i++) {
      const t = i / l;

      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);

    fatLineRef.current = new LineMaterial({
      color: 0x00ffff,
      linewidth: 4,
      vertexColors: true,
      alphaToCoverage: false,
    });

    let line = new Line2(geometry, fatLineRef.current);
    line.computeLineDistances();
    line.layers.enable(1);
    line.position.setZ(0);
    group.add(line);
  };

  const addObj = (earth: THREE.Group) => {
    let objGroup = new THREE.Group();
    objGroup.scale.set(10, 10, 10);
    earth.add(objGroup);
    let obj = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }),
    );
    obj.position.z = 0.25;
    obj.layers.enable(1);
    objGroup.add(obj);

    let objBack = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 1),
      new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false }),
    );
    objBack.position.z = -2.25;
    objGroup.add(objBack);
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
