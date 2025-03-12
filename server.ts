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
dotenv.config()
const app = express();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
app.use(helmet());
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
app.use("/user",userRouter);
app.use("/community",communityRouter);
app.use("/course",courseRouter);
const {PORT} = process.env;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));