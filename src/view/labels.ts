import * as THREE from 'three';

export function labelSprite(text: string, color: string): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 384;
  canvas.height = 80;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Cannot create doorway labels');
  context.fillStyle = '#211b2b';
  context.beginPath();
  context.roundRect(0, 0, 384, 80, 18);
  context.fill();
  context.font = '600 38px Cinzel, Georgia, serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = color;
  context.fillText(text, 192, 43);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthTest: false }));
  sprite.scale.set(3.5, 0.73, 1);
  return sprite;
}
