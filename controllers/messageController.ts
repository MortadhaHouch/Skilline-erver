import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Message from '../models/Message';
import Notification from '../models/Notification';
dotenv.config();
async function sendMessage(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"User not found"});
        }else{
            const {message} = req.body as {message:string};
            const {userId} = req.body as {userId:string};
            if(!userId || !isValidObjectId(userId)){
                res.status(400).json({message:"Invalid user id"});
            }
            const userTo = await User.findById(userId);
            if(!userTo){
                res.status(404).json({message:"User not found"});
            }else{
                const messageObj = new Message({content:message,user:user._id,userTo:userTo._id});
                await messageObj.save();
                const notification = new Notification({
                    content:`New message from ${user.firstName} ${user.lastName}`,
                    from:user._id,to:userTo._id
                });
                await notification.save();
                res.status(200).json({message:"Message sent"});
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function getAllMessages(req:Request,res:Response){
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"User not found"});
        }else{
            const page = parseInt(req.params.p as string) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const messages = await Message.find({user:user._id}).sort({createdAt: -1}).skip(skip).limit(limit);
            const updateTasks = [];
            for (const message of messages) {
                message.isRead = true;
                updateTasks.push(
                    message.save()
                );
            }
            await Promise.all(updateTasks);
            const total = await Message.countDocuments({user:user._id});
            const totalPages = Math.ceil(total / limit);
            res.status(200).json({messages,page,pages:totalPages});
        }
    } catch (error) {
        console.log(error);
    }
}
export { sendMessage,getAllMessages}