import { Router } from "express";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";
import { getAllCommunities, getCommunityById } from "../controllers/communityController";
import { checkAccess } from "../middlewares/checkAccess";

const communityRouter = Router();
communityRouter.get("/",checkUser,getAllCommunities);
communityRouter.get("/:id",checkUser,getCommunityById);
// communityRouter.post("/add",checkUser,checkAdmin,getCommunityById);


export default communityRouter;