import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import healthRoutes from "./routes/health"; // 👈 add this
import { logger } from "./lib/logger";
import path from "path";
import fs from "fs";


const app: Express = express();
const uploadsDir = path.resolve(process.env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads"));
const frontendDistDir = path.resolve(process.cwd(), "artifacts", "medical-stores", "dist");
const frontendIndex = path.join(frontendDistDir, "index.html");

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploaded images
app.use(
  "/uploads",
  express.static(uploadsDir)
);

// ✅ Health route WITHOUT /api prefix
app.use("/", healthRoutes);

// ✅ All other routes under /api
app.use("/api", router);

if (fs.existsSync(frontendIndex)) {
  app.use(express.static(frontendDistDir));
  app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => {
    res.sendFile(frontendIndex);
  });
}

export default app;
