import * as THREE from 'three';
import { noise } from './noise';

export const setRtScene = (globalUniforms: any) => {
  let rtScene = new THREE.Scene();
  let rtCamera = new THREE.Camera();
  let rtGeo = new THREE.PlaneGeometry(2, 2);
  let rtMat = new THREE.MeshBasicMaterial({
    // @ts-ignore;
    onBeforeCompile: (shader) => {
      shader.uniforms.time = globalUniforms.time;
      shader.fragmentShader = `
          uniform float time;
          ${noise}
          ${shader.fragmentShader}
        `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
          vec3 col = vec3(0);
          float h = clamp(smoothNoise2(vUv * 50.), 0., 1.);
          col = vec3(h);
          vec4 diffuseColor = vec4( col, opacity );
        `,
      );
    },
  });
  // .defines: Object - 注入shader的自定义对象。
  rtMat.defines = { USE_UV: '' };
  let rtPlane = new THREE.Mesh(rtGeo, rtMat);
  rtScene.add(rtPlane);

  return {
    rtScene,
    rtCamera,
  };
};
