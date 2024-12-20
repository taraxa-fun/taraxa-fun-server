import config from "config";
import { Router } from "express";
import { getUserByAddress, getUserMe, getUserByUsername, updateUserMe, uploadAvatar } from "../controllers";
import auth from "../middlewares/auth";
import validate from "../middlewares/validate";
import { upload } from "../middlewares/upload";
import { userUpdateSchema } from "../schemas";

const router: Router = Router();

router.get(
  "/me",
  auth,
  getUserMe
)

router.put(
  "/me",
  auth,
  validate(userUpdateSchema),
  updateUserMe
);

router.get(
  "/username/:username",
  getUserByUsername
)

router.get(
  "/address/:address",
  getUserByAddress
);

router.post(
  "/upload-avatar",
  auth,
  upload,
  uploadAvatar
);


export default router;
