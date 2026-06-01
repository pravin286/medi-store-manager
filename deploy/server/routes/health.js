"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// Local schema (replaces api-zod)
const HealthCheckResponse = zod_1.z.object({
    status: zod_1.z.string(),
});
router.get("/healthz", (_req, res) => {
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
});
exports.default = router;
