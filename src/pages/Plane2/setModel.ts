import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const setModel = (group: THREE.Group, url: string) => {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      url,
      (gltf) => {
        const model = gltf.scene;
        group.add(model);
        resolve({ model });
      },
      undefined,
      (e) => {
        console.error(e);
      },
    );
  });
};

export { setModel };
