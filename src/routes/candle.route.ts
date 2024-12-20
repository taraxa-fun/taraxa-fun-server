import { Router } from "express";
import { getAllCandles } from "../controllers";

const router: Router = Router();

router.get(
  "/all/:address",
  getAllCandles
);

export default router;
