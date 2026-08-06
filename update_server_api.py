import re

with open('server.ts', 'r') as f:
    content = f.read()

search_post = """  app.post("/api/debt-templates", (req: Request, res: Response) => {
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
    };"""

replace_post = """  app.post("/api/debt-templates", (req: Request, res: Response) => {
    const { name, freq, dueDay, hasInterest, usePlan, color, authorAlias } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Name is required" });
    }

    const newTemplate = {
      id: `tpl_${Date.now()}`,
      name,
      freq: freq || "monthly",
      dueDay: dueDay || "1",
      hasInterest: !!hasInterest,
      usePlan: !!usePlan,
      color: color || "#9c27b0",
      downloads: 1,
      authorAlias: authorAlias || "Usuario Monywissen",
      updatedAt: new Date().toISOString().split("T")[0],
    };"""

content = content.replace(search_post, replace_post)

with open('server.ts', 'w') as f:
    f.write(content)
