import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

export const setSvg = (url: string) => {
  return new Promise((resolve, reject) => {
    const loader = new SVGLoader();
    loader.load(url, (data) => {
      console.log('data', data);
      const paths = data.paths;
      const group = new THREE.Group();

      let multiple = 0.001 * 5;
      group.scale.set(multiple, multiple, multiple);

      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        const fillColor = path.userData!.style.fill;
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color().setStyle(fillColor).convertSRGBToLinear(),
          opacity: path.userData!.style.fillOpacity,
          transparent: true,
          side: THREE.BackSide,
          depthWrite: false,
          wireframe: false,
        });

        const shapes = SVGLoader.createShapes(path);
        const geometry = new THREE.ShapeGeometry(shapes);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotateY(-Math.PI);
        mesh.rotateZ(-Math.PI);
        group.add(mesh);
      }

      let box = new THREE.Box3().setFromObject(group);
      let boxLen = box.max.x - box.min.x;
      let boxWid = box.max.z - box.min.z;
      let boxHei = box.max.y - box.min.y;
      let x = box.min.x + boxLen / 2;
      let y = box.min.y + boxHei / 2;
      let z = box.min.z + boxWid / 2;

      resolve({ group, x, y, z });
    });
  });
};
