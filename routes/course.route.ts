import {Router} from "express";
import { createCourse, deleteCourse, getAllCourses, getCourseById, getCoursesByCommunity,addResource,updateResources,updateCourse,bufferFile, getAllCoursesFiltered } from "../controllers/courseController";
import { checkUser } from "../middlewares/checkUser";
import { checkAdmin } from "../middlewares/checkAdmin";

const courseRouter = Router();
courseRouter.get("/",checkUser,getAllCourses);
courseRouter.get("/:communityId/filter",checkUser,getAllCoursesFiltered);
courseRouter.get("/by-community/:id",checkUser,getCoursesByCommunity);
courseRouter.get("/:id",checkUser,getCourseById);

courseRouter.get("/file/:communityId/:id/:resource", checkUser, bufferFile);
courseRouter.post("/add/:id",checkUser,checkAdmin,createCourse);
courseRouter.put("/update/:communityId/:id",checkUser,checkAdmin,updateCourse);
courseRouter.put("/update-resources/:communityId/:id",checkUser,checkAdmin,updateResources);
courseRouter.put("/add-resource/:communityId/:id",checkUser,checkAdmin,addResource);
courseRouter.delete("/delete/:id",checkUser,checkAdmin,deleteCourse);
export default courseRouter;