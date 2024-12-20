import { Router } from "express";

import auth from "../middlewares/auth";

import validate from "../middlewares/validate";

import {tokenCreateSchema, tokenGetSchema} from "../schemas";

import { createToken, getAllTokens, getTokenByAddress, uploadImage, getPumpEmperor } from "../controllers";

import { upload } from "../middlewares/upload";

const router: Router = Router();

router.get(
  "/all",
  getAllTokens
);

router.get(
  "/:address",
  validate(tokenGetSchema),
  getTokenByAddress
);

router.get(
  "/emperor/last",
  getPumpEmperor
)

router.post(
  "/create",
  auth,
  validate(tokenCreateSchema),
  createToken
);

router.post(
  "/upload-image",
  auth,
  upload,
  uploadImage
);


export default router;
