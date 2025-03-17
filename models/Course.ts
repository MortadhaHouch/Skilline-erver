import mongoose, {Schema,model} from "mongoose";
import fs from "fs/promises";
import path from "path";
const courseSchema = new Schema({
    title:{
        type: String,
        required: true
    },
    description:{
        type: String,
        required: true
    },
    extra:{
        type:[String]
    },
    resource:{
        type:[String]
    },
    author:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    quizzes:{
        type: [Schema.Types.ObjectId],
        ref: "Quiz"
    },
    views:{
        type: Number,
        default: 0
    }
})
courseSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
    try {
        const filter = this.getFilter()._id;
        if (filter) {
            const foundCourse = await this.model.findOne(filter);
            if (!foundCourse) {
                throw new Error("Course not found")
            }else{
                const community = await mongoose.model("Community").findOne({ courses: { $in: [foundCourse._id] } });
                if (!community) {
                    throw new Error("Community not found")
                }else{
                    await mongoose.model("Quiz").deleteMany({ _id: { $in: foundCourse.quizzes } });
                    console.log(`Deleted quizzes associated with course: ${foundCourse.title}`);
                }
            }
        }
        next();
    } catch (error) {
        console.error("Error in course deletion middleware:", error);
        next();
    }
});
export default model("Course", courseSchema)