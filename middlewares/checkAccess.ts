import { NextFunction, Request, Response } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken"
import dotenv from "dotenv";
import { isValidObjectId } from "mongoose";
import Community from "../models/Community";
dotenv.config();
export async function checkAccess(req: Request, res: Response, next: NextFunction): Promise<any> {
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
        const entityId = req.params.id;
        if (!entityId || !isValidObjectId(entityId)) {
            return res.status(400).json({ message: "Invalid entity ID" });
        }
        const community = await Community.findById(entityId);
        if (!community) {
            return res.status(404).json({ message: "Community not found" });
        }
        const isAdmin = community.admin.toString() === user._id.toString();
        const isMember = community.members.some((memberId) => memberId.toString() === user._id.toString());
        if (isAdmin || isMember) {
            return next();
        }
        return res.status(403).json({ access_err: "Forbidden: No access rights" });
    } catch (error) {
        console.error("Middleware error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}