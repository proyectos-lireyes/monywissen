const sharp = require('sharp');

// Icon: Dark blue background with an M
const iconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#1e3a8a"/>
  <text x="512" y="700" font-family="Arial, sans-serif" font-size="600" font-weight="bold" fill="#ffffff" text-anchor="middle">M</text>
  <text x="512" y="900" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="#60a5fa" text-anchor="middle">MONYWISSEN</text>
</svg>`;

// Splash: Dark blue background with text
const splashSvg = `
<svg width="2732" height="2732" xmlns="http://www.w3.org/2000/svg">
  <rect width="2732" height="2732" fill="#1e3a8a"/>
  <text x="1366" y="1400" font-family="Arial, sans-serif" font-size="800" font-weight="bold" fill="#ffffff" text-anchor="middle">M</text>
  <text x="1366" y="1700" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="#60a5fa" text-anchor="middle">MONYWISSEN</text>
</svg>`;

async function generate() {
  await sharp(Buffer.from(iconSvg)).png().toFile('assets/icon.png');
  await sharp(Buffer.from(splashSvg)).png().toFile('assets/splash.png');
  console.log("Generated assets/icon.png and assets/splash.png");
}

generate();
