import bcrypt from 'bcrypt';
import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
dotenv.config();
export async function checkAdmin(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
        const auth_token = req.cookies.auth_token;
        if (!auth_token) {
            return res.status(401).json({ token_err: "Unauthorized" });
        }
        let decoded;
        try {
            decoded = jwt.verify(auth_token, process.env.SECRET_KEY as string) as { email: string };
        } catch (err) {
            console.error("Token verification failed:", err);
            return res.status(401).json({ token_err: "Invalid token" });
        }
        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(401).json({ user_err: "Unauthorized" });
        }
        if (user.role !== "ADMIN") {
            return res.status(403).json({ role_err: "Forbidden: Admins only" });
        }
        next();
    } catch (error) {
        console.error("Middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}