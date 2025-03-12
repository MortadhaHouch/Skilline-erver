import {Router} from "express";
import { createCourse, deleteCourse, getAllCourses, getCourseById } from "../controllers/courseController";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";
import { checkAccess } from "../middlewares/checkAccess";

const courseRouter = Router();
courseRouter.get("/",checkUser,checkAccess,getAllCourses);
courseRouter.get("/:id",checkUser,checkAccess,getCourseById);
courseRouter.post("/add",checkUser,checkAccess,checkAdmin,createCourse);
courseRouter.delete("/delete/:id",checkUser,checkAccess,checkAdmin,deleteCourse);
export default courseRouter;