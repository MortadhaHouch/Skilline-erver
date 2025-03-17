import { Request, Response } from "express";
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Community from '../models/Community';
import jwt from "jsonwebtoken"
import User from "../models/User";
import Accept from "../models/Accept"
import Notification from "../models/Notification";
dotenv.config();
async function getAllCommunities(req:Request,res:Response):Promise<any>{
    try {
        const page = parseInt(req.params.p)||1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }else{

            const communities = await Community.find({}).skip(skip).limit(limit);
            const administratedCommunities = await Community.find({
                admin:user._id
            }).select({members:1})
            const enrolledStudents = administratedCommunities.map((c)=>{
                return {
                    members:c.members.length
                }
            }).reduce((acc,c)=>{
                return acc + c.members
            },0)
            const coursesCount = (await Community.find({}).select({courses:1})).map((c)=>{
                return {
                    courses:c.courses.length
                }
            }).reduce((acc,c)=>{return acc + c.courses},0)
            const communitiesPerMonth = await Community.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: "$createdAt" },
                            month: { $month: "$createdAt" },
                            day: { $dayOfMonth: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                {
                    $sort: { "_id.year": 1, "_id.month": 1 }
                }
            ])
            const total = await Community.countDocuments();
            const mappedCommunities = communities.map((c)=>{
                return {
                    name: c.name,
                    description: c.description,
                    isMember:c.members.includes(user._id),
                    totalMembers:c.members.length,
                    isAdmin:c.admin.toString() === user._id.toString(),
                    _id:c._id,
                    createdAt:c.createdAt,
                    updatedAt:c.updatedAt,
                    members:c.members.length,
                    courses:c.courses.length,
                    posts:c.posts.length
                }
            })
            return res.status(200).json({
                communities:mappedCommunities,
                page,
                pages:Math.ceil(total/limit),
                communitiesPerMonth,
                studentsCount:enrolledStudents,
                communitiesCount:administratedCommunities.length,
                coursesCount
            })
        }
    } catch (error) {   
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
}

async function getCommunityById(req:Request,res:Response):Promise<any>{
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            const admin = await User.findById(community.admin);
            if(admin){
                const {_id,firstName,lastName,email,role,avatar,isLoggedIn,index} = admin;
                return res.status(200).json({
                    name: community.name,
                    description: community.description,
                    admin:{
                        _id,
                        firstName,
                        lastName,
                        email,
                        role,
                        avatar,
                        isLoggedIn,
                        index,
                    },
                    _id: community._id,
                    courses: community.courses.length,
                    createdAt: community.createdAt,
                    updatedAt: community.updatedAt,
                    members: community.members.length,
                    posts: community.posts.length
                });
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
}
async function createCommunity(req:Request,res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const {name,description} = req.body as {name:string,description:string};
        const community = await Community.findOne({
            name,
        });
        if(community){
            return res.status(400).json({message:"Community already exists"});
        }
        const newCommunity = new Community({
            name,
            description,
            admin: user._id,
        });
        await newCommunity.save();
        res.status(201).json({
            message:"Community created successfully",
            name: newCommunity.name,
            description: newCommunity.description,
            id:newCommunity._id
        });
    } catch (error) {
        console.log(error);
    }
}
async function updateCommunity(req:Request,res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const {id} = req.params;
        if(!id ||!isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            if(community.admin.toString() === user._id.toString()){
                const {name,description} = req.body as {name?:string,description?:string};
                const communityByName = await Community.findOne({name});
                if(communityByName){
                    return res.status(400).json({message:"Community name already exists"});
                }
                if(name){
                    community.name = name;
                }
                if(description){
                    community.description = description;
                }
                const notification = await Notification.create({
                    user:user._id,
                    message:`The community ${community.name} has been updated successfully`,
                    to:[community.members.map((m)=>{
                        return {
                            to:m._id,
                            read:false
                        }
                    })]
                })
                await community.save();
                res.status(200).json({
                    message:"Community updated successfully",
                    name: community.name,
                    description: community.description,
                    id: community._id
                });
            }else{
                return res.status(403).json({message:"Unauthorized to update community"});
            }
        }
    } catch (error) {
        console.log(error);
    }
}

