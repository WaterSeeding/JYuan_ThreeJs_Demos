import styles from './index.less';
import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

/**
 * 在我看来，这个官方的例子过于复杂了。但selective bloom的概念本身很简单:
 * 1. 使所有non-bloomed的Object3D materials/colors变得全黑
 * 2. 使用bloomComposer（效果合成器）渲染场景
 * 3. 恢复materials/colors原状
 * 4. 用finalComposer（效果合成器）渲染场景
 * 
 * 剩下的就是:
 * 如何管理变暗/变黑 non-bloomed Object3D的materials/colors和恢复Object3D的materials/colors原状，这取决于自己的代码了。
 */

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
      60,
      innerWidth / innerHeight,
      1,
      100,
    );
    camera.position.set(0, 3, 5);
    const renderer = new THREE.WebGLRenderer({
      canvas: document.querySelector('canvas.webgl')!,
      antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0.0);
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);

    let controls = new OrbitControls(camera, renderer.domElement);

    let light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.setScalar(10);
    scene.add(light, new THREE.AmbientLight(0xffffff, 1.0));

    let uniforms = {
      globalBloom: { value: 1 },
    };

    let box = addBox(scene, uniforms);
    console.log("box", box);
    addTarget(scene, uniforms);

    let { bloomComposer,
      finalComposer } = addComposer(scene, camera, renderer);

    renderer.setAnimationLoop((_) => {
      renderer.setClearColor(0x000000);
      uniforms.globalBloom.value = 1;

      if (box) {
        box.material.color.set(0x000000);
      }
      bloomComposer.render();

      renderer.setClearColor(0x000000);
      uniforms.globalBloom.value = 0;

      if (box) {
        box.material.color.set(0x00ff00);
      }
      finalComposer.render();
    });

    window.onresize = function () {
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);

      bloomComposer.setSize(width, height);
      finalComposer.setSize(width, height);
    };
  };

  const addTarget = (scene: THREE.Scene, uniforms: any) => {
    // texture
    new THREE.TextureLoader().load(
      require('./img/hardwood2_diffuse.jpg'),
      (tex) => {
        let img = tex.image;

        let c = document.createElement('canvas');
        let min = Math.min(img.width, img.height);
        c.width = c.height = min;
        let ctx = c.getContext('2d');
        ctx!.drawImage(img, 0, 0);

        ['#f00', '#0f0', '#ff0', '#f0f', '#0ff'].forEach((col, i, a) => {
          let id = i - (a.length - 1) / 2;
          let dist = id * 150;
          ctx!.beginPath();
          ctx!.arc(min * 0.5 + dist, min * 0.5, 25, 0, 2 * Math.PI);
          ctx!.fillStyle = col;
          ctx!.fill();
        });

        let cTex = new THREE.CanvasTexture(c);

        let c2 = document.createElement('canvas');
        c2.width = c2.height = min;
        let ctx2 = c2.getContext('2d');
        ctx2!.clearRect(0, 0, min, min);

        let c2Tex = new THREE.CanvasTexture(c2);

        ctx2!.clearRect(0, 0, min, min);
        let id = -2;
        let dist = id * 150;
        ctx2!.beginPath();
        ctx2!.arc(min * 0.5 + dist, min * 0.5, 25, 0, 2 * Math.PI);
        ctx2!.fillStyle = '#fff';
        ctx2!.fill();
        c2Tex.needsUpdate = true;

        let g = new THREE.PlaneGeometry(5, 5);
        g.rotateX(Math.PI * -0.5);
        let m = new THREE.MeshStandardMaterial({
          roughness: 0.6,
          metalness: 0.5,
          map: cTex,
          emissiveMap: c2Tex,
          // @ts-ignore;
          onBeforeCompile: (shader) => {
            shader.vertexShader = shader.vertexShader.replace(
              'varying vec3 vViewPosition;',
              `
              varying vec3 vViewPosition;
              // Varyings类型变量作为顶点着色器中确定的值
              varying vec2 vUV;
              `,
            );
            shader.vertexShader = shader.vertexShader.replace(
              '#include <fog_vertex>',
              `
              #include <fog_vertex>
              vUV = uv;
              `,
            );
            shader.uniforms.globalBloom = uniforms.globalBloom;
            // varying vec3 vViewPosition;
            shader.fragmentShader = `
            uniform float globalBloom;
            varying vec2 vUV;
              ${shader.fragmentShader}
            `.replace(
              `#include <dithering_fragment>`,
              `#include <dithering_fragment>
                vec3 col = texture2D( map, vUV).rgb;
                float em = texture2D( emissiveMap, vUV ).g;
                col *= em;
                gl_FragColor.rgb = mix(gl_FragColor.rgb, col, globalBloom);

            `,
            );
          },
        });
        let o = new THREE.Mesh(g, m);
        scene.add(o);
      },
    );
  }

  const addBox = (scene: THREE.Scene, uniforms: any) => {
    // texture
    let map = new THREE.TextureLoader().load(
      require('./img/map.png')
    );
    let emissiveMap = new THREE.TextureLoader().load(
      require('./img/emissiveMap.png')
    );

    let g = new THREE.BoxGeometry(1, 1, 1);
    g.rotateX(Math.PI * -0.5);
    let m = new THREE.MeshStandardMaterial({
      roughness: 0.6,
      metalness: 0.5,
      map: map,
      emissiveMap: emissiveMap,
      // @ts-ignore;
      onBeforeCompile: (shader) => {
        shader.vertexShader = shader.vertexShader.replace(
          'varying vec3 vViewPosition;',
          `
          varying vec3 vViewPosition;
          // Varyings类型变量作为顶点着色器中确定的值
          varying vec2 vUV;
          `,
        );
        shader.vertexShader = shader.vertexShader.replace(
          '#include <fog_vertex>',
          `
          #include <fog_vertex>
          vUV = uv;
          `,
        );
        shader.uniforms.globalBloom = uniforms.globalBloom;
        // varying vec3 vViewPosition;
        shader.fragmentShader = `
        uniform float globalBloom;
        varying vec2 vUV;
          ${shader.fragmentShader}
        `.replace(
          `#include <dithering_fragment>`,
          `#include <dithering_fragment>
            vec3 col = texture2D( map, vUV).rgb;
            float em = texture2D( emissiveMap, vUV ).g;
            col *= em;
            gl_FragColor.rgb = mix(gl_FragColor.rgb, col, globalBloom);

        `,
        );
      },
    });
    let o = new THREE.Mesh(g, m);
    o.position.setX(1)
    o.position.setY(1)
    scene.add(o);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    cube.position.setX(-1)
    cube.position.setY(1)
    scene.add(cube);

    return cube
  }

  const addComposer = (scene: THREE.Scene, camera: THREE.Camera, renderer: THREE.WebGLRenderer) => {
    const renderScene = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      3.0,
      0.1,
      0.1,
    );
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
    return {
      bloomComposer,
      finalComposer
    }
  }

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
