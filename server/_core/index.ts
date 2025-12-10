import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Admin route for database backup
  app.get('/api/admin/backup-database', async (req, res) => {
    try {
      const { getDb } = await import('../db');
      const db = getDb();
      
      // Get all table names
      const tables = await db.execute({ sql: 'SHOW TABLES' });
      
      let sqlDump = `-- Database Backup\n`;
      sqlDump += `-- Date: ${new Date().toISOString()}\n`;
      sqlDump += `-- System: Sistema Financeiro EK-BPO\n\n`;
      
      // For each table, get structure and data
      for (const tableRow of tables.rows) {
        const tableName = Object.values(tableRow)[0] as string;
        
        // Get CREATE TABLE statement
        const createTable = await db.execute({ 
          sql: `SHOW CREATE TABLE \`${tableName}\`` 
        });
        const createStatement = (createTable.rows[0] as any)['Create Table'];
        
        sqlDump += `-- Table: ${tableName}\n`;
        sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
        sqlDump += `${createStatement};\n\n`;
        
        // Get table data
        const data = await db.execute({ 
          sql: `SELECT * FROM \`${tableName}\`` 
        });
        
        if (data.rows && data.rows.length > 0) {
          sqlDump += `-- Data for table ${tableName}\n`;
          
          for (const row of data.rows) {
            const columns = Object.keys(row).map(k => `\`${k}\``).join(', ');
            const values = Object.values(row).map(v => {
              if (v === null) return 'NULL';
              if (typeof v === 'string') return `'${v.replace(/'/g, "\\'")}'`;
              if (v instanceof Date) return `'${v.toISOString()}'`;
              return v;
            }).join(', ');
            
            sqlDump += `INSERT INTO \`${tableName}\` (${columns}) VALUES (${values});\n`;
          }
          
          sqlDump += `\n`;
        }
      }
      
      // Send as downloadable file
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', `attachment; filename="backup_${Date.now()}.sql"`);
      res.send(sqlDump);
      
    } catch (error: any) {
      console.error('Backup error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
