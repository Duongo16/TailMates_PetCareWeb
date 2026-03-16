import sharp from 'sharp';

const inputPath = process.argv[2];
const outputPath = process.argv[3];
const THRESHOLD = 240;

async function removeBg() {
  const image = sharp(inputPath);
  const { width, height } = await image.metadata();
  
  const rawBuffer = await image.ensureAlpha().raw().toBuffer();
  const pixels = new Uint8Array(rawBuffer);
  
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    
    if (r > THRESHOLD && g > THRESHOLD && b > THRESHOLD) {
      pixels[i + 3] = 0;
    }
    
    const brightness = (r + g + b) / 3;
    if (brightness > 230 && Math.max(r, g, b) - Math.min(r, g, b) < 20) {
      const alpha = Math.max(0, Math.min(255, (255 - brightness) * 10));
      pixels[i + 3] = Math.min(pixels[i + 3], alpha);
    }
  }
  
  await sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } })
    .png()
    .toFile(outputPath);
  
  console.log('Done! Transparent PNG saved.');
}

removeBg().catch(console.error);
