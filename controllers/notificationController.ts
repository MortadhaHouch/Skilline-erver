import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { emailRegex } from '../utils/constant';
import { isValidObjectId } from 'mongoose';
import Notification from '../models/Notification';

dotenv.config();
async function getAllNotifications(req:Request, res:Response): Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }else{
            const page = parseInt(req.params.p as string) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const notifications = await Notification.find({
                "to.user":user._id
            }).populate({
                path:"from",
                select:"firstName lastName email _id avatar"
            }).skip(skip).limit(limit).sort({ createdAt: -1 });            
            const total = await Notification.countDocuments(
                {
                    "to.user":user._id
                }
            );
            const totalPages = Math.ceil(total / limit);
            return res.status(200).json({
                notifications:notifications.map((n)=>{
                    if(n){
                        const from = n.from as any;
                        return {
                            _id:n._id,
                            from:{
                                _id:from._id,
                                firstName:from.firstName,
                                lastName:from.lastName,
                                email:from.email,
                                avatar:from.avatar
                            },
                            to:n.to,
                            content:n.content,
                            createdAt:n.createdAt
                        };
                    }
                }),
                page,
                pages:totalPages,
                count:totalPages
            });
        }
    } catch (error) {
        console.log(error);
    }
}
export {getAllNotifications}