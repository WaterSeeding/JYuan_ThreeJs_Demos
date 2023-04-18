import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    let renderer: any,
      scene: any,
      camera: THREE.PerspectiveCamera | undefined,
      controls: any;
    let stats: any;
    const groups: THREE.Group[] | any[] = [];

    init();
    animate();

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
        45,
        window.innerWidth / window.innerHeight,
        1,
        100000,
      );
      camera.position.set(0, 0, 500);

      const loader = new SVGLoader();

      loader.load('./svg/union.svg', function (data) {
        const paths = data.paths;

        const group = new THREE.Group();
        group.scale.set(0.05, 0.05, 0.05);

        for (let i = 0; i < paths.length; i++) {
          const path = paths[i];

          const fillColor = path.userData!.style.fill;
          const material = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setStyle(fillColor).convertSRGBToLinear(),
            opacity: path.userData!.style.fillOpacity,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            wireframe: false,
          });

          const shapes = SVGLoader.createShapes(path);
          for (let j = 0; j < shapes.length; j++) {
            const shape = shapes[j];
            const geometry = new THREE.ShapeGeometry(shape);
            const mesh = new THREE.Mesh(geometry, material);
            mesh.rotateZ(-Math.PI);
            mesh.rotateY(-Math.PI);
            group.add(mesh);
          }
        }

        let box = new THREE.Box3().setFromObject(group);
        let boxLen = box.max.x - box.min.x;
        let boxWid = box.max.z - box.min.z;
        let boxHei = box.max.y - box.min.y;
        let x = box.min.x + boxLen / 2;
        let y = box.min.y + boxHei / 2;
        let z = box.min.z + boxWid / 2;

        group.position.set(-x, -y, -z);
        groups.push(group);

        scene.add(group);
      });

      controls = new OrbitControls(camera, renderer.domElement);

      stats = new Stats();
      document.body.appendChild(stats.dom);
    }

    function animate() {
      stats.update();
      groups.forEach((group: THREE.Group) => {
        group.quaternion.copy(camera!.quaternion);
      });
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
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
