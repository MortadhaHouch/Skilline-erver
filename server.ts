import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import helmet from "helmet";
import userRouter from "./routes/user.route";
import connectToDB from "./config/connect";
const app = express();
app.use(cors({
    origin: "http://localhost:4200",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}))
app.use(helmet());
connectToDB();
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/user",userRouter);
const {PORT} = process.env;
app.listen(PORT,()=>console.log(`Server is running on port ${PORT}`));