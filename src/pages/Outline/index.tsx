import styles from './index.less';
import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);
  const stats = new Stats();
  const controlsRef = useRef<any>(null);
  const composerRef = useRef<any>(null);
  const outlinePassRef = useRef<any>(null);
  const groupRef = useRef<any>(null);

  const params: any = {
    edgeStrength: 3.0,
    edgeGlow: 0.0,
    edgeThickness: 1.0,
    pulsePeriod: 0,
    rotate: false,
    usePatternTexture: false,
  };

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    let selectedObjects: any[] = [];

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const obj3d = new THREE.Object3D();
    const group = new THREE.Group();
    groupRef.current = group;

    const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.toneMapping = THREE.LinearToneMapping;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100,
    );
    camera.position.set(0, 0, 8);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    addLight(scene);

    const loader = new OBJLoader();
    loader.load('./img/model/tree.obj', function (object: any) {
      let scale = 1.0;

      object.traverse(function (child: any) {
        if (child instanceof THREE.Mesh) {
          child.geometry.center();
          child.geometry.computeBoundingSphere();
          scale = 0.2 * child.geometry.boundingSphere.radius;

          const phongMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            specular: 0x111111,
            shininess: 5,
          });
          child.material = phongMaterial;
          child.receiveShadow = true;
          child.castShadow = true;
        }
      });

      object.position.y = 1;
      object.scale.divideScalar(scale);
      obj3d.add(object);
    });

    scene.add(group);

    group.add(obj3d);

    const geometry = new THREE.SphereGeometry(3, 48, 24);

    for (let i = 0; i < 20; i++) {
      const material = new THREE.MeshLambertMaterial();
      material.color.setHSL(Math.random(), 1.0, 0.3);

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = Math.random() * 4 - 2;
      mesh.position.y = Math.random() * 4 - 2;
      mesh.position.z = Math.random() * 4 - 2;
      mesh.receiveShadow = true;
      mesh.castShadow = true;
      mesh.scale.multiplyScalar(Math.random() * 0.3 + 0.1);
      group.add(mesh);
    }

    const floorMaterial = new THREE.MeshLambertMaterial({
      side: THREE.DoubleSide,
    });

    const floorGeometry = new THREE.PlaneGeometry(12, 12);
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    floorMesh.rotation.x -= Math.PI * 0.5;
    floorMesh.position.y -= 1.5;
    group.add(floorMesh);
    floorMesh.receiveShadow = true;

    const torusGeometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
    const torusMaterial = new THREE.MeshPhongMaterial({ color: 0xffaaff });
    const torus = new THREE.Mesh(torusGeometry, torusMaterial);
    torus.position.z = -4;
    group.add(torus);
    torus.receiveShadow = true;
    torus.castShadow = true;

    const gui = new GUI({ width: 280 });

    outlinePassRef.current = new OutlinePass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      scene,
      camera,
    );

    composerRef.current = addComposer(
      renderer,
      scene,
      camera,
      outlinePassRef.current,
      gui,
      params,
    );

    gui.add(params, 'rotate');

    renderer.domElement.style.touchAction = 'none';
    renderer.domElement.addEventListener('pointermove', onPointerMove);

    function onPointerMove(event: any) {
      if (event.isPrimary === false) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      checkIntersection();
    }

    function addSelectedObject(object: any) {
      selectedObjects = [];
      selectedObjects.push(object);
    }

    function checkIntersection() {
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObject(scene, true);

      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        addSelectedObject(selectedObject);
        outlinePassRef.current.selectedObjects = selectedObjects;
      } else {
        // outlinePass.selectedObjects = [];
      }
    }

    animate();
  };

  const addComposer = (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    outlinePass: OutlinePass,
    gui: GUI,
    params: any,
  ) => {
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    composer.addPass(outlinePass);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.load('./img/textures/tri_pattern.jpg', function (texture) {
      outlinePass.patternTexture = texture;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
    });

    let effectFXAA = new ShaderPass(FXAAShader);
    effectFXAA.uniforms['resolution'].value.set(
      1 / window.innerWidth,
      1 / window.innerHeight,
    );
    composer.addPass(effectFXAA);

    gui.add(params, 'edgeStrength', 0.01, 10).onChange(function (value: any) {
      outlinePass.edgeStrength = Number(value);
    });

    gui.add(params, 'edgeGlow', 0.0, 1).onChange(function (value: any) {
      outlinePass.edgeGlow = Number(value);
    });

    gui.add(params, 'edgeThickness', 1, 4).onChange(function (value: any) {
      outlinePass.edgeThickness = Number(value);
    });

    gui.add(params, 'pulsePeriod', 0.0, 5).onChange(function (value: any) {
      outlinePass.pulsePeriod = Number(value);
    });

    gui.add(params, 'usePatternTexture').onChange(function (value: any) {
      outlinePass.usePatternTexture = value;
    });

    const conf = {
      visibleEdgeColor: '#ffffff',
      hiddenEdgeColor: '#190a05',
    };

    gui.addColor(conf, 'visibleEdgeColor').onChange(function (value: any) {
      outlinePass.visibleEdgeColor.set(value);
    });

    gui.addColor(conf, 'hiddenEdgeColor').onChange(function (value: any) {
      outlinePass.hiddenEdgeColor.set(value);
    });

    return composer;
  };

  const addLight = (scene: THREE.Scene) => {
    scene.add(new THREE.AmbientLight(0xaaaaaa, 0.2));

    const light = new THREE.DirectionalLight(0xddffdd, 0.6);
    light.position.set(1, 1, 1);
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    const d = 10;

    light.shadow.camera.left = -d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = -d;
    light.shadow.camera.far = 1000;

    scene.add(light);
  };

  const animate = () => {
    requestAnimationFrame(animate);
    stats.update();
    const timer = performance.now();
    if (params.rotate) {
      groupRef.current.rotation.y = timer * 0.0001;
    }
    controlsRef.current.update();
    composerRef.current.render();

    stats.end();
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
