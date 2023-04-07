import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    const BLOOM_SCENE = 1;
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_SCENE);

    const params = {
      exposure: 1,
      bloomStrength: 5,
      bloomThreshold: 0,
      bloomRadius: 0,
      scene: 'Scene with Glow',
    };

    const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });
    const materials: any = {};

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
    camera.position.set(0, 0, 20);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.addEventListener('change', render);

    scene.add(new THREE.AmbientLight(0x404040));

    let { bloomComposer, finalComposer } = addBloom(
      scene,
      camera,
      renderer,
      params,
    );

    setupScene();

    function setupScene() {
      scene.traverse(disposeMaterial);
      scene.children.length = 0;

      const geometry = new THREE.IcosahedronGeometry(1, 15);

      for (let i = 0; i < 3; i++) {
        const color = new THREE.Color();
        color.setHSL(Math.random(), 0.7, Math.random() * 0.2 + 0.05);

        const material = new THREE.MeshBasicMaterial({ color: color });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = Math.random() * 10 - 5;
        sphere.position.y = Math.random() * 10 - 5;
        sphere.position.z = Math.random() * 10 - 5;
        sphere.position.normalize().multiplyScalar(Math.random() * 4.0 + 2.0);
        sphere.scale.setScalar(Math.random() * Math.random() + 0.5);
        scene.add(sphere);

        if (i !== 1) sphere.layers.enable(BLOOM_SCENE);
      }

      addLine(scene, BLOOM_SCENE);

      render();
    }

    function disposeMaterial(obj: any) {
      if (obj.material) {
        obj.material.dispose();
      }
    }

    function render() {
      renderBloom(true);
      finalComposer.render();
    }

    function renderBloom(mask: any) {
      scene.traverse(darkenNonBloomed);
      bloomComposer.render();
      scene.traverse(restoreMaterial);
    }

    function darkenNonBloomed(obj: any) {
      if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
        materials[obj.uuid] = obj.material;
        obj.material = darkMaterial;
      }
    }

    function restoreMaterial(obj: any) {
      if (materials[obj.uuid]) {
        obj.material = materials[obj.uuid];
        delete materials[obj.uuid];
      }
    }
  };

  const addBloom = (
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    params: any,
  ) => {
    const renderScene = new RenderPass(scene, camera);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85,
    );
    bloomPass.threshold = params.bloomThreshold;
    bloomPass.strength = params.bloomStrength;
    bloomPass.radius = params.bloomRadius;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
          `,
        fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;
            varying vec2 vUv;
            void main() {
              gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
            }
          `,
        defines: {},
      }),
      'baseTexture',
    );
    finalPass.needsSwap = true;

    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(renderScene);
    finalComposer.addPass(finalPass);
    return { bloomComposer, finalComposer };
  };

  const addLine = (scene: THREE.Scene, BLOOM_SCENE: number) => {
    const positions: any = [];
    const colors: any = [];

    const points = GeometryUtils.hilbert3D(
      new THREE.Vector3(0, 0, 0),
      20.0,
      1,
      0,
      1,
      2,
      3,
      4,
      5,
      6,
      7,
    );

    const spline = new THREE.CatmullRomCurve3(points);
    const divisions = Math.round(12 * points.length);
    const point = new THREE.Vector3();
    const color = new THREE.Color();

    for (let i = 0, l = divisions; i < l; i++) {
      const t = i / l;

      spline.getPoint(t, point);
      positions.push(point.x, point.y, point.z);

      color.setHSL(t, 1.0, 0.5);
      colors.push(color.r, color.g, color.b);
    }

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(positions, 3),
    );
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const lineMat = new THREE.LineBasicMaterial({ vertexColors: true });

    const line = new THREE.Line(lineGeo, lineMat);
    line.computeLineDistances();
    line.position.setZ(0);
    line.layers.enable(BLOOM_SCENE);
    scene.add(line);
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
