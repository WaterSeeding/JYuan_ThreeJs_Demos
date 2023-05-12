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

          let pointVector3Arr = [
            new THREE.Vector3(-10 * 10, -5 * 10, 0),
            new THREE.Vector3(-5 * 10, 10 * 10, 0),
            new THREE.Vector3(0 * 10, 20 * 10, 0),
            new THREE.Vector3(5 * 10, 5 * 10, 0),
          ];

          let group = new THREE.Group();
          group.position.setZ(5);
          earthRef.current.add(group);

          setPoint(group, pointVector3Arr);
          setCurve1(group, pointVector3Arr);
          setCurve2(group, pointVector3Arr);

          let zhuanxianLineData = require('./data/zhuanxianLine.json');
          // let lineData: any[] = [];
          zhuanxianLineData.features.forEach((feature: any) => {
            // let region = feature.properties.region;
            // if (region === '南海西部') {
            //   lineData.push(feature);
            // }
            let pointPosVector3Arr: any[] = [];
            let coordinates = feature.geometry.coordinates;
            coordinates.forEach((coordinate: number[]) => {
              let pointPos = calculationPos(coordinate);
              let pointPosVector3 = new THREE.Vector3(
                pointPos[0],
                pointPos[1],
                0,
              );
              pointPosVector3Arr.push(pointPosVector3);
            });
            setCurve2(group, pointPosVector3Arr, 0.1);
          });
          // console.log(JSON.stringify(lineData));
        },
        () => {},
      );
    }
  }, []);

  const calculationPos = (point: number[]) => {
    let x = (point[0] / 180) * (2048 / 2);
    let y = (point[1] / 90) * (1024 / 2);
    return [x, y];
  };

  const setPoint = (
    earth: THREE.Group,
    pointVector3Arr: THREE.Vector3[],
  ): void => {
    const sphereGeomtry = new THREE.SphereGeometry(2, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
    });
    pointVector3Arr.forEach((pointVector3: THREE.Vector3) => {
      const helper = new THREE.Mesh(sphereGeomtry, sphereMaterial);
      helper.position.copy(pointVector3);
      earth.add(helper);
    });
  };

  const setCurve1 = (earth: THREE.Group, pointVector3Arr: THREE.Vector3[]) => {
    const curve = new THREE.CubicBezierCurve3(
      pointVector3Arr[0],
      pointVector3Arr[1],
      pointVector3Arr[2],
      pointVector3Arr[3],
    );

    // create curve mesh
    const points = curve.getPoints(100);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const curveObject = new THREE.Line(lineGeometry, material);
    earth.add(curveObject);

    // visualize spaced points
    const sphereGeomtry = new THREE.SphereGeometry(1, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
    });

    const spacedPoints = curve.getPoints(10); // t

    for (let point of spacedPoints) {
      const helper = new THREE.Mesh(sphereGeomtry, sphereMaterial);
      helper.position.copy(point);
      earth.add(helper);
    }
  };

  const setCurve2 = (
    earth: THREE.Group,
    pointVector3Arr: THREE.Vector3[],
    sphereSize: number = 1.0,
  ) => {
    const curve = new THREE.CubicBezierCurve3(
      pointVector3Arr[0],
      pointVector3Arr[1],
      pointVector3Arr[2],
      pointVector3Arr[3],
    );

    // create curve mesh

    const points = curve.getPoints(100);
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const curveObject = new THREE.Line(lineGeometry, material);
    earth.add(curveObject);

    // visualize spaced points

    const sphereGeomtry = new THREE.SphereGeometry(sphereSize, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    const spacedPoints = curve.getSpacedPoints(10); // u

    for (let point of spacedPoints) {
      const helper = new THREE.Mesh(sphereGeomtry, sphereMaterial);
      helper.position.copy(point);
      earth.add(helper);
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

export default Earth;
