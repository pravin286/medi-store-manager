import { Router } from "express";
import { z } from "zod";
const router = Router();
// Local schema (replaces api-zod)
const HealthCheckResponse = z.object({
    status: z.string(),
});
router.get("/healthz", (_req, res) => {
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
});
export default router;
