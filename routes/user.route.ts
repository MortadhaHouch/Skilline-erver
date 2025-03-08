import { Router } from "express";
import { login, signup,getUser,getUsers,logout, getUsersFiltered } from "../controllers/userController";

const userRouter = Router();
userRouter.post("/login",login)
userRouter.post("/signup",signup)
userRouter.get("/users", getUsers)
userRouter.get("/filter", getUsersFiltered)
userRouter.get("/:id", getUser)
userRouter.post("/logout", logout)
export default userRouter;