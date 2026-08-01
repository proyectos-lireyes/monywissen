import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createJWT, verifyJWT, encryptData, decryptData } from "./src/utils/security";

// Server Storage Memory for encrypted sync & templates
const cloudStorageVault: Record<string, { encryptedPayload: string; updatedAt: string }> = {};

const defaultDebtTemplates = [
  {
    id: "tpl_cashea",
    name: "Cashea",
    freq: "biweekly",
    hasInterest: false,
    usePlan: true,
    color: "#fbbc04",
    downloads: 1420,
    authorAlias: "Comunidad Monywissen",
    updatedAt: "2026-07-15",
  },
  {
    id: "tpl_quoota",
    name: "Quoota",
    freq: "biweekly",
    hasInterest: false,
    usePlan: true,
    color: "#e8710a",
    downloads: 980,
    authorAlias: "Comunidad Monywissen",
    updatedAt: "2026-07-20",
  },
  {
    id: "tpl_banesco_cuotas",
    name: "Préstamo Banesco Cuotas",
    freq: "monthly",
    hasInterest: true,
    usePlan: false,
    color: "#1a73e8",
    downloads: 650,
    authorAlias: "FinanzasPRO",
    updatedAt: "2026-07-28",
  },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // 1. Health check
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "Monywissen Financial Engine API",
      timestamp: new Date().toISOString(),
      version: "1.2.1",
    });
  });

  // 2. Authentication (JWT Token Issuance)
  app.post("/api/auth/login", (req: Request, res: Response) => {
    const { email, alias, phone } = req.body;
    if (!email || !alias) {
      return res.status(400).json({ error: "Email and alias are required" });
    }

    const token = createJWT({ email, alias, phone });
    return res.json({
      success: true,
      token,
      user: { email, alias, phone },
    });
  });

  // 3. Verify JWT Token
  app.post("/api/auth/verify", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;

    if (!token) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }

    const verification = verifyJWT(token);
    return res.json(verification);
  });

  // 4. Encrypted Data Backup & Restore API
  app.post("/api/sync/backup", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : "";
    const verification = verifyJWT(token);

    if (!verification.valid) {
      return res.status(401).json({ error: "Unauthorized token" });
    }

    const userEmail = verification.payload.sub;
    const { dataPayload } = req.body;

    if (!dataPayload) {
      return res.status(400).json({ error: "Data payload required" });
    }

    const encrypted = encryptData(JSON.stringify(dataPayload));
    cloudStorageVault[userEmail] = {
      encryptedPayload: encrypted,
      updatedAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      updatedAt: cloudStorageVault[userEmail].updatedAt,
      checksum: encrypted.length,
    });
  });

  app.get("/api/sync/restore", (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : "";
    const verification = verifyJWT(token);

    if (!verification.valid) {
      return res.status(401).json({ error: "Unauthorized token" });
    }

    const userEmail = verification.payload.sub;
    const record = cloudStorageVault[userEmail];

    if (!record) {
      return res.status(404).json({ error: "No cloud backup found for this account" });
    }

    try {
      const decryptedString = decryptData(record.encryptedPayload);
      const dataPayload = JSON.parse(decryptedString);
      return res.json({
        success: true,
        updatedAt: record.updatedAt,
        dataPayload,
      });
    } catch (e) {
      return res.status(500).json({ error: "Decryption failed" });
    }
  });

  // 5. Cloud Debt Templates API
  app.get("/api/debt-templates", (req: Request, res: Response) => {
    const search = ((req.query.q as string) || "").toLowerCase().trim();
    let results = defaultDebtTemplates;

    if (search) {
      results = defaultDebtTemplates.filter(t => t.name.toLowerCase().includes(search));
    }

    return res.json({ success: true, count: results.length, templates: results });
  });

  app.post("/api/debt-templates", (req: Request, res: Response) => {
    const { name, freq, hasInterest, usePlan, color, authorAlias } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const newTemplate = {
      id: `tpl_${Date.now()}`,
      name,
      freq: freq || "monthly",
      hasInterest: !!hasInterest,
      usePlan: !!usePlan,
      color: color || "#9c27b0",
      downloads: 1,
      authorAlias: authorAlias || "Usuario Monywissen",
      updatedAt: new Date().toISOString().split("T")[0],
    };

    defaultDebtTemplates.unshift(newTemplate);
    return res.json({ success: true, template: newTemplate });
  });

  // 6. Microservice API Documentation Metadata
  app.get("/api/docs", (_req: Request, res: Response) => {
    res.json({
      service: "Monywissen Microservices API",
      architecture: "RESTful JSON API with JWT Authentication and Client/Server Encrypted Vault",
      endpoints: [
        { path: "/api/health", method: "GET", description: "Service status check" },
        { path: "/api/auth/login", method: "POST", description: "Issue secure JWT bearer token" },
        { path: "/api/auth/verify", method: "POST", description: "Validate JWT bearer token" },
        { path: "/api/sync/backup", method: "POST", description: "Save encrypted financial profile state" },
        { path: "/api/sync/restore", method: "GET", description: "Retrieve encrypted financial profile state" },
        { path: "/api/debt-templates", method: "GET", description: "Search community debt templates" },
      ],
    });
  });

  // ==========================================
  // VITE MIDDLEWARE / PRODUCTION STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Monywissen server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
