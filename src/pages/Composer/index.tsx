import styles from './index.less';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const Sun = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  let composer: null | EffectComposer;
  let fatLineRef = useRef<Line2 | any>(null);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    let renderer: any, scene: any, camera: any, controls: any;
    let stats: any;

    init();
    animate();

    function init() {
      const canvas = document.querySelector(
        'canvas.webgl',
      ) as HTMLCanvasElement;
      renderer = new THREE.WebGLRenderer({
        canvas: canvas!,
        antialias: true,
      });
      renderer.setClearColor(0x000000);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.toneMapping = THREE.LinearToneMapping;

      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000,
      );
      camera.position.set(-20, 0, 0);
      camera.layers.enable(1);

      const axesHelper = new THREE.AxesHelper(500);
      scene.add(axesHelper);

      addLight(scene);

      addObj(scene);

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
      setFatLine(scene, lineData);

      composer = addComposer(renderer, scene, camera);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.minDistance = 10;
      controls.maxDistance = 500;

      stats = new Stats();
      document.body.appendChild(stats.dom);
    }

    function animate() {
      requestAnimationFrame(animate);
      stats.update();

      fatLineRef.current?.resolution.set(window.innerWidth, window.innerHeight);

      renderer.autoClear = false;
      renderer.clear();
      camera.layers.set(1);
      if (composer) {
        composer.render();
      }
      renderer.clearDepth();
      camera.layers.set(0);
      renderer.render(scene, camera);
    }
  };

  const addLight = (scene: THREE.Scene) => {
    let light = new THREE.DirectionalLight(0xffffff, 0.75);
    light.position.setScalar(100);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  };

  const addComposer = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
  ) => {
    let renderScene = new RenderPass(scene, camera);
    let effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms.resolution.value.set(
      1 / window.innerWidth,
      1 / window.innerHeight,
    );

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85,
    );
    bloomPass.threshold = 0;
    bloomPass.strength = 0.6;
    bloomPass.radius = 0.0;

    const renderTarget = new THREE.WebGLRenderTarget(
      window.innerWidth,
      window.innerHeight,
    );
    composer = new EffectComposer(renderer, renderTarget);

    composer.addPass(renderScene);
    composer.addPass(effectFXAA);
    composer.addPass(bloomPass);
    return composer;
  };

  const addObj = (scene: THREE.Scene) => {
    let obj = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }),
    );
    obj.position.z = 0.25;
    obj.layers.enable(1);
    scene.add(obj);

    let objBack = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 1),
      new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false }),
    );
    objBack.position.z = -2.25;
    scene.add(objBack);
  };

  const setFatLine = (group: THREE.Scene, option: any): any => {
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
      console.log('t', t);
      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.lerpHSL(new THREE.Color(0.0, 1.0, 1.0), t);
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
    line.rotateX(-Math.PI / 2);

    group.add(line);
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

export default Sun;
