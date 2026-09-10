const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.join(__dirname, 'icon-source.svg');
const svg = fs.readFileSync(svgPath);

const webPublicIcons = path.join(__dirname, '..', 'apps', 'web', 'public', 'icons');
const webAppDir = path.join(__dirname, '..', 'apps', 'web', 'src', 'app');
const mobileAssets = path.join(__dirname, '..', 'apps', 'mobile', 'assets');

fs.mkdirSync(webPublicIcons, { recursive: true });
fs.mkdirSync(mobileAssets, { recursive: true });

const targets = [
  // PWA manifest icons (public/icons)
  { out: path.join(webPublicIcons, 'icon-192.png'), size: 192 },
  { out: path.join(webPublicIcons, 'icon-512.png'), size: 512 },
  { out: path.join(webPublicIcons, 'maskable-512.png'), size: 512, padPct: 0.1 }, // extra safe-zone padding for Android's mask crop
  // Next.js App Router special files (auto-wired into <head>)
  { out: path.join(webAppDir, 'icon.png'), size: 512 },
  { out: path.join(webAppDir, 'apple-icon.png'), size: 180 },
  // Mobile app placeholders (Expo) — replaces the 1x1 placeholder pixels
  { out: path.join(mobileAssets, 'icon.png'), size: 1024 },
  { out: path.join(mobileAssets, 'adaptive-icon.png'), size: 1024, padPct: 0.18 },
];

async function run() {
  for (const t of targets) {
    let pipeline = sharp(svg, { density: 384 }).resize(t.size, t.size);

    if (t.padPct) {
      const inner = Math.round(t.size * (1 - t.padPct * 2));
      pipeline = sharp(svg, { density: 384 })
        .resize(inner, inner)
        .extend({
          top: Math.round((t.size - inner) / 2),
          bottom: Math.round((t.size - inner) / 2),
          left: Math.round((t.size - inner) / 2),
          right: Math.round((t.size - inner) / 2),
          background: { r: 139, g: 43, b: 255, alpha: 1 },
        })
        .resize(t.size, t.size);
    }

    await pipeline.png().toFile(t.out);
    console.log('Wrote', path.relative(process.cwd(), t.out));
  }

  // Splash screen for Expo — brand bg with centered mark
  const splashSize = 1024;
  const mark = await sharp(svg, { density: 384 }).resize(420, 420).png().toBuffer();
  await sharp({
    create: { width: splashSize, height: splashSize, channels: 4, background: { r: 13, g: 13, b: 20, alpha: 1 } },
  })
    .composite([{ input: mark, gravity: 'center' }])
    .png()
    .toFile(path.join(mobileAssets, 'splash.png'));
  console.log('Wrote', path.relative(process.cwd(), path.join(mobileAssets, 'splash.png')));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
