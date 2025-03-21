import { Router } from "express";
import { login, signup,getUser,getUsers,logout, getUsersFiltered, getStats, updateUser } from "../controllers/userController";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";

const userRouter = Router();
userRouter.post("/login",login)
userRouter.post("/signup",signup)
userRouter.get("/users", checkUser,checkAdmin,getUsers)
userRouter.get("/filter",checkUser,checkAdmin, getUsersFiltered)
userRouter.get("/stats",checkUser, getStats);
userRouter.get("/:id",checkUser,checkAdmin, getUser)
userRouter.put("/:id",checkUser,checkAdmin, updateUser)
userRouter.post("/logout",checkUser, logout)
export default userRouter;