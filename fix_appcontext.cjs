const fs = require('fs');
const p = 'src/context/AppContext.tsx';
let txt = fs.readFileSync(p, 'utf8');

txt = txt.replace(/https:\/\/api\.github\.com\/repos\/proyectos-lireyes\/monywissen\/releases\/latest/g, '/api/updates');
txt = txt.replace(/fetch\('https:\/\/ve\.dolarapi\.com\/v1\/dolares'\)/g, "fetch('/api/exchange-rates/usd')");
txt = txt.replace(/fetch\('https:\/\/ve\.dolarapi\.com\/v1\/euros'\)/g, "fetch('/api/exchange-rates/eur')");

fs.writeFileSync(p, txt);
