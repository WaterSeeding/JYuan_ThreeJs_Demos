import * as THREE from 'three';
import { useEffect } from 'react';
import { useGetState } from 'ahooks';
import { setDataTexture } from './dataTexture';

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
      diffuseMap: any;

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
      camera.position.z = 2;

      const loader = new THREE.TextureLoader();
      diffuseMap = loader.load('./img/earth/earth_basic.jpeg', () => {
        const width = 32 * 4;
        const height = 32 * 4;

        const data = new Uint8Array(width * height * 4);
        dataTexture = new THREE.DataTexture(data, width, height);
      });
      diffuseMap.colorSpace = THREE.SRGBColorSpace;
      diffuseMap.minFilter = THREE.LinearFilter;
      diffuseMap.generateMipmaps = false;

      const geometry = new THREE.PlaneGeometry(4, 2);
      const material = new THREE.MeshBasicMaterial({ map: diffuseMap });

      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);

      animate();
    }

    function animate() {
      requestAnimationFrame(animate);
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
      setDataTexture(renderer, position, color, dataTexture, diffuseMap);
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