async function deleteCommunity(req:Request,res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const {id} = req.params;
        if(!id ||!isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            if(community.admin.toString() === user._id.toString()){
                await community.deleteOne();
                const notification = await Notification.create({
                    from:user._id,
                    content:`The community ${community.name} has been deleted successfully`,
                    to:[community.members.map((m)=>{
                        return {
                            to:m._id,
                            read:false
                        }
                    })]
                })
                res.status(200).json({message:"Community deleted successfully"});
            }else{
                return res.status(403).json({message:"Unauthorized to delete community"});
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function getAllRequests(req:Request,res:Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"invalid credentials"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }else{
            const {id} = req.params;
            if(!id ||!isValidObjectId(id)){
                return res.status(400).json({message:"Invalid community id"});
            }else{
                const community = await Community.findById(id);
                if(!community){
                    return res.status(404).json({message:"Community not found"});
                }else{
                    if(community.admin.toString() !== user._id.toString()){
                        return res.status(403).json({message:"Unauthorized to view requests"});
                    }else{
                        const page = parseInt(req.params.p)||1;
                        const limit = 10;
                        const skip = (page - 1) * limit;
                        const query = {community:community._id};
                        const requests = await Accept.find(query).skip(skip).limit(limit).select({user:1,status:1}).populate({
                            path:"user",
                            select:["firstName","lastName"]
                        });
                        const total = await Accept.countDocuments(query);
                        res.status(200).json({
                            requests:requests.map((r)=>{
                                return {
                                    user:r.user,
                                    status:r.status
                                }
                            })
                            ,total
                        });
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function sendRequest(req: Request, res: Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const {id} = req.params;
        if(!id ||!isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            if(community.admin.toString() === user._id.toString()){
                return res.status(403).json({message:"Unauthorized to send request"});
            }else{
                const request = await Accept.findOne({community:community._id,user:user._id});
                if(request){
                    return res.status(400).json({message:"Request already sent"});
                }else{
                    const response = await Accept.create({community:community._id,user:user._id});
                    const notification = await Notification.create({
                        from:user._id,
                        content:`Request sent to join ${community.name}`,
                        to:[{user:community.admin}]
                    });
                    res.status(200).json({message:"Request sent successfully"});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function toggleAcceptRequest(req: Request, res: Response):Promise<any>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({message:"No token provided"});
        }
        const {email} = jwt.verify(auth_token, process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            return res.status(401).json({message:"User not found"});
        }
        const {id,userId} = req.params;
        if(!id ||!isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }else{
            if(community.admin.toString() === user._id.toString()){
                const request = Accept.findOne({community:community._id,user:user._id});
                const userRequest = User.findById(userId);
                const [foundUser,foundRequest] = await Promise.all([userRequest,request]);
                if(foundRequest && foundUser){
                    const {accept} = req.body as {accept:boolean};
                    const notification = new Notification({
                        from: user._id,
                        to: foundUser._id,
                    })
                    if(!accept){
                        foundRequest.status = "REJECTED";
                        notification.content = `Request to join ${community.name} Declined`;
                        await notification.save();
                        await foundUser.save();
                        return res.status(200).json({message:"Request declined successfully",ok:true});
                    }else{
                        if(!community.members.includes(foundUser._id)){
                            foundRequest.status = "ACCEPTED";
                            community.members.push(foundUser._id);
                            notification.content = `Request to join ${community.name} Accepted`;
                            await notification.save();
                            await community.save();
                            await foundUser.save();
                            return res.status(200).json({message:"Request accepted successfully",ok:true});
                        }else{
                            return res.status(403).json({message:"User already in community"});
                        }
                    }
                }else{
                    return res.status(400).json({message:"Request not found"});
                }
            }else{
                return res.status(403).json({message:"Unauthorized to accept request"});
            }
        }
    } catch (error) {
        console.log(error);
    }
}
export {getAllCommunities,getCommunityById,createCommunity,updateCommunity,deleteCommunity,toggleAcceptRequest,sendRequest,getAllRequests}