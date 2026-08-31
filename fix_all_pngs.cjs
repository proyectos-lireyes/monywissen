const fs = require('fs');
const path = require('path');

// 1x1 transparent PNG
const transparentPng = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.png')) {
                results.push(file);
            }
        }
    });
    return results;
}

const baseDir = path.join(__dirname, 'android/app/src/main/res');
const pngFiles = walk(baseDir);

pngFiles.forEach(filePath => {
    fs.writeFileSync(filePath, transparentPng);
    console.log(`Fixed ${filePath}`);
});
