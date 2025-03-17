import {Router} from "express";
import { getAllNotifications, } from "../controllers/notificationController";
const notificationRouter = Router();
notificationRouter.get("/:p?",getAllNotifications);

export default notificationRouter;