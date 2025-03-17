import { Router } from "express";
import { getAllMessages, sendMessage } from "../controllers/messageController";
const messageRouter = Router();
messageRouter.get("/",getAllMessages);
messageRouter.post("/:message",sendMessage);
export default messageRouter;