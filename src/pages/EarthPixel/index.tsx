import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useGetState } from 'ahooks';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const Earth = () => {
  const heightMapContextRef = useRef<any>(null);
  const [heightMapPoint, setHeightMapPoint, getHeightMapPoint] =
    useGetState<boolean>(false);

  useEffect(() => {
    initThree();
  }, []);

  const initThree = () => {
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.CineonToneMapping;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color('gainsboro');

    var camera = new THREE.PerspectiveCamera(
      30,
      innerWidth / innerHeight,
      1,
      5000,
    );
    camera.position.set(0, 100, 700);
    camera.lookAt(scene.position);

    const earth = new THREE.Group();
    let controls: null | OrbitControls = null;
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true;
    controls.autoRotate = false;
    controls.enableDamping = true;
    controls.enableRotate = true;
    controls.enablePan = true;
    // controls.maxPolarAngle = 1.5;

    window.addEventListener(
      'resize',
      () => {
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      },
      false,
    );

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.intensity = 0.8;
    light.position.set(0, 1000, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 512;
    light.shadow.mapSize.height = 512;
    light.shadow.camera.top = 10;
    light.shadow.camera.bottom = -5;
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 10;
    scene.add(light);
    const lightHelper = new THREE.DirectionalLightHelper(light, 5);
    scene.add(lightHelper);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const textLoader = new THREE.TextureLoader();

    const earthMap = textLoader.load(
      require('./zhonghaiyou/chinahaiyu_gaocheng.png'),
      (texture) => {
        let canvas = document.createElement('canvas');
        canvas.width = texture.image.width;
        canvas.height = texture.image.height;

        heightMapContextRef.current = canvas.getContext('2d');
        heightMapContextRef.current.drawImage(texture.image, 0, 0);
      },
    );

    const planet = new THREE.Mesh(
      new THREE.PlaneGeometry(2048, 2048, 256, 256),
      new THREE.MeshPhongMaterial({
        shininess: 0,
        map: earthMap,
        displacementMap: earthMap,
        displacementScale: 50,
        side: THREE.DoubleSide,
      }),
    );

    

    earth.add(planet);
    earth.rotation.x = -Math.PI / 2;
    scene.add(earth);

    const animate = () => {
      if (!getHeightMapPoint())
        setSpherePoint(scene, heightMapContextRef.current);

      requestAnimationFrame(animate);
      controls?.update();
      renderer.render(scene, camera);
    };
    animate();
  };

  const setSpherePoint = (
    group: THREE.Scene,
    context: CanvasRenderingContext2D,
  ) => {
    if (!context) return;
    setHeightMapPoint(true);
    let dotGeometry = new THREE.BoxGeometry(4, 1, 4),
      dotMaterial = new THREE.MeshLambertMaterial({ color: 'crimson' });

    console.log('context', context);
    for (var i = 0; i < 1000; i++) {
      // random Three.js coordinates
      // var tx = -1024,
      //   ty = 0,
      //   tz = -1024;
      let tx = THREE.MathUtils.randFloat(-1024, 1024),
        ty = 0,
        tz = THREE.MathUtils.randFloat(-1024, 1024);

      // convert to pixel coordinates
      var x = Math.round(
          ((tx / 1024) * context.canvas.width) / 2 + context.canvas.width / 2,
        ),
        y = 0,
        z = Math.round(
          ((tz / 1024) * context.canvas.height) / 2 + context.canvas.height / 2,
        );

      // get pixel color
      var pixel = context.getImageData(x, z, 1, 1);
      y = pixel.data[0]; // use the red component
      ty = THREE.MathUtils.mapLinear(y, 0, 255, 0, 50);

      // create a dot
      var dot = new THREE.Mesh(dotGeometry, dotMaterial);
      // ty = Number(parseInt(ty + '')) - 50;
      dot.position.set(tx, ty, tz);

      group.add(dot);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <canvas className="webgl"></canvas>
    </div>
  );
};

export default Earth;
