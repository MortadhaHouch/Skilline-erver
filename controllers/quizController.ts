import { Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { isValidObjectId, Types } from 'mongoose';
import Message from '../models/Message';
import Notification from '../models/Notification';
import Course from "../models/Course";
import Community from "../models/Community";
import Quiz from "../models/Quiz";
import { Question } from "../models/Question";
import { getQuizzes } from "../utils/getQuizzes";
dotenv.config();
async function getAllQuizzes(req:Request,res:Response): Promise<void>{
    try{
        const auth_token = req.cookies.auth_token;
        if(!auth_token){
            res.status(401).json({token_err:"Unauthorized"});
        }
        const {email} = jwt.verify(auth_token,process.env.SECRET_KEY as string) as {email:string};
        const user = await User.findOne({email});
        if(!user){
            res.status(401).json({user_err:"User not found"});
        }else{
            const {id,communityId} = req.params;
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid community id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"Course not found"});
            }else{
                if(community.members.includes(user._id)||community.admin.toString() === user._id.toString()){
                    const course = await Course.findById(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        const quizzesSearch = [];
                        const page = parseInt(req.params.p as string) || 1;
                        const limit = 10;
                        const skip = (page - 1) * limit;
                        for(let i=0;i<course.quizzes.slice(skip,skip+limit).length;i++){
                            quizzesSearch.push(Quiz.find(course.quizzes[i]));
                        }
                        const [quizzes] = await Promise.all(quizzesSearch);
                        res.status(200).json({
                            quizzes:quizzes.map((q)=>{
                                return {
                                    _id:q._id,
                                    questions:q.questions,
                                    difficulty:q.difficulty
                                }
                            }),
                            page,
                            course:{
                                _id:course._id,
                                title:course.title
                            },
                            pages:Math.ceil(course.quizzes.length/limit),
                            count:course.quizzes.length
                        });
                    }
                }else{
                    res.status(403).json({message:"Unauthorized to access course"});
                }
            }
        }
    }catch(err){
        console.log(err);
    }
}
async function createQuiz(req: Request, res: Response): Promise<any> {
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
        const { communityId, id } = req.params;
        if (!communityId || !isValidObjectId(communityId)) {
            return res.status(400).json({ message: "Invalid community ID" });
        }
        if (!id || !isValidObjectId(id)) {
            return res.status(400).json({ message: "Invalid course ID" });
        }
        const [community, course] = await Promise.all([
            Community.findById(communityId),
            Course.findById(id),
        ]);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        if (!course) {
            return res.status(404).json({ message: "Course not found" });
        }
        const isAdminOrMember = 
            community.members.includes(user._id) || community.admin.toString() === user._id.toString();
        if (!isAdminOrMember) {
            return res.status(403).json({ message: "Unauthorized to access course" });
        }
        const quiz = await getQuizzes(course.title, 10, "easy") as Array<{
            question: string;
            options: string[];
            correctAnswer: string;
            timer: number;
        }> | undefined;
        if (!quiz || !Array.isArray(quiz)) {
            return res.status(500).json({ message: "Error creating quiz" });
        }
        const newQuiz = await Quiz.create({
            creator: user._id,
            topic: course.title,
        });
        type Question = {
            question: string;
            options: string[];
            correctAnswer: string;
            timer: number;
        };
        const questions = quiz.map((q: Question) => ({
            quiz: newQuiz._id,
            correctAnswer: q.correctAnswer,
            options: q.options,
            time: q.timer,
            question: q.question,
        }));
        const createdQuestions = await Question.insertMany(questions);
        newQuiz.questions = createdQuestions.map((q) => q._id);
        course.quizzes.push(newQuiz._id);
        await Promise.all([newQuiz.save(), course.save()]);
        res.status(200).json({ quiz });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
async function deleteQuiz(req:Request,res:Response): Promise<void>{
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
            const {id,quizId} = req.params;
            if(!id || !isValidObjectId(id)){
                res.status(400).json({message:"Invalid community id"});
            }
            const community = await Community.findById(id);
            if(!community){
                res.status(404).json({message:"Course not found"});
            }else{
                if(community.admin.toString() !== user._id.toString()){
                    const course = await Course.findById(id);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        const quiz = await Quiz.findByIdAndDelete(quizId);
                        if(!quiz){
                            res.status(404).json({message:"Quiz not found"});
                        }else{
                            res.status(200).json({message:"Quiz deleted"});
                        }
                    }
                }else{
                    res.status(403).json({message:"Unauthorized to access course"});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function getQuizById(req:Request,res:Response): Promise<void>{
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
            const {communityId,courseId,quizId} = req.params;
            if(!communityId || !isValidObjectId(communityId)){
                res.status(400).json({message:"Invalid community id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"Course not found"});
            }else{
                if(community.members.includes(user._id)||community.admin.toString() === user._id.toString()){
                    const course = await Course.findById(courseId);
                    if(!course){
                        res.status(404).json({message:"Course not found"});
                    }else{
                        const quiz = await Quiz.findById(quizId);
                        if(!quiz){
                            res.status(404).json({message:"Quiz not found"});
                        }else{
                            const questionsSearch = [];
                            for (let i = 0; i < quiz.questions.length; i++) {
                                questionsSearch.push(Question.findById(quiz.questions[i]));
                            }
                            const questions = await Promise.all(questionsSearch);
                            res.status(200).json({
                                quiz,
                                questions:questions.map((q)=>{
                                    if(q){
                                        return {
                                            question:q.question,
                                            options:q.options,
                                            time:q.time
                                        }
                                    }
                                })
                            });
                        }
                    }
                }else{
                    res.status(403).json({message:"Unauthorized to access course"});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
async function answerQuiz(req:Request,res:Response):Promise<void>{
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
            const {communityId,courseId,quizId} = req.params;
            if(!communityId || !isValidObjectId(communityId)){
                res.status(400).json({message:"Invalid community id"});
            }
            const community = await Community.findById(communityId);
            if(!community){
                res.status(404).json({message:"community not found"});
            }else{
                if(community.members.includes(user._id)||community.admin.toString() === user._id.toString()){
                    const course = await Course.findById(courseId);
                    if(course){
                        const quiz = await Quiz.findById(quizId);
                        if(quiz && course.quizzes.includes(quiz._id)){
                            const questionsSearch = [];
                            const {answers} = req.body as {answers:{answer:string,time:number}[]};
                            for (let i = 0; i < quiz.questions.length; i++) {
                                questionsSearch.push(Question.findById(quiz.questions[i]));
                            }
                            const questions = await Promise.all(questionsSearch);
                            const results:{
                                answer:string,
                                time:number,
                                user:Types.ObjectId,
                                isCorrect:boolean
                            }[] = []
                            if(questions && Array.isArray(questions)){
                                for (let i = 0; i < questions.length; i++) {
                                    const question = questions[i];
                                    if(question){
                                        const result = {
                                            answer:answers[i].answer,
                                            time:answers[i].time,
                                            user:user._id
                                        }
                                        results.push({
                                            answer:answers[i].answer,
                                            time:answers[i].time,
                                            user:user._id,
                                            isCorrect:question.correctAnswer === answers[i].answer
                                        });
                                        question.results.push(result);
                                        if(!question.participators.includes(user._id)){
                                            question.participators.push(user._id);
                                        }
                                        await question.save();
                                    }
                                }
                                await quiz.save();
                            }
                            res.status(200).json({
                                results
                            });
                        }else{
                            res.status(404).json({message:"Quiz not found"});
                        }
                    }else{
                        res.status(404).json({message:"Course not found"});
                    }
                }else{
                    res.status(403).json({message:"Unauthorized to access course"});
                }
            }
        }
    } catch (error) {
        console.log(error);
    }
}
export {getAllQuizzes,createQuiz,getQuizById,deleteQuiz,answerQuiz}