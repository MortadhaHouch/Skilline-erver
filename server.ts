import express, { NextFunction, Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";
import userRouter from "./routes/user.route";
import connectToDB from "./config/connect";
import fileUpload from "express-fileupload";
import courseRouter from "./routes/course.route";
import communityRouter from "./routes/community.route";
import { rateLimit } from 'express-rate-limit'
import messageRouter from "./routes/message.route";
import notificationRouter from "./routes/notification.route";
import postRouter from "./routes/post.route";
import quizRouter from "./routes/quiz.route";
import commentRouter from "./routes/comment.route";
dotenv.config()
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 100,
	legacyHeaders: false,
    message: "Too many requests, please try again later.",
    statusCode: 429,
})
app.use(limiter);
// app.use(helmet());
connectToDB();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({
    useTempFiles: true,
    createParentPath: true,
}));
app.use((req:Request,res:Response,next:NextFunction)=>{
    console.log(req.method,req.url,new Date().toLocaleDateString());
    next();
})
app.use("/community",communityRouter);
app.use("/course",courseRouter);
app.use("/comment",commentRouter);
app.use("/message",messageRouter);
app.use("/notification",notificationRouter);
app.use("/post",postRouter);
app.use("/user",userRouter);
app.use("/quiz",quizRouter);

const {PORT} = process.env;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));