"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const logger_1 = require("./lib/logger");
// Use default if not provided
const rawPort = process.env["PORT"] || "4000";
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
}
app_1.default.listen(port, (err) => {
    if (err) {
        logger_1.logger.error({ err }, "Error listening on port");
        process.exit(1);
    }
    logger_1.logger.info({ port }, "Server listening");
});
