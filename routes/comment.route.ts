import { Router } from "express";
import {createComment,deleteComment,getAllComments,updateComment} from "../controllers/commentController"
const commentRouter = Router();
commentRouter.get("/:id",getAllComments);
commentRouter.post("/:id", createComment);
commentRouter.put("/:id", updateComment);
commentRouter.delete("/:id", deleteComment);

export default commentRouter;