import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Course from '../models/Course';
dotenv.config();
async function getAllCourses(req:Request,res:Response):Promise<any>{
    try {
        const page = parseInt(req.params.p)||1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const courses = await Course.find({}).skip(skip).limit(limit);
        const total = await Course.countDocuments();
        const totalPages = Math.ceil(total / limit);
        return res.status(200).json({courses, page, pages: totalPages});
    } catch (error) {
        return res.status(500).json({message:"Internal server error"});
    }
}
async function getCourseById(req:Request,res:Response){
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            res.status(400).json({message:"Invalid course id"});
        }
        const course = await Course.findById(id);
        if(!course){
            res.status(404).json({message:"Course not found"});
        }
        res.status(200).json(course);
    } catch (error) {
        console.log(error);
    }
}
async function createCourse(req:Request,res:Response){
    try {
        const auth_token = req.headers.authorization && req.headers.authorization.includes("Bearer") && req.headers.authorization.split(" ").length > 1 && req.headers.authorization?.split(" ")[1];
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }else{
            const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if(!user){
                res.status(401).json({user_err:"Unauthorized"});
            }else{
                if(user.role !== "ADMIN"){
                    res.status(401).json({role_err:"Unauthorized"});
                }else{
                    const {title,description,resource} = req.body as {title:string,description:string,resource:string};
                    const course = await Course.create({title,description,resource,author:user._id});
                    console.log(req.files);
                    res.status(200).json({course});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function deleteCourse(req:Request,res:Response){
    try {
        const auth_token = req.headers.authorization && req.headers.authorization.includes("Bearer") && req.headers.authorization.split(" ").length > 1 && req.headers.authorization?.split(" ")[1];
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        } else{
            const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if(!user){
                res.status(401).json({user_err:"Unauthorized"});
            }else{
                if(user.role !== "ADMIN"){
                    res.status(401).json({role_err:"Unauthorized"});
                }else{
                    const {id} = req.params;
                    if(!id || !isValidObjectId(id)){
                        res.status(400).json({message:"Invalid course id"});
                    }
                    const course = await Course.findByIdAndDelete(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }
                    res.status(200).json({message:"Course deleted successfully"});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
export {getAllCourses,getCourseById,createCourse,deleteCourse};