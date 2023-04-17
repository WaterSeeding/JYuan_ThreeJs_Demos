import * as THREE from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
import setSpherePoint from '../setSpherePoint';

class Tetrahedra extends LineSegments2 {
  scene: THREE.Scene;
  group: THREE.Group;
  edgesFlat: number[];
  items: THREE.Object3D[];
  uMediator:
    | {
        value: THREE.DataTexture;
      }
    | undefined;
  _c: THREE.Color | undefined;
  constructor(
    scene: THREE.Scene,
    amount: number,
    gu: {
      globalBloom: any;
    },
  ) {
    super();
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);
    let pts = [
      new THREE.Vector3(Math.sqrt(8 / 9), 0, -(1 / 3)),
      new THREE.Vector3(-Math.sqrt(2 / 9), Math.sqrt(2 / 3), -(1 / 3)),
      new THREE.Vector3(-Math.sqrt(2 / 9), -Math.sqrt(2 / 3), -(1 / 3)),
      new THREE.Vector3(0, 0, 1),
    ];
    let edges = [
      pts[0],
      pts[1],
      pts[1],
      pts[2],
      pts[2],
      pts[0],
      pts[0],
      pts[3],
      pts[1],
      pts[3],
      pts[2],
      pts[3],
    ];
    this.edgesFlat = [];
    edges.forEach((ed) => {
      setSpherePoint(this.group, ed, 0xff0000);
      this.edgesFlat.push(ed.x, ed.y, ed.z);
    });

    console.log('edges', edges.length);
    console.log('this.edgesFlat', this.edgesFlat.length, amount);
    /**
     * 在 three.js 中，Float32Array 主要用于存储三维模型的属性数据，例如顶点、法线、纹理坐标等。
     * 这些数据通常是通过几何渲染引擎 (如 WebGLRenderer) 传递给渲染器的。
      
     * Float32Array 的优点是能够存储高精度的浮点数数据，因此在处理三维模型时能够提供更好的精度和稳定性。
     * 此外，Float32Array 还能够高效地遍历和修改数据，因此适用于大量数据的处理。
     */
    let edgesTotal = new Float32Array(this.edgesFlat.length * amount);
    let colorTotal = new Float32Array(this.edgesFlat.length * amount).fill(1);
    /**
     * 在 three.js 中，Int16Array 主要用于存储纹理坐标、法线、顶点等信息。
     * 与 Float32Array 不同，Int16Array 只能存储 16 位整数数据，而不是 32 位浮点数数据。
     * 因此，Int16Array 适用于需要存储少量高精度数据的场景，例如纹理坐标、法线等。
     * 与 Float32Array 类似，Int16Array 也是通过 WebGL 渲染引擎传递给渲染器的。
     * 在 three.js 中，我们可以通过创建 Int16Array 对象来存储需要渲染的数据，然后将其传递给 WebGL 渲染器进行绘制。
     */
    let indexTotal = new Int16Array((edges.length / 2) * amount);
    /**
     * 在 three.js 中，Int8Array 主要用于存储纹理贴图的数据，例如 rgba 值、bgra 值等。
     * 与 Int16Array 不同，Int8Array 只能存储 8 位整数数据，而不是 16 位整数数据。
     * 因此，Int8Array 适用于需要存储少量低精度数据的场景，例如纹理贴图等。
     * 与 Float32Array 和 Int16Array 不同，Int8Array 不是通过 WebGL 渲染引擎传递给渲染器的。
     * 在 three.js 中，我们可以通过创建 Int8Array 对象来存储需要渲染的数据，然后将其传递给 WebGL 渲染器进行绘制。
     * 由于 Int8Array 只存储 8 位整数数据，因此其数据精度和稳定性不如 Float32Array 和 Int16Array。
     */
    let glowTotal = new Int8Array((edges.length / 2) * amount);
    this.items = [];
    for (let i = 0; i < amount; i++) {
      edgesTotal.set(this.edgesFlat, this.edgesFlat.length * i);
      indexTotal.set([i, i, i, i, i, i], i * 6);
      let glow = i % 2 !== 0 ? [0, 0, 0, 0, 0, 0] : [1, 1, 1, 1, 1, 1];
      glowTotal.set(glow, i * 6);
      let child = new THREE.Object3D();
      this.items.push(child);
    }

