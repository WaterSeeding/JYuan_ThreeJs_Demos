import { DataTexture } from 'three';
import { Object3D } from 'three';
import { RGBAFormat } from 'three';
import { LinearFilter } from 'three';
import { FloatType } from 'three';
import { Color, InstancedBufferAttribute, Vector3 } from 'three';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';
class Tetrahedra extends LineSegments2 {
  constructor(amount, gu) {
    super();
    let pts = [
      new Vector3(Math.sqrt(8 / 9), 0, -(1 / 3)),
      new Vector3(-Math.sqrt(2 / 9), Math.sqrt(2 / 3), -(1 / 3)),
      new Vector3(-Math.sqrt(2 / 9), -Math.sqrt(2 / 3), -(1 / 3)),
      new Vector3(0, 0, 1),
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
    let edgesFlat = [];
    edges.forEach((ed) => {
      edgesFlat.push(ed.x, ed.y, ed.z);
    });
    //console.log(edgesFlat);
    let edgesTotal = new Float32Array(edgesFlat.length * amount);
    let colorTotal = new Float32Array(edgesFlat.length * amount).fill(1);
    let indexTotal = new Int16Array((edges.length / 2) * amount);
    let glowTotal = new Int8Array((edges.length / 2) * amount);
    this.items = [];
    for (let i = 0; i < amount; i++) {
      edgesTotal.set(edgesFlat, edgesFlat.length * i);
      indexTotal.set([i, i, i, i, i, i], i * 6);
      let glow =
        i === 0
          ? [1, 1, 1, 1, 1, 1]
          : Math.random() < 0.75
          ? [0, 0, 0, 0, 0, 0]
          : [1, 1, 1, 1, 1, 1];
      glowTotal.set(glow, i * 6);
      let child = new Object3D();
      this.items.push(child);
    }
    let g = new LineSegmentsGeometry();
    g.setPositions(edgesTotal);
    g.setColors(colorTotal);
    g.setAttribute(
      'instIndex',
      new InstancedBufferAttribute(new Int16Array(indexTotal), 1),
    );
    g.setAttribute(
      'instGlow',
      new InstancedBufferAttribute(new Int8Array(glowTotal), 1),
    );

    let mediatorWidth = 4;
    let mediatorHeight = amount;
    let mediator = new DataTexture(
      new Float32Array(mediatorWidth * mediatorHeight * 4),
      mediatorWidth,
      mediatorHeight,
      RGBAFormat,
      FloatType,
    );
    mediator.magFilter = LinearFilter;
    this.uMediator = { value: mediator };

    let m = new LineMaterial({
      worldUnits: true,
      linewidth: 0.1,
      vertexColors: true,
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
        //console.log(shader.vertexShader);
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
        //console.log(shader.fragmentShader);
      },
    });
    this.geometry = g;
    this.material = m;

    this.update = () => {
      this.items.forEach((o, idx) => {
        o.updateMatrix();
        this.uMediator.value.image.data.set(o.matrix.elements, idx * 16);
      });
      this.uMediator.value.needsUpdate = true;
    };

    let _c = new Color();
    this.setColorAt = (idx, color) => {
      _c.set(color);
      let cStart = this.geometry.attributes['instanceColorStart'];
      let cEnd = this.geometry.attributes['instanceColorEnd'];
      for (let i = 0; i < 6; i++) {
        cStart.setXYZ(idx * 6 + i, _c.r, _c.g, _c.b);
        cEnd.setXYZ(idx * 6 + i, _c.r, _c.g, _c.b);
      }
      cStart.needsUpdate = true;
      cEnd.needsUpdate = true;
    };
  }
}
export { Tetrahedra };
