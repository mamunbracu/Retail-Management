import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { supabase, isSupabaseConfigured } from "./server/config/supabase.js";
import { checkSupabase } from "./server/middleware/auth.js";
import { seedDatabase } from "./server/services/database.js";
import { setIoInstance } from "./server/services/socketService.js";
import apiRoutes from "./server/routes/index.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createApp() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Socket.IO setup
  let io: Server | null = null;
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    const httpServer = http.createServer(app);
    io = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    setIoInstance(io);

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  // Auth/Config check middleware
  app.use("/api", checkSupabase);

  // Health check
  app.get("/api/health", async (req, res) => {
    const tables = ["employees", "instructions", "resources", "shift_tasks", "sales", "transactions", "roster", "order_list", "notifications", "salaries", "documents"];
    const status: any = {};
    
    if (!isSupabaseConfigured) {
      return res.status(503).json({ 
        status: "error", 
        message: "Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the Secrets panel."
      });
    }

    try {
      const tablePromises = tables.map(table => 
        supabase.from(table).select("*", { count: 'exact', head: true })
          .then(({ count, error }) => ({ type: 'table', name: table, count, error }))
      );
      
      const results = await Promise.all(tablePromises);

      for (const result of results as any[]) {
        status[result.name] = result.error ? `Error: ${result.error.message}` : `OK (${result.count} rows)`;
      }

      res.json({ status: "ok", tables: status });
    } catch (err: any) {
      console.error("Health check failed:", err);
      res.status(500).json({ status: "error", message: err.message });
    }
  });

  // Seed and Clear routes
  app.post("/api/seed", async (req, res) => {
    console.log("Manual seed requested...");
    await seedDatabase();
    res.json({ success: true, message: "Seeding process completed." });
  });

  app.post("/api/clear-all", async (req, res) => {
    console.log("Clear all data requested...");
    try {
      const tables = ["employees", "instructions", "resources", "shift_tasks", "sales", "transactions", "roster", "order_list", "notifications", "salaries", "documents", "app_settings"];
      for (const table of tables) {
        await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      res.json({ success: true, message: "All data cleared successfully" });
    } catch (err: any) {
      res.status(500).json({ error: "Clear all failed", message: err.message });
    }
  });

  // API Routes
  app.use("/api", apiRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Seed database on startup
  await seedDatabase();

  return app;
}

const appPromise = createApp();
export default appPromise;

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  console.log("Starting server...");
  appPromise.then(app => {
    const httpServer = http.createServer(app);
    const PORT = 3000;
    httpServer.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }).catch(err => {
    console.error("CRITICAL: Server failed to start:", err);
    process.exit(1);
  });
}
