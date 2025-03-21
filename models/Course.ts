import mongoose, { ObjectId, Schema, model } from "mongoose";
import fs from "fs/promises";
import path from "path";

const courseSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    extra: {
        type: [String]
    },
    resource: {
        type: [String]
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    quizzes: {
        type: [Schema.Types.ObjectId],
        ref: "Quiz"
    },
    views: {
        type: Number,
        default: 0
    }
});

async function deleteRelatedQuizzes(quizzes:ObjectId[]) {
    try {
        await mongoose.model("Quiz").deleteMany({ _id: { $in: quizzes } });
        console.log(`Successfully deleted quizzes: ${quizzes.length}`);
    } catch (error) {
        console.error("Error deleting quizzes:", error);
    }
}

async function deleteCourseFolder(communityName:string, courseTitle:string) {
    const folderPath = path.join(__dirname, "..", "uploads", communityName, courseTitle);
    try {
        await fs.access(folderPath);
        await fs.rm(folderPath, { recursive: true, force: true });
        console.log(`Successfully deleted folder: ${folderPath}`);
    } catch (error:any) {
        if (error.code === "ENOENT") {
            console.warn(`Folder not found: ${folderPath}`);
        } else if (error.code === "EACCES" || error.code === "EPERM") {
            console.error(`Permission denied: Unable to delete folder ${folderPath}`);
        } else {
            console.error(`Error deleting folder ${folderPath}:`, error.message);
        }
    }
}

async function handleCourseDeletion(filter:ObjectId) {
    const foundCourse = await mongoose.model("Course").findById(filter);
    if (!foundCourse) {
        console.log("Course not found");
        return;
    }
    const community = await mongoose.model("Community").findOne({ courses: { $in: [foundCourse._id] } });
    if (!community) {
        console.log("Community not found");
        return;
    }
    await deleteRelatedQuizzes(foundCourse.quizzes);
    community.courses = community.courses.filter((courseId:ObjectId) => !courseId.toString()== foundCourse._id.toString());
    await community.save();
    await deleteCourseFolder(community.name, foundCourse.title);
}

courseSchema.pre(["findOneAndDelete", "deleteOne", "deleteMany"], { document: false, query: true }, async function (next) {
    try {
        const filter = this.getFilter()._id;
        if (filter) {
            await handleCourseDeletion(filter);
        }
        next();
    } catch (error) {
        console.error("Error in course deletion middleware:", error);
        next();
    }
});

export default model("Course", courseSchema);
