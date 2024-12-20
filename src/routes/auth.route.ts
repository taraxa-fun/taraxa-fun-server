import { Router } from "express";
import validate from "../middlewares/validate";
import {authSchema} from "../schemas/index";

import { getNonce, signIn } from "../controllers"; 

const router: Router = Router();

router.get(
  "/nonce/:wallet",
  getNonce
);

router.post(
  "/sign-in",
  validate(authSchema),
  signIn
);

export default router;
