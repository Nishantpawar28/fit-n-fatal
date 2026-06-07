const fs = require('fs');
const path = require('path');

// Minimal valid 1x1 PNG (purple pixel)
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYGD4DwABBAEAW9JOiAAAAABJRU5ErkJggg==',
  'base64'
);

const assetsDir = path.join(__dirname, '..', 'apps', 'mobile', 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

for (const file of ['icon.png', 'splash.png', 'adaptive-icon.png']) {
  const filePath = path.join(assetsDir, file);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, png);
    console.log(`Created ${file}`);
  }
}
