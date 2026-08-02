var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/utils/security.ts
var SECRET_SALT = "MONYWISSEN_SECURE_VAULT_KEY_2026";
function encryptData(plainText, secretKey = SECRET_SALT) {
  try {
    const textChars = Array.from(plainText);
    const keyChars = Array.from(secretKey);
    const encrypted = textChars.map((char, index) => {
      const keyChar = keyChars[index % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join("");
    return btoa(encodeURIComponent(encrypted));
  } catch (e) {
    console.error("Encryption failed:", e);
    return plainText;
  }
}
function decryptData(cipherText, secretKey = SECRET_SALT) {
  try {
    const decoded = decodeURIComponent(atob(cipherText));
    const textChars = Array.from(decoded);
    const keyChars = Array.from(secretKey);
    return textChars.map((char, index) => {
      const keyChar = keyChars[index % keyChars.length];
      return String.fromCharCode(char.charCodeAt(0) ^ keyChar.charCodeAt(0));
    }).join("");
  } catch (e) {
    console.error("Decryption failed:", e);
    return cipherText;
  }
}
function createJWT(user) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: user.email,
    alias: user.alias,
    phone: user.phone || "",
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 86400 * 30
    // 30 days
  };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = btoa(encryptData(`${encodedHeader}.${encodedPayload}`));
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
function verifyJWT(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1e3);
    if (payload.exp && payload.exp < now) {
      return { valid: false };
    }
    return { valid: true, payload };
  } catch (e) {
    return { valid: false };
  }
}

// server.ts
var cloudStorageVault = {};
var defaultDebtTemplates = [
  {
    id: "tpl_cashea",
    name: "Cashea",
    freq: "biweekly",
    hasInterest: false,
    usePlan: true,
    color: "#fbbc04",
    downloads: 1420,
    authorAlias: "Comunidad Monywissen",
    updatedAt: "2026-07-15"
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
    updatedAt: "2026-07-20"
  },
  {
    id: "tpl_banesco_cuotas",
    name: "Pr\xE9stamo Banesco Cuotas",
    freq: "monthly",
    hasInterest: true,
    usePlan: false,
    color: "#1a73e8",
    downloads: 650,
    authorAlias: "FinanzasPRO",
    updatedAt: "2026-07-28"
  }
];
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json({ limit: "50mb" }));
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "Monywissen Financial Engine API",
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.2.1"
    });
  });
  app.post("/api/auth/login", (req, res) => {
    const { email, alias, phone } = req.body;
    if (!email || !alias) {
      return res.status(400).json({ error: "Email and alias are required" });
    }
    const token = createJWT({ email, alias, phone });
    return res.json({
      success: true,
      token,
      user: { email, alias, phone }
    });
  });
  app.post("/api/auth/verify", (req, res) => {
    const authHeader = req.headers.authorization;
    const token = authHeader ? authHeader.replace("Bearer ", "") : req.body.token;
    if (!token) {
      return res.status(401).json({ valid: false, error: "No token provided" });
    }
    const verification = verifyJWT(token);
    return res.json(verification);
  });
  app.post("/api/sync/backup", (req, res) => {
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    return res.json({
      success: true,
      updatedAt: cloudStorageVault[userEmail].updatedAt,
      checksum: encrypted.length
    });
  });
  app.get("/api/sync/restore", (req, res) => {
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
        dataPayload
      });
    } catch (e) {
      return res.status(500).json({ error: "Decryption failed" });
    }
  });
  app.get("/api/debt-templates", (req, res) => {
    const search = (req.query.q || "").toLowerCase().trim();
    let results = defaultDebtTemplates;
    if (search) {
      results = defaultDebtTemplates.filter((t) => t.name.toLowerCase().includes(search));
    }
    return res.json({ success: true, count: results.length, templates: results });
  });
  app.post("/api/debt-templates", (req, res) => {
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
      updatedAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    defaultDebtTemplates.unshift(newTemplate);
    return res.json({ success: true, template: newTemplate });
  });
  app.get("/api/docs", (_req, res) => {
    res.json({
      service: "Monywissen Microservices API",
      architecture: "RESTful JSON API with JWT Authentication and Client/Server Encrypted Vault",
      endpoints: [
        { path: "/api/health", method: "GET", description: "Service status check" },
        { path: "/api/auth/login", method: "POST", description: "Issue secure JWT bearer token" },
        { path: "/api/auth/verify", method: "POST", description: "Validate JWT bearer token" },
        { path: "/api/sync/backup", method: "POST", description: "Save encrypted financial profile state" },
        { path: "/api/sync/restore", method: "GET", description: "Retrieve encrypted financial profile state" },
        { path: "/api/debt-templates", method: "GET", description: "Search community debt templates" }
      ]
    });
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Monywissen server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
