import * as THREE from 'three';

export const setSpriteTexture = (
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

  console.log(wRate, hRate, wRate * hRate);
  let index = 0;
  for (let j = 1; j <= hRate; j++) {
    let y = diffuseMapH - dataTextureH * j;
    for (let i = 1; i <= wRate; i++) {
      ++index;
      let x = dataTextureW * i - dataTextureW;
      let url = index > 9 ? `${index}` : `0${index}`;
      url = `./img/earth/chinahaiyu_weitu/chinahaiyu_weitu_${url}.jpg`;
      const loader = new THREE.TextureLoader();
      loader.load(url, (spriteMap: THREE.Texture) => {
        spriteMap.colorSpace = THREE.SRGBColorSpace;
        spriteMap.minFilter = THREE.LinearFilter;
        spriteMap.generateMipmaps = false;

        let newPosition = position.clone();
        newPosition.x = x;
        newPosition.y = y;
        renderer.copyTextureToTexture(newPosition, spriteMap, diffuseMap);
      });
    }
  }
};
