import * as THREE from 'three';
import { useEffect } from 'react';
import { useGetState } from 'ahooks';
import { setSpriteTexture } from './dataTexture';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const Earth = () => {
  const [heightMapPoint, setHeightMapPoint, getHeightMapPoint] =
    useGetState<boolean>(false);

  useEffect(() => {
    initThree();
  }, []);

  const initThree = () => {
    THREE.ColorManagement.enabled = true;

    let camera: any,
      scene: any,
      renderer: any,
      dataTexture: any,
      diffuseMap: any,
      stats: any;

    const position = new THREE.Vector2();
    const color = new THREE.Color();

    init();

    function init() {
      renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('canvas.webgl')!,
        antialias: true,
      });
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.CineonToneMapping;

      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
        70,
        window.innerWidth / window.innerHeight,
        0.01,
        10,
      );
      camera.position.z = 2 * 4;

      const loader = new THREE.TextureLoader();
      diffuseMap = loader.load('./img/earth/chinahaiyu_weitu_test.jpg', () => {
        const width = 32 * 4 * 2;
        const height = 32 * 4 * 2;

        const data = new Uint8Array(width * height * 4);
        dataTexture = new THREE.DataTexture(data, width, height);
      });
      diffuseMap.colorSpace = THREE.SRGBColorSpace;
      diffuseMap.minFilter = THREE.LinearFilter;
      diffuseMap.generateMipmaps = false;

      const geometry = new THREE.PlaneGeometry(16, 10);
      const material = new THREE.MeshBasicMaterial({ map: diffuseMap });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      stats = new Stats();
      document.body.appendChild(stats.dom);

      animate();
    }

    function animate() {
      requestAnimationFrame(animate);
      stats.update();
      if (!getHeightMapPoint()) {
        loadDataTexture(renderer, position, color, dataTexture, diffuseMap);
      }

      renderer.render(scene, camera);
    }

    function loadDataTexture(
      renderer: THREE.WebGLRenderer,
      position: THREE.Vector2,
      color: THREE.Color,
      dataTexture: THREE.Texture,
      diffuseMap: THREE.Texture,
    ) {
      if (!dataTexture) return;
      setHeightMapPoint(true);

      console.log('dataTexture', dataTexture.image);
      console.log(
        'diffuseMap',
        diffuseMap.image.width,
        diffuseMap.image.height,
      );
      setSpriteTexture(renderer, position, color, dataTexture, diffuseMap);
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
