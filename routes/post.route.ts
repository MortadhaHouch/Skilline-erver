import {Router} from "express";
const postRouter = Router();
import {createPost,getAllPosts,handlePostReaction} from "../controllers/postController";
postRouter.post("/:id",createPost);
postRouter.get("/:id",getAllPosts);
postRouter.post("/react/:id",handlePostReaction);
export default postRouter;