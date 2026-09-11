import fs from 'fs';

let content = fs.readFileSync('src/context/AppContext.tsx', 'utf8');

content = content.replace("fetch('/api/updates')", "fetch('https://api.github.com/repos/proyectos-lireyes/monywissen/releases/latest')");
content = content.replace("fetch('/api/exchange-rates/usd')", "fetch('https://ve.dolarapi.com/v1/dolares')");
content = content.replace("fetch('/api/exchange-rates/eur')", "fetch('https://ve.dolarapi.com/v1/euros')");

fs.writeFileSync('src/context/AppContext.tsx', content);
