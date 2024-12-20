import { Router } from "express";
import { getLatestTrades } from "../controllers";

const router: Router = Router();

router.get(
  "/last",
  getLatestTrades
)

export default router;
