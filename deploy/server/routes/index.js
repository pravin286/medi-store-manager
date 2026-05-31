import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storesRouter from "./stores";
const router = Router();
router.use(healthRouter);
router.use(authRouter);
router.use(storesRouter);
export default router;
