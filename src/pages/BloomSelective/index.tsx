import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Postprocessing {
  renderScene: RenderPass;
  bloomPass: UnrealBloomPass;
  bloomComposer: EffectComposer;
  finalPass: ShaderPass;
  finalComposer: EffectComposer;
  constructor(scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,) {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      4,
      1,
      0
    );
    const target1 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding,
      samples: 8
    })
    this.bloomComposer = new EffectComposer(renderer, target1);
    this.bloomComposer.renderToScreen = false;
    this.bloomComposer.addPass(renderScene);
    this.bloomComposer.addPass(bloomPass);
    const finalPass = new ShaderPass(
      new THREE.ShaderMaterial({
        uniforms: {
          baseTexture: { value: null },
          bloomTexture: { value: this.bloomComposer.renderTarget2.texture }
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
          }`,
        defines: {}
      }),
      "baseTexture"
    );
    finalPass.needsSwap = true;
    const target2 = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      encoding: THREE.sRGBEncoding,
      samples: 8
    })
    this.finalComposer = new EffectComposer(renderer, target2);
    this.finalComposer.addPass(renderScene);
    this.finalComposer.addPass(finalPass);
  }
}

const Earth = () => {
  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene();
    }
  }, []);

  const initScene = () => {
    const canvas = document.querySelector('canvas.webgl') as HTMLCanvasElement;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      innerWidth / innerHeight,
      1,
      100,
    );
    camera.position.set(0, 0, 30);
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    let controls = new OrbitControls(camera, renderer.domElement);
    controls.update();

    let postprocessing = new Postprocessing(scene, camera, renderer);
    window.addEventListener("resize", (event) => {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
      postprocessing.bloomComposer.setSize(innerWidth, innerHeight);
      postprocessing.finalComposer.setSize(innerWidth, innerHeight);
    });

    let gu = {
      time: { value: 0 },
      globalBloom: { value: 0 }
    }

    let light = new THREE.DirectionalLight(0xffffff, 0.5);
    light.position.set(0.25, 0.5, 1);
    scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

    let glow = new THREE.Mesh(
      new THREE.SphereGeometry(2),
      new THREE.MeshBasicMaterial({
        color: 0xff00ff
      }));
    glow.position.setX(-6);
    let nonGlow = new THREE.Mesh(
      new THREE.BoxGeometry(4, 4, 4),
      new THREE.MeshStandardMaterial({
        color: "teal",
        // @ts-ignore;
        onBeforeCompile: shader => {
          shader.uniforms.globalBloom = gu.globalBloom;
          shader.fragmentShader = `
            uniform float globalBloom;
            ${shader.fragmentShader}
          `.replace(
            `#include <dithering_fragment>`,
            `#include <dithering_fragment>
             gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0), globalBloom);
            `
          );
          console.log(shader.fragmentShader);
        }
      })
    )
    nonGlow.position.setX(6);
    scene.add(glow, nonGlow);

    renderer.setAnimationLoop(() => {
      controls.update();
      gu.globalBloom.value = 1;
      postprocessing.bloomComposer.render();
      gu.globalBloom.value = 0;
      postprocessing.finalComposer.render();
    });
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
