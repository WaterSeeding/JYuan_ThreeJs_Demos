import * as THREE from 'three';

const setSpherePoint = (group: THREE.Group, position: THREE.Vector3) => {
  const geometry = new THREE.SphereGeometry(10, 32, 16);
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);
  group.add(sphere);
};

const makeFlyLine = (option: any, group: THREE.Group) => {
  const { source, target, color, speed, size, height, range } = option;
  const positions: any[] = [];
  const attrPositions: any[] = [];
  const attrCindex: any[] = [];
  const attrCnumber: any[] = [];

  const _source = new THREE.Vector3(source.x, source.y, source.z);
  const _target = new THREE.Vector3(target.x, target.y, target.z);
  const _center = _target.clone().lerp(_source, 0.5);
  _center.z += height;

  setSpherePoint(group, _source);
  setSpherePoint(group, _target);
  setSpherePoint(group, _center);

  let number = parseInt(
    _source.distanceTo(_center) + _target.distanceTo(_center) + '',
  );
  if (number < 600) {
    number = 600;
  }

  const curve: THREE.QuadraticBezierCurve3 = new THREE.QuadraticBezierCurve3(
    _source,
    _center,
    _target,
  );

  const points = curve.getPoints(number);

  // setFlyPath(group, points);
  // 粒子位置计算
  points.forEach((elem, i) => {
    const index = i / (number - 1);
    positions.push({
      x: elem.x,
      y: elem.y,
      z: elem.z,
    });
    attrCindex.push(index);
    attrCnumber.push(i);
  });

  positions.forEach((p) => {
    attrPositions.push(p.x, p.y, p.z);
  });

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(attrPositions, 3),
  );
  // 传递当前所在位置
  geometry.setAttribute(
    'index',
    new THREE.Float32BufferAttribute(attrCindex, 1),
  );
  geometry.setAttribute(
    'current',
    new THREE.Float32BufferAttribute(attrCnumber, 1),
  );

  const shader = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uColor: {
        value: new THREE.Color(color), // 颜色
      },
      uSpeed: {
        value: speed || 1.0,
      },
      uRange: {
        value: range || 100, // 显示当前范围的个数
      },
      uSize: {
        value: size, // 粒子大小
      },
      uTotal: {
        value: number, // 当前粒子的所有的总数
      },
      time: {
        value: 0, //
      },
    },
    vertexShader: `
      attribute float index;
      attribute float current;
      uniform float time;
      uniform float uSize;
      uniform float uSpeed; // 展示速度
      uniform float uRange; // 展示区间
      uniform float uTotal; // 粒子总数
      uniform vec3 uColor; 
      varying vec3 vColor;
      varying float vOpacity;
      void main() {
        // 需要当前显示的索引
        float size = uSize;
        float showNumber = uTotal * mod(time * uSpeed, 1.1);
        if (showNumber > current && showNumber < current + uRange) {
          float uIndex = ((current + uRange) - showNumber) / uRange;
          size *= uIndex;
          vOpacity = 1.0;
        } else {
          vOpacity = 0.0;
        }

        // 顶点着色器计算后的Position
        vColor = uColor;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition; 
        // 大小
        gl_PointSize = size * 20.0 / (-mvPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor; 
      varying float vOpacity;
      void main() {
        gl_FragColor = vec4(vColor, vOpacity);
      }
    `,
  });

  const point = new THREE.Points(geometry, shader);
  return point;
};

const setFlyPath = (group: THREE.Group, points: any[]) => {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const colors = new Float32Array(31 * 3);

  for (let i = 0; i < colors.length; i += 3) {
    colors[i] = 1.0;
    colors[i + 1] = 0.0;
    colors[i + 2] = 0.0;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.LineBasicMaterial({
    color: 0x00ffff,
    linewidth: 4,
    linecap: 'round',
    linejoin: 'round',
    transparent: true,
    side: THREE.DoubleSide,
    alphaToCoverage: true,
  });
  const line = new THREE.Line(geometry, material);
  group.add(line);
};

export const setFlyLine = (
  group: THREE.Group,
  lineData: any[],
  uniforms: any,
) => {
  lineData.forEach((data) => {
    // let height = (Math.abs(data.source.x) + Math.abs(data.target.x)) / 200;
    let newData = Object.assign(data, {});
    const mesh = makeFlyLine(newData, group);
    mesh.material.uniforms.time = uniforms['time'];
    mesh.renderOrder = 10;
    group.add(mesh);
  });
};
