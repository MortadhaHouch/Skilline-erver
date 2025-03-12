import { Router } from "express";
import { login, signup,getUser,getUsers,logout, getUsersFiltered } from "../controllers/userController";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";

const userRouter = Router();
userRouter.post("/login",login)
userRouter.post("/signup",signup)
userRouter.get("/users", checkUser,checkAdmin,getUsers)
userRouter.get("/filter",checkUser,checkAdmin, getUsersFiltered)
userRouter.get("/:id",checkUser,checkAdmin, getUser)
userRouter.post("/logout",checkUser, logout)
export default userRouter;