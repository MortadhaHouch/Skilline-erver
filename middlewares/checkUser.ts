import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();
export async function checkUser(req:Request,res:Response,next:NextFunction){
    try {
        if(req.cookies.auth_token){
            const {email} = jwt.verify(req.cookies.auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if(!user){
                res.status(401).json({auth_error:"user not found"})
            }
            next();
        }
    } catch (error) {
        console.log(error);
    }
}