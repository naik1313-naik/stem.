import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = `${__dirname}/public/icons`;

mkdirSync(iconsDir, { recursive: true });

function drawIcon(ctx, size) {
  const center = size / 2;
  const radius = size * 0.45;
  
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#12766B'); // teal
  gradient.addColorStop(1, '#D9622B'); // orange
  
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, size * 0.1875);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Battery icon
  const batW = size * 0.32;
  const batH = size * 0.16;
  const batX = center - batW / 2;
  const batY = center - batH / 2 - size * 0.05;
  
  ctx.beginPath();
  ctx.roundRect(batX, batY, batW, batH, size * 0.03);
  ctx.lineWidth = size * 0.023;
  ctx.strokeStyle = 'white';
  ctx.stroke();
  
  // Battery tip
  const tipW = size * 0.047;
  const tipH = size * 0.08;
  ctx.beginPath();
  ctx.roundRect(batX + batW, batY + batH * 0.25, tipW, tipH, size * 0.01);
  ctx.fillStyle = 'white';
  ctx.fill();
  
  // Battery inner
  ctx.beginPath();
  ctx.roundRect(batX + size * 0.02, batY + size * 0.02, batW * 0.3, batH - size * 0.04, size * 0.015);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();
  
  // Lightning bolt
  ctx.font = `bold ${size * 0.11}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';
  ctx.fillText('⚡', center, center + size * 0.07);
  
  // Orbit rings (atom representation)
  ctx.lineWidth = size * 0.008;
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.ellipse(center, center, radius, radius * 0.35, 0, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.ellipse(center, center, radius * 0.35, radius, Math.PI / 2, 0, Math.PI * 2);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.ellipse(center, center, radius, radius * 0.35, Math.PI / 3, 0, Math.PI * 2);
  ctx.stroke();
  
  // Center dot
  ctx.beginPath();
  ctx.arc(center, center, size * 0.03, 0, Math.PI * 2);
  ctx.fillStyle = 'white';
  ctx.fill();
}

for (const size of sizes) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawIcon(ctx, size);
  
  const buffer = canvas.toBuffer('image/png');
  const filepath = `${iconsDir}/icon-${size}.png`;
  writeFileSync(filepath, buffer);
  console.log(`Generated ${filepath}`);
}

// Also generate maskable icon (with safe zone)
const maskableSize = 512;
const canvas = createCanvas(maskableSize, maskableSize);
const ctx = canvas.getContext('2d');
drawIcon(ctx, maskableSize);
const buffer = canvas.toBuffer('image/png');
writeFileSync(`${iconsDir}/icon-512-maskable.png`, buffer);
console.log(`Generated ${iconsDir}/icon-512-maskable.png`);

// Generate favicon.ico (32x32)
const faviconCanvas = createCanvas(32, 32);
const faviconCtx = faviconCanvas.getContext('2d');
drawIcon(faviconCtx, 32);
const faviconBuffer = faviconCanvas.toBuffer('image/png');
writeFileSync(`${__dirname}/public/favicon.png`, faviconBuffer);
console.log(`Generated ${__dirname}/public/favicon.png`);