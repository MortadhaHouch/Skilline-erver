import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();
export async function checkUser(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const auth_token = req.cookies.auth_token;
        if (!auth_token) {
            return res.status(401).json({ error: "Unauthorized" });
        }
        let decoded;
        try {
            decoded = jwt.verify(auth_token, process.env.SECRET_KEY as string) as { email: string };
        } catch (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ error: "Invalid token" });
        }
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }
        next();
    } catch (error) {
        console.error("Middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}