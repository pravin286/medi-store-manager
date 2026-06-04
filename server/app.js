"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const pino_http_1 = __importDefault(require("pino-http"));
const routes_1 = __importDefault(require("./routes"));
const health_1 = __importDefault(require("./routes/health")); // 👈 add this
const logger_1 = require("./lib/logger");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const uploadsDir = path_1.default.resolve(process.env.UPLOADS_DIR ?? path_1.default.join(process.cwd(), "uploads"));
const deployFrontendDir = path_1.default.resolve(process.cwd(), "deploy", "public");
const appRootFrontendDir = path_1.default.resolve(process.cwd(), "public");
const workspaceFrontendDir = path_1.default.resolve(process.cwd(), "artifacts", "medical-stores", "dist");
const frontendDistDir = path_1.default.resolve(process.env.FRONTEND_DIST_DIR ??
    (fs_1.default.existsSync(path_1.default.join(deployFrontendDir, "index.html"))
        ? deployFrontendDir
        : fs_1.default.existsSync(path_1.default.join(appRootFrontendDir, "index.html"))
            ? appRootFrontendDir
            : workspaceFrontendDir));
const frontendIndex = path_1.default.join(frontendDistDir, "index.html");
app.use((0, pino_http_1.default)({
    logger: logger_1.logger,
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
}));
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ✅ Serve uploaded images
app.use("/uploads", express_1.default.static(uploadsDir));
// 🔧 Debug upload storage path
app.get("/debug-uploads", (_req, res) => {
    const exists = fs_1.default.existsSync(uploadsDir);
    const files = exists ? fs_1.default.readdirSync(uploadsDir) : [];
    res.json({ uploadsDir, exists, files });
});
// ✅ Health route WITHOUT /api prefix
app.use("/", health_1.default);
// ✅ All other routes under /api
app.use("/api", routes_1.default);
if (fs_1.default.existsSync(frontendIndex)) {
    app.use(express_1.default.static(frontendDistDir));
    app.get(/^\/(?!api\/|uploads\/).*/, (_req, res) => {
        res.sendFile(frontendIndex);
    });
}
exports.default = app;
