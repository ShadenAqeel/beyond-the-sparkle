import * as T from 'three';

// Seeded surface generation keeps the build offline and the stonework reproducible.
export function createMaterials(renderer) {
  let seed = 413;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  function surface(kind) {
    const size = 1024, canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d'), height = document.createElement('canvas'); height.width = height.height = size;
    const hc = height.getContext('2d');
    ctx.fillStyle = '#333b3b'; ctx.fillRect(0, 0, size, size); hc.fillStyle = '#202020'; hc.fillRect(0, 0, size, size);
    const rows = kind === 'floor' ? 4 : 8, cols = kind === 'floor' ? 4 : 3;
    for (let row = -1; row <= rows; row++) for (let col = -1; col <= cols; col++) {
      const w = size / cols, h = size / rows, x = col * w + (row % 2 ? w / 2 : 0), y = row * h;
      const shade = 72 + random() * 36;
      ctx.fillStyle = `rgb(${shade + 6},${shade + 8},${shade + 5})`; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
      hc.fillStyle = `rgb(${185 + random() * 25},${185},${185})`; hc.fillRect(x + 5, y + 5, w - 10, h - 10);
      ctx.strokeStyle = '#c0b9a22b'; ctx.lineWidth = 3; ctx.strokeRect(x + 8, y + 8, w - 16, h - 16);
      // Cracks, mineral streaks and damp edges, rather than uniform pixel noise.
      for (let j = 0; j < 7; j++) {
        const sx = x + random() * w, sy = y + random() * h;
        ctx.beginPath(); hc.beginPath(); ctx.moveTo(sx, sy); hc.moveTo(sx, sy);
        let px = sx, py = sy;
        for (let k = 0; k < 5; k++) { px += (random() - .5) * 18; py += random() * 12; ctx.lineTo(px, py); hc.lineTo(px, py); }
        ctx.strokeStyle = '#212b2a66'; ctx.lineWidth = 1 + random() * 2; ctx.stroke(); hc.strokeStyle = '#666'; hc.lineWidth = 2; hc.stroke();
      }
      const gradient = ctx.createLinearGradient(x, y, x + 12, y + h); gradient.addColorStop(0, '#0c191f55'); gradient.addColorStop(.5, '#00000000'); gradient.addColorStop(1, '#152c2588');
      ctx.fillStyle = gradient; ctx.fillRect(x + 5, y + 5, w - 10, h - 10);
    }
    const pixels = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < pixels.data.length; i += 4) { const noise = (random() - .5) * 23; for (let c = 0; c < 3; c++) pixels.data[i + c] += noise; }
    ctx.putImageData(pixels, 0, 0);
    const color = new T.CanvasTexture(canvas), bump = new T.CanvasTexture(height);
    color.colorSpace = T.SRGBColorSpace;
    for (const texture of [color, bump]) { texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); }
    return { color, bump };
  }
  const masonry = surface('wall'), paving = surface('floor');
  const limestone = new T.TextureLoader().load(`${import.meta.env.BASE_URL}art/weathered-limestone.webp`, texture => {
    // Blend mineral grain into the large masonry/paving sheets without losing their joints.
    for (const sheet of [masonry.color, paving.color]) {
      const ctx = sheet.image.getContext('2d'); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = .65;
      ctx.drawImage(texture.image, 0, 0, 1024, 1024); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; sheet.needsUpdate = true;
    }
  });
  limestone.colorSpace = T.SRGBColorSpace; limestone.wrapS = limestone.wrapT = T.RepeatWrapping; limestone.repeat.set(2, 3); limestone.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const stone = new T.MeshStandardMaterial({ color: '#b6b6aa', map: masonry.color, bumpMap: masonry.bump, bumpScale: .065, roughness: .94 });
  const darkStone = stone.clone(); darkStone.color.set('#656e69');
  const trim = new T.MeshStandardMaterial({ color: '#b4b9ad', map: limestone, bumpMap: limestone, bumpScale: .05, roughness: .94 });
  const column = trim.clone(); column.color.set('#a4b1ae');
  const floor = new T.MeshStandardMaterial({ color: '#999e95', map: paving.color, bumpMap: paving.bump, bumpScale: .055, roughness: .77 });
  floor.map.repeat.set(5, 8); floor.bumpMap.repeat.set(5, 8);
  const gold = new T.MeshStandardMaterial({ color: '#b69a67', metalness: .8, roughness: .4 });
  const iron = new T.MeshStandardMaterial({ color: '#323d3d', metalness: .77, roughness: .56 });
  const wood = new T.MeshStandardMaterial({ color: '#49362a', roughness: .91 });
  return { stone, darkStone, trim, column, floor, gold, iron, wood };
}

