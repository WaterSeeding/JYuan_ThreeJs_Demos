import * as THREE from 'three';

const updateDataTexture = (texture: THREE.Texture, color: THREE.Color) => {
  const size = texture.image.width * texture.image.height;
  const data = texture.image.data;

  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);

  for (let i = 0; i < size; i++) {
    const stride = i * 4;
    data[stride] = r;
    data[stride + 1] = g;
    data[stride + 2] = b;
    data[stride + 3] = 1;
  }
};

export const setDataTexture = (
  renderer: THREE.WebGLRenderer,
  position: THREE.Vector2,
  color: THREE.Color,
  dataTexture: THREE.Texture,
  diffuseMap: THREE.Texture,
) => {
  let dataTextureW = dataTexture.image.width;
  let dataTextureH = dataTexture.image.height;
  console.log('[dataTextureW, dataTextureH]', dataTextureW, dataTextureH);

  let diffuseMapW = diffuseMap.image.width;
  let diffuseMapH = diffuseMap.image.height;
  console.log('[diffuseMapW, diffuseMapH]', diffuseMapW, diffuseMapH);

  let wRate = diffuseMapW / dataTextureW;
  let hRate = diffuseMapH / dataTextureH;

  console.log('[wRate, hRate]', wRate, hRate);

  // const loader = new THREE.TextureLoader();
  // loader.load(require('./images/sprite.jpg'), (spriteMap: THREE.Texture) => {
  //   spriteMap.colorSpace = THREE.SRGBColorSpace;
  //   spriteMap.minFilter = THREE.LinearFilter;
  //   spriteMap.generateMipmaps = false;
  //   for (let i = 1; i <= wRate; i++) {
  //     position.x = dataTextureW * i - dataTextureW;
  //     for (let j = 1; j <= hRate; j++) {
  //       position.y = dataTextureH * j - dataTextureH;
  //       // color.setHex(0xff0000);
  //       // updateDataTexture(dataTexture, color);
  //       renderer.copyTextureToTexture(position, spriteMap, diffuseMap);
  //     }
  //   }
  // });
  // for (let i = 1; i <= wRate; i++) {
  //   position.x = dataTextureW * i - dataTextureW;
  //   for (let j = 1; j <= hRate; j++) {
  //     position.y = dataTextureH * j - dataTextureH;
  //     color.setHex(0xff0000);
  //     updateDataTexture(dataTexture, color);
  //     renderer.copyTextureToTexture(position, dataTexture, diffuseMap);
  //   }
  // }

  for (let i = 1; i <= wRate; i++) {
    position.x = dataTextureW * i - dataTextureW;
    for (let j = 1; j <= hRate; j++) {
      position.y = dataTextureH * j - dataTextureH;
      const loader = new THREE.TextureLoader();
      loader.load(
        require('./images/sprite.jpg'),
        (spriteMap: THREE.Texture) => {
          spriteMap.colorSpace = THREE.SRGBColorSpace;
          spriteMap.minFilter = THREE.LinearFilter;
          spriteMap.generateMipmaps = false;

          let newPosition = position.clone();
          
        },
      );
      // color.setHex(0xff0000);
      // updateDataTexture(dataTexture, color);
      // renderer.copyTextureToTexture(position, dataTexture, diffuseMap);
    }
  }
};
