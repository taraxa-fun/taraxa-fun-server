import config from "config";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

import Payload from "../types/Payload";
import Request from "../types/Request";

export default function (req: Request, res: Response, next: NextFunction) {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(403).json({ msg: "No token, authorization denied" });
  }

  try {
    const payload: Payload | any = jwt.verify(token, process.env.JWT_SECRET);
    req.userWallet = payload.userWallet;
    next();
  } catch (err) {
    res.status(403).json({ msg: "Token is not valid" });
  }
}
