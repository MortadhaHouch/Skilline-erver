import { Router } from "express";
import {createComment,deleteComment,getAllComments,updateComment} from "../controllers/commentController"
const notificationRouter = Router();
notificationRouter.get("/",getAllComments);
notificationRouter.post("/", createComment);
notificationRouter.put("/:id", updateComment);
notificationRouter.delete("/:id", deleteComment);

export default notificationRouter;