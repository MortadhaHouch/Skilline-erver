import { Request, Response } from "express";
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Community from '../models/Community';
import jwt from "jsonwebtoken"
import User from "../models/User";
import Accept from "../models/Accept"
import Notification from "../models/Notification";
import { Question } from "../models/Question";
import Post from "../models/Post";
import Comment from "../models/Comment";
import Quiz from "../models/Quiz";
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
            if(user.role === "ADMIN"){
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
            }else{
                const communities = await Community.find({members:{$in:user._id}}).skip(skip).limit(limit);
                // const skillBasedCommunities = await Community.find({name:{$in:user.interests}})
                const likedPosts = await Post.countDocuments({likers:{$in:user._id}});
                const dislikedPosts = await Post.countDocuments({dislikers:{$in:user._id}});
                const totalComments = await Comment.countDocuments({author:user._id});
                const quizzes = await Quiz.countDocuments({participators:{$in:[user._id]}});
                return res.status(200).json({
                    communities:communities.map((c)=>{
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
                    }),
                    likedPosts,
                    dislikedPosts,
                    totalComments,
                    quizzes
                })
            }
        }
    } catch (error) {   
        console.log(error);
        return res.status(500).json({message:"Server error"});
    }
}
async function getMembers(req:Request,res:Response):Promise<any>{
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
            const {p} = req.params || 10;
            const limit = 10;
            const skip = (parseInt(p) - 1) * limit;
            const members = await User.find({
                _id:{$in:community.members}
            }).skip(skip).limit(limit);
            return res.status(200).json({
                members:members.map((m)=>{
                    if(m){
                        return {
                            _id:m._id,
                            firstName:m.firstName,
                            lastName:m.lastName,
                            email:m.email,
                            avatar:m.avatar||"",
                            role:m.role,
                            createdAt:m.createdAt,
                            bio:m.bio,
                            interests:m.interests,
                            index:m.index
                        }
                    }
                }),
                page:parseInt(p),
                pages:Math.ceil(community.members.length/limit),
                total:community.members.length,
            });
        }
    }catch (e) {
        console.log(e);
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
                    posts: community.posts.length,
                    ok:true
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
            success:"Community created successfully",
            community:{
                name: newCommunity.name,
                description: newCommunity.description,
                _id:newCommunity._id,
                admin:user._id,
                members:newCommunity.members.length,
                posts:newCommunity.posts.length,
                logo: newCommunity.logo||"",
                banner: newCommunity.banner||"",
                courses: newCommunity.courses.length,
            }
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
                const notification = await Notification.create({
                    from:user._id,
                    content:`The community ${community.name} has been deleted successfully`,
                    to:community.members.map((m)=>{
                        return {
                            to:m._id,
                            read:false
                        }
                    })
                })
                await community.deleteOne();
                res.status(200).json({success:"Community deleted successfully"});
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
                        const requests = await Accept.find(query).skip(skip).limit(limit).select({user:1,status:1}).populate("user","firstName lastName email avatar _id");
                        const total = await Accept.countDocuments(query);
                        res.status(200).json({
                            requests:requests.map((r)=>{
                                return {
                                    from:r.user,
                                    status:r.status,
                                    _id:r._id
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
                    res.status(200).json({success:"Request sent successfully"});
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
                const request = Accept.findOne({community:community._id,user:userId});
                const userRequest = User.findById(userId);
                const [foundUser,foundRequest] = await Promise.all([userRequest,request]);
                if(foundRequest && foundUser){
                    const {accept} = req.body as {accept:boolean};
                    const notification = new Notification({
                        from: user._id,
                        to: [{
                            user:foundUser._id,
                        }],
                    })
                    if(!accept){
                        notification.content = `Request to join ${community.name} Declined`;
                        await notification.save();
                        await foundUser.save();
                        await foundRequest.deleteOne();
                        return res.status(200).json({message:"Request declined successfully",ok:false});
                    }else{
                        if(!community.members.includes(foundUser._id)){
                            community.members.push(foundUser._id);
                            notification.content = `Request to join ${community.name} Accepted`;
                            await notification.save();
                            await community.save();
                            await foundUser.save();
                            await foundRequest.deleteOne();
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
async function leaderBoard(req: Request, res: Response): Promise<any> {
    try {
        const auth_token = req.cookies.auth_token;
        if (!auth_token) {
            return res.status(401).json({ message: "No token provided" });
        }

        const { email } = jwt.verify(auth_token, process.env.SECRET_KEY as string) as { email: string };
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }
        const { id } = req.params;
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid community id" });
        }

        const community = await Community.findById(id);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        const userRecords = (await Question.find({})).filter((question) => {
            return community.members.filter((member) => {
                return question.participators.find((m) => m.toString() === member.toString()) !== null;
            });
        });
        const userResults = userRecords.map((record) => {
            return {
                count: record.results.filter((result) => {
                    const foundRecord = record.participators.find((p) => p.toString() === result.user.toString());
                    if (foundRecord) {
                        return result.user.toString() === foundRecord.toString();
                    }
                    return false;
                }),
                accuracy: record.results.filter((result) => {
                    const foundRecord = record.participators.find((p) => p.toString() === result.user.toString());
                    if (foundRecord) {
                        return result.user.toString() === foundRecord.toString();
                    }
                    return false;
                }).filter((result) => {
                    return result.answer === record.correctAnswer;
                }),
            };
        });
        const resultsMap = new Map<string, { accuracy: number; count: number }>();
        for (let i = 0; i < userResults.length; i++) {
            const element = userResults[i];
            for (let j = 0; j < element.accuracy.length; j++) {
                const userId = element.accuracy[j].user.toString();
                const currentStats = resultsMap.get(userId) || { accuracy: 0, count: 0 };
                resultsMap.set(userId, {
                    accuracy: currentStats.accuracy + 1,
                    count: currentStats.count + 1,
                });
            }
            for (let j = 0; j < element.count.length; j++) {
                const userId = element.count[j].user.toString();
                const currentStats = resultsMap.get(userId) || { accuracy: 0, count: 0 };
                resultsMap.set(userId, {
                    accuracy: currentStats.accuracy,
                    count: currentStats.count + 1,
                });
            }
        }
        const leaderboard = Array.from(resultsMap.entries()).map(([userId, stats]) => ({
            userId,
            accuracy: stats.accuracy,
            count: stats.count,
            score: stats.accuracy,
        })).sort((a, b) => b.score - a.score);
        const searchTasks = [];
        for (const element of leaderboard) {
            searchTasks.push(User.findById(element.userId));
        }
        const users = await Promise.all(searchTasks);
        return res.status(200).json({
            leaderboard:users.filter((i)=>i!==null).map((u)=>{
                return {
                    score:leaderboard.find((e)=>e.userId === u.id.toString())?.score,
                    accuracy:leaderboard.find((e)=>e.userId === u.id.toString())?.accuracy,
                    count:leaderboard.find((e)=>e.userId === u.id.toString())?.count,
                    _id:u._id,
                    firstName:u.firstName,
                    lastName:u.lastName,
                    avatar:u.avatar,
                    email:u.email,
                    isMe:u.id.toString() === user.id.toString(),
                }
            }),
            resultsMap,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "An error occurred" });
    }
}

export {getAllCommunities,getMembers,getCommunityById,createCommunity,updateCommunity,deleteCommunity,toggleAcceptRequest,sendRequest,getAllRequests,leaderBoard}