    this.init(gu, amount, edgesTotal, colorTotal, indexTotal, glowTotal);
  }

  init(
    gu: any,
    amount: number,
    edgesTotal: Float32Array, // 角度位置
    colorTotal: Float32Array, // 颜色数值
    indexTotal: Int16Array, // 法线数值
    glowTotal: Int8Array, // 发光数值
  ) {
    let g = new LineSegmentsGeometry();
    g.setPositions(edgesTotal);
    g.setColors(colorTotal);
    g.setAttribute(
      'instIndex',
      new THREE.InstancedBufferAttribute(new Int16Array(indexTotal), 1),
    );
    g.setAttribute(
      'instGlow',
      new THREE.InstancedBufferAttribute(new Int8Array(glowTotal), 1),
    );

    let mediatorWidth = 4;
    let mediatorHeight = amount;
    let mediator = new THREE.DataTexture(
      new Float32Array(mediatorWidth * mediatorHeight * 4),
      mediatorWidth,
      mediatorHeight,
      THREE.RGBAFormat,
      THREE.FloatType,
    );
    console.log('mediatorWidth', mediatorWidth);
    console.log('mediatorHeight', mediatorHeight);

    this.uMediator = { value: mediator };

    let m = new LineMaterial({
      worldUnits: true,
      vertexColors: true,
      // @ts-ignore;
      onBeforeCompile: (shader) => {
        shader.uniforms.uMediator = this.uMediator;
        shader.uniforms.globalBloom = gu.globalBloom;
        shader.vertexShader = `
          uniform sampler2D uMediator;
          attribute float instIndex;
          attribute float instGlow;
          varying float vInstGlow;
          ${shader.vertexShader}
        `
          .replace(
            `// camera space`,
            `// camera space
              vInstGlow = instGlow;
              vec4 row0 = texelFetch(uMediator, ivec2(0, int(instIndex)), 0);
              vec4 row1 = texelFetch(uMediator, ivec2(1, int(instIndex)), 0);
              vec4 row2 = texelFetch(uMediator, ivec2(2, int(instIndex)), 0);
              vec4 row3 = texelFetch(uMediator, ivec2(3, int(instIndex)), 0);
              mat4 instMatrix = mat4(row0, row1, row2, row3);
          `,
          )
          .replaceAll(
            `= modelViewMatrix * vec4( instance`,
            `= modelViewMatrix * instMatrix * vec4( instance`,
          );
        shader.fragmentShader = `
            uniform float globalBloom;
            varying float vInstGlow;
            ${shader.fragmentShader}
        `.replace(
          `#include <premultiplied_alpha_fragment>`,
          `#include <premultiplied_alpha_fragment>
            float instGlow = vInstGlow;
            vec3 colGlow = mix(vec3(0), diffuseColor.rgb, instGlow);
            vec3 colNonGlow = mix(diffuseColor.rgb, vec3(1), instGlow);
            vec3 col = mix(colNonGlow, colGlow, globalBloom);
            gl_FragColor.rgb = col;
            
          `,
        );
      },
    });

    this.geometry = g;
    this.material = m;
    this._c = new THREE.Color();
  }

  setColorAt(idx: number, color: THREE.ColorRepresentation) {
    this._c!.set(color);
    let cStart = this.geometry.attributes[
      'instanceColorStart'
    ] as THREE.InterleavedBufferAttribute;
    let cEnd = this.geometry.attributes[
      'instanceColorEnd'
    ] as THREE.InterleavedBufferAttribute;
    for (let i = 0; i < 6; i++) {
      cStart.setXYZ(idx * 6 + i, this._c!.r, this._c!.g, this._c!.b);
      cEnd.setXYZ(idx * 6 + i, this._c!.r, this._c!.g, this._c!.b);
    }
    cStart.needsUpdate = true;
    cEnd.needsUpdate = true;
  }

  update() {
    this.items.forEach((o, idx) => {
      o.updateMatrix();
      this.uMediator!.value.image.data.set(o.matrix.elements, idx * 16);
    });
    this.uMediator!.value.needsUpdate = true;
  }
}
export { Tetrahedra };
