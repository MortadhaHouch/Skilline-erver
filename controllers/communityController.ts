import { Request, Response } from "express";
import dotenv from "dotenv";
import { isValidObjectId } from 'mongoose';
import Community from '../models/Community';
dotenv.config();
async function getAllCommunities(req:Request,res:Response):Promise<any>{
    try {
        const page = parseInt(req.params.p)||1;
        const limit = 10;
        const skip = (page - 1) * limit;
        const communities = await Community.find({}).skip(skip).limit(limit);
        const communitiesPerMonth = await Community.aggregate([
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
        ])
        const total = await Community.countDocuments();
        res.status(200).json({
            communities,
            page,
            pages:Math.ceil(total/limit),
            communitiesPerMonth
        })
    } catch (error) {   
        console.log(error);
    }
}

async function getCommunityById(req:Request,res:Response):Promise<any>{
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            return res.status(400).json({message:"Invalid community id"});
        }
        const community = await Community.findById(id);
        if(!community){
            return res.status(404).json({message:"Community not found"});
        }
        res.status(200).json(community);
    } catch (error) {
        console.log(error);
    }
}
async function createCommunity(req:Request,res:Response):Promise<any>{
    try {
        const community = new Community(req.body);
        await community.save();
        res.status(201).json(community);
    } catch (error) {
        console.log(error);
    }
}
export {getAllCommunities,getCommunityById,createCommunity}