import express from 'express';
import path from 'path';

import fs from 'fs';
import { createServer as createViteServer } from 'vite';



async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/exchange-rates", async (req, res) => {
    try {
      const [usdRes, eurRes] = await Promise.all([
        fetch('https://ve.dolarapi.com/v1/dolares/oficial').then(r => r.json()),
        fetch('https://ve.dolarapi.com/v1/euros/oficial').then(r => r.json())
      ]);
      res.json({ usd: usdRes, eur: eurRes });
    } catch (err) {
      console.error("Error fetching exchange rates from proxy:", err);
      res.status(500).json({ error: "Failed to fetch exchange rates" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
