import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  let mat2: any;

  const initScene: any = () => {
    let renderer: any, scene: any, camera: any, controls: any;
    let stats: any;

    function init() {
      const canvas = document.querySelector(
        'canvas.webgl',
      ) as HTMLCanvasElement;
      renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('canvas.webgl')!,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000, 0.0);
      renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        40,
        window.innerWidth / window.innerHeight,
        1,
        1000,
      );
      camera.position.set(0, 0, 200);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 500;

      let points = [];
      let colors = [];
      let radius = 10;
      const color = new THREE.Color();

      for (let i = 0; i <= 360; i++) {
        points.push(
          Math.sin(i * (Math.PI / 180)) * radius, // 计算出x
          Math.cos(i * (Math.PI / 180)) * radius, // 计算出y
          0,
        );
        color.setRGB(0.0, 1.0, 1.0);
        colors.push(color.r, color.g, color.b);
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));

      let mat = new THREE.LineBasicMaterial({
        color: '#00ffff',
      });

      let line = new THREE.Line(geo, mat);
      line.position.setX(-50);
      scene.add(line);

      const lineDash = new THREE.Line(
        geo.clone(),
        new THREE.LineDashedMaterial({
          color: 0x00ffff,
          dashSize: 1,
          gapSize: 2,
        }),
      );
      lineDash.computeLineDistances();
      scene.add(lineDash);

      const geo2 = new LineGeometry();
      geo2.setPositions(points);
      geo2.setColors(colors);

      mat2 = new LineMaterial({
        linewidth: 4,
        vertexColors: true,
        dashed: true,
        gapSize: 2,
      });

      let line2 = new Line2(geo2, mat2);
      line2.computeLineDistances();
      line2.position.setX(50);
      scene.add(line2);

      stats = new Stats();
      document.body.appendChild(stats.dom);
    }

    function animate() {
      requestAnimationFrame(animate);
      stats.update();
      mat2.resolution.set(window.innerWidth, window.innerHeight); // 视图的分辨率
      renderer.render(scene, camera);
    }

    init();
    animate();
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
