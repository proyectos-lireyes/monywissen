const fs = require('fs');
const p = 'server.ts';
let txt = fs.readFileSync(p, 'utf8');

const newRoutes = `
  app.get("/api/updates", async (req, res) => {
    try {
      const resp = await fetch('https://api.github.com/repos/proyectos-lireyes/monywissen/releases/latest');
      if (resp.ok) {
        const data = await resp.json();
        res.json(data);
      } else {
        res.status(resp.status).json({ error: "Failed to fetch updates" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch updates" });
    }
  });

  app.get("/api/exchange-rates/usd", async (req, res) => {
    try {
      const resp = await fetch('https://ve.dolarapi.com/v1/dolares');
      if (resp.ok) {
        const data = await resp.json();
        res.json(data);
      } else {
        res.status(resp.status).json({ error: "Failed to fetch usd" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch usd" });
    }
  });

  app.get("/api/exchange-rates/eur", async (req, res) => {
    try {
      const resp = await fetch('https://ve.dolarapi.com/v1/euros');
      if (resp.ok) {
        const data = await resp.json();
        res.json(data);
      } else {
        res.status(resp.status).json({ error: "Failed to fetch eur" });
      }
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch eur" });
    }
  });
`;

txt = txt.replace(
  /app\.get\("\/api\/exchange-rates"[\s\S]*?\}\);/m,
  newRoutes
);

fs.writeFileSync(p, txt);
