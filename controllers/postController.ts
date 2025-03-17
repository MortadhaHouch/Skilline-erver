import bcrypt from 'bcrypt';
import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { emailRegex } from '../utils/constant';
import { isValidObjectId } from 'mongoose';
import Post from '../models/Post';
import Community from '../models/Community';
dotenv.config();
async function createPost(req:Request,res:Response): Promise<void>{
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
                const community = await Community.findById(id);
                if(community){
                    const {content} = req.body as {content:string};
                    const post = await Post.create({
                        content,
                        author:user._id,
                    })
                    community.posts.push(post._id);
                    await community.save();
                    res.status(200).json({
                        post:{
                            _id:post._id,
                            content:post.content,
                            author:{
                                _id:user._id,
                                firstName:user.firstName,
                                lastName:user.lastName,
                                avatar:user.avatar
                            },
                            createdAt:post.createdAt,
                            updatedAt:post.updatedAt,
                            comments:post.comments,
                            likes:post.likers.length,
                            dislikes:post.dislikers.length
                        }
                    });
                }
            }
        }else{
            res.status(401).json({user_err:"User not found"});
        }
    } catch (error) {
        console.log(error);
    }
}
async function getAllPosts(req:Request,res:Response): Promise<void>{
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
                const community = await Community.findById(id);
                if(community){
                    const page = parseInt(req.params.p as string) || 1;
                    const limit = 10;
                    const skip = (page - 1) * limit;
                    const postsSearch = [];
                    for(let i=0;i<community.posts.slice(skip,skip+limit).length;i++){
                        postsSearch.push(Post.findById(community.posts[i]).populate("author","_id firstName lastName email avatar"));
                    }
                    const posts = await Promise.all(postsSearch);
                    const total = await Post.countDocuments({community:community._id});
                    const totalPages = Math.ceil(total / limit);
                    res.status(200).json({
                        posts:posts.map((p)=>{
                            if(p){
                                const author = p.author as any;
                                return {
                                    _id:p._id,
                                    content:p.content,
                                    author:{
                                        _id:p.author._id,
                                        firstName:author?.firstName,
                                        lastName:author?.lastName,
                                        avatar:author?.avatar,
                                        email:author?.email
                                    },
                                    createdAt:p.createdAt,
                                    updatedAt:p.updatedAt,
                                    comments:p.comments.length,
                                    likes:p.likers.length,
                                    dislikes:p.dislikers.length
                                }
                            }
                        }), 
                        page, 
                        pages:totalPages,
                        total,
                        ok:true
                    });
                }else{
                    res.status(404).json({message:"Community not found"});
                }
            }
        }else{
            res.status(401).json({user_err:"User not found"});
        }
    } catch (error) {
        console.log(error);
    }
}
async function handlePostReaction(req: Request, res: Response): Promise<any> {
    try {
        const auth_token = req.cookies.auth_token;
        if (!auth_token) {
            return res.status(401).json({ token_err: "Unauthorized" });
        }
        const { email } = jwt.verify(auth_token, process.env.SECRET_KEY as string) as { email: string };
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ user_err: "User not found" });
        }

        const { id } = req.params;
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid post ID" });
        }

        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }
        const isLiked = post.likers.includes(user._id);
        const isDisliked = post.dislikers.includes(user._id);

        const { action } = req.body as {action:"like"|"unlike"};
        if (action === "like") {
            if (isDisliked) {
                post.dislikers = post.dislikers.filter((likerId) => likerId.toString() !== user._id.toString());
            }
            if (!isLiked) {
                post.likers.push(user._id);
            } else {
                post.likers = post.likers.filter((likerId) => likerId.toString() !== user._id.toString());
            }
        } else if (action === "unlike") {
            if (isLiked) {
                post.likers = post.likers.filter((likerId) => likerId.toString() !== user._id.toString());
            }
            if (!isDisliked) {
                post.dislikers.push(user._id);
            } else {
                post.dislikers = post.dislikers.filter((likerId) => likerId.toString() !== user._id.toString());
            }
        }

        await post.save();
        res.status(200).json({ likes: post.likers.length, dislikes: post.dislikers.length, ok: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
export {createPost,getAllPosts,handlePostReaction};