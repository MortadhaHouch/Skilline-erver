import { Router } from "express";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";
import { createCommunity, deleteCommunity, getAllCommunities, getCommunityById, updateCommunity,toggleAcceptRequest,sendRequest,getAllRequests } from "../controllers/communityController";

const communityRouter = Router();
communityRouter.get("/",checkUser,getAllCommunities);
communityRouter.get("/:id",checkUser,getCommunityById);
communityRouter.post("/add",checkUser,checkAdmin,createCommunity);
communityRouter.put("/edit/:id",checkUser,checkAdmin,updateCommunity);
communityRouter.delete("/:id",checkUser,checkAdmin,deleteCommunity);
communityRouter.get("/requests/:id", checkUser, checkAdmin, getAllRequests);
communityRouter.post("/accept-request/:id/:userId", checkUser, checkAdmin, toggleAcceptRequest);
communityRouter.post("/send-request/:id", checkUser, sendRequest);


export default communityRouter;