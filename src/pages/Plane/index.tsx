import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene } from './main';

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
          setFatLine(flyLineGroup, lineData);
          earth.add(flyLineGroup);

          addPlane(earth);
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

    const colorMap = new THREE.TextureLoader().load(
      require('./image/color.png'),
    );
    colorMap.center = new THREE.Vector2(0.5, 0.5);
    colorMap.needsUpdate = true;

    fatLineRef.current = new LineMaterial({
      vertexColors: true,
      linewidth: 10,
      // vertexColors: true,
      transparent: true,
      // @ts-ignore;
      onBeforeCompile: (shader) => {
        console.log(shader);
        shader.uniforms.colorMap = { value: colorMap };
        shader.fragmentShader = `
            uniform sampler2D colorMap;
            ${shader.fragmentShader}
          `.replace(
          `#include <premultiplied_alpha_fragment>`,
          `#include <premultiplied_alpha_fragment>
              gl_FragColor = texture2D(colorMap, vUv);
            `,
        );
      },
    });

    let line = new Line2(geometry, fatLineRef.current);
    line.computeLineDistances();
    line.layers.enable(1);
    line.position.setZ(0);
    group.add(line);
  };

  const addPlane = (earth: THREE.Group) => {
    const colorMap = new THREE.TextureLoader().load(
      require('./image/color.png'),
    );
    colorMap.center = new THREE.Vector2(0.5, 0.5);
    // colorMap.rotation = Math.PI / 2;
    colorMap.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(80 * 12, 48);
    const material = new THREE.MeshBasicMaterial({
      map: colorMap,
      side: THREE.FrontSide,
      transparent: true,
      // @ts-ignore;
      onBeforeCompile: (shader) => {
        shader.uniforms.colorMap = { value: colorMap };
        shader.vertexShader = `
          varying vec2 vUv;
          ${shader.vertexShader}
        `.replace(
          `#include <uv_vertex>`,
          `#include <uv_vertex>
            vUv = uv;
          `,
        );

        shader.fragmentShader = `
            uniform sampler2D colorMap;
            varying vec2 vUv;
            ${shader.fragmentShader}
          `.replace(
          `#include <premultiplied_alpha_fragment>`,
          `#include <premultiplied_alpha_fragment>
              gl_FragColor = texture2D(colorMap, vUv);
            `,
        );
      },
    });
    const plane = new THREE.Mesh(geometry, material);
    plane.position.setZ(10);
    earth.add(plane);
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
