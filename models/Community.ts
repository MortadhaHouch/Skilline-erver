import mongoose,{ Schema, model } from "mongoose";
import fs from "fs/promises";
import path from "path";
const communitySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    admin: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    members: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    },
    posts: {
        type: [Schema.Types.ObjectId],
        ref: "Post"
    },
    logo:{
        type: String,
        default:""
    },
    banner:{
        type: String,
        default:""
    },
    courses:{
        type: [Schema.Types.ObjectId],
        ref: "Course"
    }
},{
    timestamps: true
})
communitySchema.pre("deleteOne", { document: false, query: true }, async function (next) {
    const filter = this.getFilter();
    const communityId = filter._id;
    if (!communityId) {
        return next(new Error("community ID is required for deletion."));
    }
    try {
        const community = await this.model.findOne(filter).exec();
        if (!community) {
            return next(new Error("Category not found."));
        }else{
            const folderPath = path.join(__dirname, "..", "uploads", community.name);
            try {
                await fs.access(folderPath);
                await fs.rm(folderPath, { recursive: true, force: true });
                console.log(`Deleted folder: ${folderPath}`);
            } catch (error:any) {
                if (error.code === "ENOENT") {
                    console.warn(`Folder not found: ${folderPath}`);
                } else if (error.code === "EACCES" || error.code === "EPERM") {
                    console.error(`Permission denied: Unable to delete folder ${folderPath}`);
                } else {
                    console.error(`Error deleting folder ${folderPath}:`, error.message);
                }
            }
            await mongoose.model("Course").deleteMany({ _id: { $in: community.courses } });
            await mongoose.model("Post").deleteMany({ _id: { $in: community.posts } });
        }
        next();
    } catch (error) {
        next();
    }
});
export default model("Community", communitySchema);