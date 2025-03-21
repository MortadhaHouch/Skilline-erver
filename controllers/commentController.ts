import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { emailRegex } from '../utils/constant';
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post';
import Community from '../models/Community';
import Comment from '../models/Comment';
dotenv.config();
async function createComment(req:Request,res:Response): Promise<void>{
    try {
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if (user) {
            const {id} = req.params;
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid community id"});
            }else{
                const post = await Post.findById(id);
                if(post){
                    const {content} = req.body as {content:string};
                    const comment = await Comment.create({
                        content,
                        author:user._id,
                    })
                    post.comments.push(comment._id);
                    await post.save();
                    res.status(200).json({comment:{_id:comment._id,content:comment.content,from:{_id:user._id,firstName:user.firstName,lastName:user.lastName,email:user.email}}});
                }else{
                    res.status(404).json({message:"Post not found"});
                }
            }
        }else{
            res.status(401).json({user_err:"User not found"});
        }
    } catch (error) {
        console.log(error);
    }
}
async function getAllComments(req: Request, res: Response):Promise<any> {
    try {
        const {id} = req.params;
        if(!id || !isValidObjectId(id)){
            res.status(400).json({message:"Invalid community id"});
        }else{
            const page = parseInt(req.params.p as string) || 1;
            const limit = 10;
            const skip = (page - 1) * limit;
            const post = await Post.findById(id);
            if(post){
                const searchTasks = [];
                for (let index = 0; index < post?.comments.slice(skip,skip+limit).length; index++) {
                    searchTasks.push(Comment.findById(post.comments[index]).populate("author","firstName lastName email avatar _id"));
                }
                const comments = await Promise.all(searchTasks);
                const total = await Comment.countDocuments({post:post._id});
                const totalPages = Math.ceil(total / limit);
                res.status(200).json({
                    comments:comments.map((c)=>{
                        if(c){
                            const author = c.author as any;
                            return {
                                _id:c._id,
                                content:c.content,
                                from:{
                                    _id:author._id,
                                    firstName:author.firstName,
                                    lastName:author.lastName,
                                    email:author.email
                                }
                            }
                        }
                    }),
                    page,
                    pages:totalPages,total
                });
            }else{
                res.status(404).json({message:"Post not found"});
            }
            if(post){
                res.status(200).json({comments:post.comments});
            }else{
                res.status(404).json({message:"Post not found"});
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function updateComment(req:Request,res:Response):Promise<any>{
    try{
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({token_err:"Unauthorized"});
        }else{
            const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if (user) {
                const {id} = req.params;
                if(!id || !isValidObjectId(id)){
                    return res.status(400).json({message:"Invalid community id"});
                }else{
                    const {postId} = req.params;
                    const post = await Post.findById(postId);
                    if(post){
                        const {content} = req.body as {content:string};
                        const comment = await Comment.findById(id);
                        if(comment){
                            if(comment.author.toString() !== user._id.toString()){
                                return res.status(401).json({message:"Unauthorized"});
                            }else{
                                comment.content = content;
                                await comment.save();
                                return res.status(200).json({comment:{_id:comment._id,content:comment.content,author:{_id:user._id,firstName:user.firstName,lastName:user.lastName,email:user.email}}});
                            }
                        }else{
                            return res.status(404).json({message:"Comment not found"});
                        }
                    }else{
                        return res.status(404).json({message:"Post not found"});
                    }
                }
            }else{
                return res.status(401).json({user_err:"User not found"});
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal server error"});
    }
}

async function deleteComment(req:Request,res:Response):Promise<any>{
    try{
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            return res.status(401).json({token_err:"Unauthorized"});
        }else{
            const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
            const user = await User.findOne({email});
            if (user) {
                const {id} = req.params;
                if(!id || !isValidObjectId(id)){
                    return res.status(400).json({message:"Invalid community id"});
                }else{
                    const {postId} = req.params;
                    const post = await Post.findById(postId);
                    if(post){
                        const comment = await Comment.findById(id);
                        if(comment){
                            if(comment.author.toString() !== user._id.toString()){
                                return res.status(401).json({message:"Unauthorized"});
                            }else{
                                await Comment.findByIdAndDelete(id);
                                return res.status(200).json({message:"Comment deleted"});
                            }
                        }else{
                            return res.status(404).json({message:"Comment not found"});
                        }
                    }else{
                        return res.status(404).json({message:"Post not found"});
                    }
                }
            }else{
                return res.status(401).json({user_err:"User not found"});
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({message:"Internal server error"});
    }
}
export {createComment,getAllComments,deleteComment,updateComment};