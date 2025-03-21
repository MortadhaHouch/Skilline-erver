import { Request, response, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Course from '../models/Course';
import Community from "../models/Community";
dotenv.config();
import fs from "fs"
import path from "path";
import { FileArray } from "express-fileupload";
import { v4 } from "uuid";
import { lookup } from "mime";
import getContentType from "../utils/getFileType";
import Notification from "../models/Notification";
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
async function getCourseById(req:Request,res:Response):Promise<any>{
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            return res.status(400).json({message:"Invalid course id"});
        }
        const course = await Course.findById(id);
        if(!course){
            return res.status(404).json({message:"Course not found"});
        }else{
            return res.status(200).json(course);
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal server error"});
    }
}
async function getCoursesByCommunity(req:Request,res:Response):Promise<any>{
    try {
        const communityId = req.params.id;
        if(!communityId || !isValidObjectId(communityId)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(communityId);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            const page = parseInt(req.params.p)||1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const coursesSearch = []
            for (let i = 0; i < community.courses.slice(skip,skip+limit).length; i++) {
                coursesSearch.push(Course.findById(community.courses[i]).populate("author","_id firstName lastName email avatar"));
            }
            const courses = await Promise.all(coursesSearch);
            const total = community.courses.length;
            const totalPages = Math.ceil(total / limit);
            return res.status(200).json({
                courses:courses.map((c)=>{
                    if(c){
                        const author = c.author as any;
                        return {
                            _id:c._id,
                            title:c.title,
                            description:c.description,
                            resource:c.resource,
                            extra:c.extra,
                            author:{
                                _id:author._id,
                                firstName:author.firstName,
                                lastName:author.lastName,
                                email:author.email,
                                avatar:author.avatar
                            },
                            quizzes:c.quizzes.length,
                            views:c.views
                        }
                    }
                }),
                page,
                pages: totalPages
            });
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal server error"});
    }
}
async function createCourse(req:Request,res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({token_err:"Unauthorized"});
        }else{
            const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if(!user){
                return res.status(401).json({user_err:"Unauthorized"});
            }else{
                if(user.role !== "ADMIN"){
                    return res.status(401).json({role_err:"Unauthorized"});
                }else{
                    const {id} = req.params;
                    if(!id || !isValidObjectId(id)){
                        return res.status(400).json({message:"Invalid Community id"});
                    }else{
                        const community = await Community.findById(id);
                        if(!community){
                            return res.status(404).json({message:"Community not found"});
                        }else {
                            const { title, description } = req.body;
                            if (!title || !description) {
                                return res.status(400).json({ message: "Title and description are required" });
                            }else{
                                const sanitizeFilename = (name: string): string => {
                                    return name.trim().toLowerCase().replace(/["]/g, "");
                                };
                                const sanitizedTitle = title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                const foundCourse = await Course.findOne({ title: { $regex: `^${sanitizedTitle}$`, $options: "i" } });
                                if(foundCourse){
                                    return res.status(400).json({message:"Course already exists"});
                                }else{
                                    const sanitizedCommunityName = sanitizeFilename(community.name);
                                    const sanitizedTitle = sanitizeFilename(title);
                                    const course = new Course({ title:sanitizeFilename(title), description:sanitizeFilename(description), author: user._id });
                                    let files: FileArray | undefined = req.files ?? undefined;
                                    if (files) {
                                        const uploadDir = path.join(__dirname, "..", "uploads", sanitizedCommunityName, sanitizedTitle);
                                        fs.mkdirSync(uploadDir, { recursive: true });
                                        const fileArray = Array.isArray(files) ? files : Object.values(files).flat();
                                        console.log(fileArray);
                                        for (const file of fileArray) {
                                            try {
                                                const filename = v4() + path.extname(file.name);
                                                const filePath = path.join(uploadDir, filename);
                                                await new Promise<void>((resolve, reject) => {
                                                    file.mv(filePath, (err: Error) => {
                                                        if (err) {
                                                            console.error("File upload error:", err);
                                                            reject(err);
                                                        } else {
                                                            resolve();
                                                        }
                                                    });
                                                });
                                                if (fs.existsSync(filePath)) {
                                                    course.resource.push(filename);
                                                }
                                            } catch (err) {
                                                console.error("Error in file upload:", err);
                                            }
                                        }
                                    }
                                    await course.save();
                                    community.courses.push(course._id);
                                    await community.save();
                                    return res.status(200).json({ 
                                        course:{
                                            title:course.title,
                                            description:course.description,
                                            resource:course.resource,
                                            extra:course.extra,
                                            _id:course._id,
                                            author:{
                                                _id:user._id,
                                                firstName:user.firstName,
                                                lastName:user.lastName,
                                                email:user.email,
                                                avatar:user.avatar
                                            },
                                            quizzes:course.quizzes,
                                            views:course.views
                                        } 
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function deleteCourse(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
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
                    const community = await Community.findOne({courses:{$in:[id]}})
                    if(community){
                        const course = await Course.findByIdAndDelete(id);
                        if(!course){
                            res.status(404).json({message:"Course not found"});
                        }
                        await Notification.create({
                            from:user._id,
                            content:`Course ${course?.title} has been deleted successfully`,
                            to:[...community.members.map((m)=>{
                                return {
                                    user:m._id,
                                    read:false
                                }
                            }),{
                                user:community.admin,
                                read:false
                            }],
                        })
                        res.status(200).json({success:"Course deleted successfully"});
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function updateCourse(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"Unauthorized"});
        }else{
            const {communityId,id} = req.params;
            if(!communityId || !isValidObjectId(communityId)){
                res.status(400).json({message:"Invalid community id"});
            }
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid course id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"Community not found"});
            }else{
                if(community.admin.toString() !== user._id.toString()){
                    res.status(403).json({message:"Unauthorized to update course"});
                }else{
                    const {title,description} = req.body as {title:string,description:string};
                    const course = await Course.findById(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        course.title = title;
                        course.description = description;
                        await course.save();
                        res.status(200).json({course});
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function addResource(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"Unauthorized"});
        }else{
            const {communityId,id} = req.params;
            if(!communityId || !isValidObjectId(communityId)){
                res.status(400).json({message:"Invalid community id"});
            }
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid course id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"Community not found"});
            }else{
                if(community.admin.toString() !== user._id.toString()){
                    res.status(403).json({message:"Unauthorized to update course"});
                }else{
                    const {resource} = req.body as {resource:string[]};
                    const course = await Course.findById(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        course.resource = [...course.resource,...resource];
                        await course.save();
                        res.status(200).json({course});
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function updateResources(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"Unauthorized"});
        }else{
            const {communityId,id} = req.params;
            if(!communityId || !isValidObjectId(communityId)){
                res.status(400).json({message:"Invalid community id"});
            }
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid course id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"Community not found"});
            }else{
                if(community.admin.toString() !== user._id.toString()){
                    res.status(403).json({message:"Unauthorized to update course"});
                }else{
                    const {resource,removed,extra} = req.body as {resource?:string[],removed?:string[],extra?:string[]};
                    const course = await Course.findById(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        if(resource){
                            course.resource.push(...resource);
                        }
                        if(extra){
                            course.extra.push(...extra);
                        }
                        if(removed){
                            course.resource = course.resource.filter((r:string) => !removed.includes(r));
                        }
                        await course.save();
                        res.status(200).json({course});
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function bufferFile(req:Request, res:Response):Promise<any> {
    try {
        const { id, resource, communityId } = req.params;
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid course id" });
        }
        const course = await Course.findById(id);
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        const community = await Community.findById(communityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        const filePath = path.join(__dirname, "../uploads", community.name, course.title, resource);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: "File not found" });
        }
        if (!course.resource.includes(resource)) {
            return res.status(404).json({ message: "Resource not found" });
        }
        const fileType = getContentType(resource);
        const fileSize = fs.statSync(filePath).size;

        switch (fileType) {
            case "video/mp4": {
                const range = req.headers.range;
                if (range) {
                    const parts = range.replace(/bytes=/, "").split("-");
                    const start = parseInt(parts[0], 10);
                    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
                    const chunkSize = (end - start) + 1;

                    const head = {
                        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': chunkSize,
                        'Content-Type': 'video/mp4',
                        'Content-Disposition': `inline; filename="${resource}"`,
                        'Cache-Control':"no-store",
                        "Content-Security-Policy": `frame-ancestors 'self' ${process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""}`
                    };

                    res.writeHead(206, head);
                    fs.createReadStream(filePath, { start, end }).pipe(res);
                } else {
                    const head = {
                        'Content-Length': fileSize,
                        'Content-Type': 'video/mp4',
                        'Content-Disposition': `inline; filename="${resource}"`,
                        'Cache-Control':"no-store",
                        "Content-Security-Policy": `frame-ancestors 'self' ${process.env.NODE_ENV === "development" ? "http://localhost:5000" : ""}`
                    };

                    res.writeHead(200, head);
                    fs.createReadStream(filePath).pipe(res);
                }
                break;
            }
            case "application/pdf": {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `inline; filename="${encodeURIComponent(resource)}"`,
                    // Add permissive CORS headers
                    'Access-Control-Allow-Origin': '*',  // Or specify your domain
                    'Access-Control-Allow-Methods': 'GET, OPTIONS',
                    // Remove any X-Frame-Options header if present
                    // And add a permissive Cross-Origin-Embedder-Policy
                    'Cross-Origin-Embedder-Policy': 'unsafe-none',
                    'Cross-Origin-Resource-Policy': 'cross-origin'
                };

                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
                break;
            }
            default: {
                const head = {
                    'Content-Length': fileSize,
                    'Content-Type': fileType,
                    'Content-Disposition': `inline; filename="${resource}"`,
                    'Cache-Control':"no-store",
                    "Content-Security-Policy": `frame-ancestors 'self' ${process.env.NODE_ENV === "development" ? "http://localhost:5173" : ""}`
                };
                res.writeHead(200, head);
                fs.createReadStream(filePath).pipe(res);
            }
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
function getFileType(filename: string){
    const extension = path.extname(filename);
    switch (extension) {
        case "png":
        case "jpg":
        case "jpeg":
        case "gif":
        case "svg":
            return "image/"+filename;
        case "mp4":
            return "video/mp4";
        case "pdf":
            return "application/pdf";
        // case "docx":
        //     return "doc";
        // case "xlsx":
        //     return "excel";
        // case "pptx":
        //     return "ppt";
        default:
            return "application/octet-stream";
    }
}
async function getAllCoursesFiltered(req:Request, res:Response):Promise<any>{
    try{
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(user){
            if(user.role === "ADMIN"){
                const {communityId} = req.params;
                console.log(communityId);
                if(!communityId || !isValidObjectId(communityId)){
                    return res.status(400).json({message:"Invalid community id"});
                }
                const community = await Community.findById(communityId);
                if(!community){
                    return res.status(404).json({message:"Community not found"});
                }
                const filers = req.query;
                const courses = await Course.find({title:{
                    $regex: `^${filers.title}$`,
                    $options: "i"
                }});
                return res.status(200).json({courses});
            }else{
                return res.status(401).json({user_err:"Unauthorized"});
            }
        }else{
            return res.status(401).json({user_err:"Unauthorized"});
        }
    }catch(error){
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
export {getAllCourses,getCourseById,createCourse,deleteCourse,getCoursesByCommunity,updateCourse,updateResources,addResource,bufferFile,getAllCoursesFiltered};