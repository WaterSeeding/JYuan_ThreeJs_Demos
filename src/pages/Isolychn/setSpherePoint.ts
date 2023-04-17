import * as THREE from 'three';

const setSpherePoint = (
  group: THREE.Group,
  position: THREE.Vector3,
  color: THREE.ColorRepresentation,
) => {
  const geometry = new THREE.SphereGeometry(0.3, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color: color });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);
  group.add(sphere);
};

export default setSpherePoint;
