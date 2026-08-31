const fs = require('fs');
const path = require('path');

// 1x1 solid white PNG
const whitePng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=", "base64");

const baseDir = path.join(__dirname, 'android/app/src/main/res');
const folders = fs.readdirSync(baseDir).filter(f => f.startsWith('mipmap-'));

folders.forEach(folder => {
    const filePath = path.join(baseDir, folder, 'ic_launcher_background.png');
    if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, whitePng);
        console.log(`Fixed ${filePath}`);
    }
});
