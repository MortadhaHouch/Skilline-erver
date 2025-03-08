import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { emailRegex } from '../utils/constant';
import { isValidObjectId } from 'mongoose';
dotenv.config();
async function login(req:Request,res:Response):Promise<any>{
    try {
        const {email,password} = req.body as {email:string,password:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({message:"User not found"});
        }
        const isMatched = await bcrypt.compare(password,user.password);
        if(!isMatched){
            return res.status(401).json({message:"Invalid credentials"});
        }
        const token = jwt.sign(
            {
                id: user._id,
                email: user.email
            },
                process.env.SECRET_KEY as string,
            {
                expiresIn:"7d"
            }
        )
        res.status(200).json({token});
    } catch (error) {
        console.log(error);
    }
}
async function signup(req:Request, res:Response):Promise<any>{
    try {
        const {firstName,lastName,email,password} = req.body as {firstName:string,lastName:string,email:string,password:string};
        const existingUser = await User.findOne({firstName,lastName});
        if(existingUser){
            return res.status(409).json({message:"User already exists"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(409).json({message:"User already exists"});
        }
        if(!firstName ||!lastName){
            return res.status(400).json({message:"First name and last name are required"});
        }
        if(!email){
            return res.status(400).json({message:"Email is required"});
        }
        if(!email.match(emailRegex)){
            return res.status(400).json({message:"Invalid email"});
        }
        if(password.length < 4){
            return res.status(400).json({message:"Password must be at least 4 characters long"});
        }
        const newUser = new User({
            firstName,
            lastName,
            email,
            password
        });
        await newUser.save();
        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email
            },
                process.env.SECRET_KEY as string,
            {
                expiresIn:"7d"
            }
        )
        res.status(201).json({token});
    } catch (error) {
        console.log(error);
    }
}
async function logout(req:Request, res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
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
        const users = await User.find({}).select({
            firstName: 1,
            lastName: 1,
            email: 1,
            isLoggedIn: 1,
            createdAt: 1,
            updatedAt: 1
        }).skip(skip).limit(limit);
        const total = await User.countDocuments();
        const totalPages = Math.ceil(total / limit);
        res.status(200).json({users,page,pages:totalPages});
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
export {login,signup,logout,getUsers,getUser,getUsersFiltered}