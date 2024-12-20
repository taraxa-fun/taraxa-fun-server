import { Router, Response, NextFunction } from "express";
import { getCommentsOfToken, createComment, addLike, removeLike } from "../controllers";
import auth from "../middlewares/auth";
import validate from "../middlewares/validate";
import { commentCreateSchema } from "../schemas";
import { EventEmitter } from 'events';
import Request from "../types/Request";

export default function createCommentRouter(emitter: EventEmitter) {
  const router: Router = Router();

  router.get(
    "/:address",
    getCommentsOfToken
  );

  router.post(
    "/create",
    auth,
    validate(commentCreateSchema),
    (req: Request, res: Response) => {
      return createComment(req, res, emitter);
    }
  );

  router.post(
    "/like",
    auth,
    addLike
  );

  router.post(
    "/unlike",
    auth,
    removeLike
  );

  return router;
}
