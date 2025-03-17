import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { emailRegex } from '../utils/constant';
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Community from '../models/Community';
import Quiz from '../models/Quiz';
import Notification from '../models/Notification';
dotenv.config();
async function login(req:Request,res:Response):Promise<any>{
    try {
        const {email,password} = req.body as {email:string,password:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({email_message:"User not found"});
        }
        const isMatched = await bcrypt.compare(password,user.password);
        if(!isMatched){
            return res.status(401).json({password_message:"Invalid credentials"});
        }
        const token = jwt.sign(
            {
                email:user.email,
                role:user.role,
                _id:user._id,
            },
                process.env.SECRET_KEY as string,
            {
                expiresIn:"7d"
            }
        )
        user.isLoggedIn = true;
        await user.save();
        return res.status(200).json({
            token,
            user:{
                firstName:user.firstName,
                lastName:user.lastName,
                email:user.email,
                avatar:user.avatar||""
            }
        });
    } catch (error) {
        console.log(error);
    }
}
async function signup(req:Request, res:Response):Promise<any>{
    try {
        const {firstName,lastName,email,password} = req.body as {firstName:string,lastName:string,email:string,password:string};
        const existingUser = await User.findOne({firstName,lastName});
        if(existingUser){
            return res.status(409).json({user_message:"User already exists"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(409).json({email_message:"User already exists"});
        }
        if(!firstName ||!lastName){
            return res.status(400).json({user_message:"First name and last name are required"});
        }
        if(!email){
            return res.status(400).json({email_message:"Email is required"});
        }
        if(!email.match(emailRegex)){
            return res.status(400).json({email_message:"Invalid email"});
        }
        if(password.length < 4){
            return res.status(400).json({password_message:"Password must be at least 4 characters long"});
        }
        const latestUserIndex = await User.find({}).sort({index:-1}).limit(1).select({index:1});
        const index = latestUserIndex.length > 0 ? latestUserIndex[0].index + 1 : 1;
        const newUser = new User({
            firstName,
            lastName,
            email,
            password,
            index,
            role:index > 10 ? "USER" : "ADMIN",
            isLoggedIn: true
        });
        await newUser.save();
        const token = jwt.sign(
            {
                email:newUser.email,
                role:newUser.role,
                _id:newUser._id,
            },
                process.env.SECRET_KEY as string,
            {
                expiresIn:"7d"
            }
        )
        return res.status(200).json({
            token,
            user:{
                firstName:newUser.firstName,
                lastName:newUser.lastName,
                email:newUser.email,
                avatar:newUser.avatar||""
            }
        });
    } catch (error) {
        console.log(error);
    }
}
async function logout(req:Request, res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({auth_message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({user_message:"User not found"});
        }
        user.isLoggedIn = false;
        await user.save();
        res.status(200).json({message:"Logout successful"});
    } catch (error) {
        console.log(error);
    }
}
async function getUser(req:Request, res:Response):Promise<any>{
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            return res.status(400).json({message:"Invalid user id"});
        }
        const user = await User.findById(id).select({
            firstName: 1,
            lastName: 1,
            email: 1,
            isLoggedIn: 1,
            createdAt: 1,
            updatedAt: 1
        });
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        res.status(200).json(user);
    } catch (error) {
        console.log(error);
    }
}
async function getUsers(req:Request, res:Response):Promise<any>{
    try {
        const page = parseInt(req.params.p as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({auth_message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({user_message:"User not found"});
        }
        const users = await User.find({role:"USER"}).select({
            firstName: 1,
            lastName: 1,
            email: 1,
            isLoggedIn: 1,
            createdAt: 1,
            updatedAt: 1,
            index:1
        }).skip(skip).limit(limit);
        const usersPerMonth = await User.aggregate([
            {
                $match: { role: "USER" }
            },
            {
                $group: {
                    _id: {
                        // year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        // day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        const total = await User.countDocuments();
        const notificationsCount = await Notification.countDocuments(
            {
                "to.user":user._id
            }
        );
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            users,
            page,
            pages:totalPages,
            usersPerMonth,
            notifications:notificationsCount
        });
    } catch (error) {
        console.log(error);
    }
}
async function getUsersFiltered(req:Request, res:Response):Promise<any>{
    try {
        const page = parseInt(req.params.p as string) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const {firstName,lastName,isLoggedIn} = req.query;
        const users = await User.find(
            Object.keys(req.query).length > 0 ?
            {
                firstName:{
                    $regex:new RegExp(firstName as string,"i")
                },
                lastName:{
                    $regex:new RegExp(lastName as string,"i")
                },
                isLoggedIn:isLoggedIn!==undefined?true:false,
            }:
            {}
        ).select({
            firstName: 1,
            lastName: 1,
            email: 1,
            isLoggedIn: 1,
            createdAt: 1,
            updatedAt: 1
        }).skip(skip).limit(limit);
        const total = await User.countDocuments();
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({
            users:users.map((u)=>{
                return {
                    id:u._id,
                    firstName:u.firstName,
                    lastName:u.lastName,
                    email:u.email,
                    isLoggedIn:u.isLoggedIn,
                    createdAt:u.createdAt.toLocaleDateString(),
                    updatedAt:u.updatedAt.toLocaleDateString()
                }
            }),
            page,
            pages:totalPages
        });
    } catch (error) {
        console.log(error);
    }
}
async function getStats(req:Request, res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({auth_message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({user_message:"User not found"});
        }
        const postsCount = await Post.countDocuments({author:user._id});
        const mostRelevantPosts = await Post.find({author:user._id}).select({likes:1,dislikes:1,comments:1}).sort({likes:-1}).limit(5);
        const likedPosts = await Post.countDocuments({likers:{$in:[user._id]}});
        const dislikedPosts = await Post.countDocuments({dislikers:{$in:[user._id]}});
        const latestPosts = await Post.find({author:user._id}).sort({createdAt:-1}).limit(5);
        const comments = await Comment.countDocuments({author:user._id});
        const administratedCommunities = await Community.countDocuments({admin:user._id});
        const communities = await Community.countDocuments({members:{$in:[user._id]}});
        const createdQuizzes = await Quiz.countDocuments({creator:user._id});
        const challenges = await Quiz.aggregate([
            {
                $match:{
                    $or:[
                        {participators:{$in:[user._id]}},
                        {creator:user._id}
                    ]
                }
            },
            {
                $group: {
                    _id: {
                        // year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        // day: { $dayOfMonth: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
        ]);
        const userData = {
            firstName:user.firstName,
            lastName:user.lastName,
            email:user.email,
            avatar:user.avatar||"",
            bio:user.bio||"",
            role:user.role,
            isLoggedIn:user.isLoggedIn,
            createdAt:user.createdAt.toLocaleDateString(),
            updatedAt:user.updatedAt.toLocaleDateString(),
            interests:user.interests,
            index:user.index,
            stats:{
                posts:postsCount,
                latestPosts,
                comments:comments,
                mostRelevantPosts,
                dislikedPosts,
                likedPosts,
                administratedCommunities,
                communities,
                createdQuizzes,
                challenges
            }
        }
        res.status(200).json({data:userData});
    } catch (error) {
        console.log(error);
        res.status(500).json({message:"Internal server error"});
    }
}
export {login,signup,logout,getUsers,getUser,getUsersFiltered,getStats}