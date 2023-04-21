import styles from './index.less';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
// import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initScene } from './main';

const Earth = () => {
  let earthRef = useRef<THREE.Group | any>(null);
  let cameraRef = useRef<THREE.PerspectiveCamera | any>(null);
  let controlsRef = useRef<OrbitControls | any>(null);

  const [isInitScene, setIsInitScene] = useState<boolean>(false);

  let uniforms = {
    time: { value: 0 },
    lines: {
      draw: { value: 0 },
      totalLength: { value: 0 },
    },
    shapes: {
      fire: { value: 0 },
    },
  };

  let clock = new THREE.Clock();

  useEffect(() => {
    if (!isInitScene) {
      setIsInitScene(true);
      initScene(
        ({
          earth,
          camera,
          controls,
          light,
          lightHelper,
        }: {
          earth: THREE.Group;
          camera: THREE.PerspectiveCamera;
          controls: OrbitControls;
          light: THREE.DirectionalLight;
          lightHelper: THREE.DirectionalLightHelper;
        }) => {
          earthRef.current = earth;
          cameraRef.current = camera;
          controlsRef.current = controls;

          addObj(earth);
          addSvg(earth);
        },
        () => {
          let t = clock.getElapsedTime();
          uniforms.time.value = t;
        },
      );
    }
  }, []);

  const addObj = (earth: THREE.Group) => {
    let objGroup = new THREE.Group();
    objGroup.scale.set(10, 10, 10);
    earth.add(objGroup);
    let obj = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 4),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: false }),
    );
    obj.position.z = 0.25;
    obj.layers.enable(1);
    objGroup.add(obj);

    let objBack = new THREE.Mesh(
      new THREE.BoxGeometry(5, 5, 1),
      new THREE.MeshBasicMaterial({ color: 'blue', wireframe: false }),
    );
    objBack.position.z = -2.25;
    objGroup.add(objBack);
  };

  const addSvg = (earth: THREE.Group) => {
    let lines, shapes;
    let loader = new SVGLoader();
    // https://www.scottiesdesigns.com/downloads/chinese-dragon-svg-cricut-silhouette/
    loader.load('./svg/dragon.svg', (svg) => {
      //console.log(svg);
      let paths = svg.paths;
      let mainPoints = [];
      let mainShapes = [];
      let inversion = new THREE.Vector3(1, -1, 1);

      paths.forEach((p, pIdx) => {
        let shapes = SVGLoader.createShapes(p);
        shapes.forEach((s, sIdx) => {
          let pts = s.getPoints();
          setSegments(pts); // contour
          s.holes.forEach((h) => {
            setSegments(h.getPoints()); // holes
          });
          mainShapes.push(new THREE.ShapeGeometry(s));

          function setSegments(points) {
            for (let i = 0; i < points.length - 1; i++) {
              mainPoints.push(
                points[i].clone().multiply(inversion),
                points[i + 1].clone().multiply(inversion),
              );
            }
          }
        }); // end of shapes
      }); // end of paths

      // lines
      let g = new THREE.BufferGeometry().setFromPoints(mainPoints);
      g.center();
      let m = new THREE.LineDashedMaterial({
        color: 'yellow',
        // @ts-ignore;
        onBeforeCompile: (shader) => {
          shader.uniforms.draw = uniforms.lines.draw;
          shader.uniforms.totalLength = uniforms.lines.totalLength;
          shader.fragmentShader = `
            uniform float draw;
            uniform float totalLength;
            ${shader.fragmentShader}
          `.replace(
            `mod( vLineDistance, totalSize ) > dashSize`,
            `vLineDistance > (totalLength * draw)`,
          );
          //console.log(shader.fragmentShader);
        },
      });
      lines = new THREE.LineSegments(g, m);
      lines.computeLineDistances();
      uniforms.lines.totalLength.value =
        g.attributes.lineDistance.array[
          g.attributes.lineDistance.array.length - 1
        ];
      lines.position.setY(5);
      earth.add(lines);

      // shapes
      let sg = BufferGeometryUtils.mergeBufferGeometries(mainShapes);
      sg.center();
      sg.rotateX(Math.PI);
      let bbox = new THREE.Box3().setFromBufferAttribute(
        sg.attributes.position,
      );
      let bsize = new THREE.Vector3();
      bbox.getSize(bsize);
      console.log(bsize);
      sg.translate(0, 0, -1);
      let sm = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        side: THREE.BackSide,
        // @ts-ignore;
        onBeforeCompile: (shader) => {
          shader.uniforms.fire = uniforms.shapes.fire;
          shader.uniforms.time = uniforms.time;
          shader.vertexShader = `
            varying vec3 vPos;
            ${shader.vertexShader}
          `.replace(
            `#include <begin_vertex>`,
            `#include <begin_vertex>
              vPos = transformed;
            `,
          );
          //console.log(shader.vertexShader);
          shader.fragmentShader = `
            uniform float time;
            uniform float fire;
            varying vec3 vPos;
    
            // https://github.com/yiwenl/glsl-fbm/blob/master/3d.glsl
            #define NUM_OCTAVES 5
    
            float mod289(float x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
            vec4 perm(vec4 x){return mod289(((x * 34.0) + 1.0) * x);}
          
            float noise(vec3 p){
                vec3 a = floor(p);
                vec3 d = p - a;
                d = d * d * (3.0 - 2.0 * d);
          
                vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
                vec4 k1 = perm(b.xyxy);
                vec4 k2 = perm(k1.xyxy + b.zzww);
          
                vec4 c = k2 + a.zzzz;
                vec4 k3 = perm(c);
                vec4 k4 = perm(c + 1.0);
          
                vec4 o1 = fract(k3 * (1.0 / 41.0));
                vec4 o2 = fract(k4 * (1.0 / 41.0));
          
                vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
                vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
          
                return o4.y * d.y + o4.x * (1.0 - d.y);
            }
          
          
            float fbm(vec3 x) {
              float v = 0.0;
              float a = 0.5;
              vec3 shift = vec3(100);
              for (int i = 0; i < NUM_OCTAVES; ++i) {
                v += a * noise(x);
                x = x * 2.0 + shift;
                a *= 0.5;
              }
              return v;
            }
            ${shader.fragmentShader}
          `.replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
    
              float hysteresis = 100.;
              float fireRadius = ${
                Math.hypot(bsize.x, bsize.y) * 0.5
              } + hysteresis;
              
              float firePhase = fireRadius * fire;
    
              float fireWave = smoothstep(firePhase, firePhase - hysteresis, length(vPos.xy));
    
              float flame = clamp(fbm(vPos  * 0.025 - vec3(0, time, time * 0.5)), 0., 1.);
              vec3 col = mix(vec3(1, 0, 0), vec3(1, 1, 0), flame);
    
              diffuseColor.rgb = mix(diffuseColor.rgb, col, fireWave);
    
            `,
          );
          //console.log(shader.fragmentShader);
        },
      });
      shapes = new THREE.Mesh(sg, sm);
      shapes.position.setY(5);
      earth.add(shapes);

      startSequence();
    });
  };

  const startSequence = () => {
    TWEEN.removeAll();

    let twDraw = new TWEEN.Tween(uniforms.lines.draw)
      .to({ value: 1 }, 30000)
      .delay(1000);
    let twFire = new TWEEN.Tween(uniforms.shapes.fire)
      .to({ value: 1 }, 2500)
      .delay(1000);
    twDraw.chain(twFire);
    twDraw.start();
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
