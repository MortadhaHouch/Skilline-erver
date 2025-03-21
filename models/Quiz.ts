import mongoose, {CallbackWithoutResultAndOptionalError, FilterQuery, Schema,model} from "mongoose";
const quizSchema = new Schema({
    topic:{
        type: String,
        required: true
    },
    creator:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    participators:{
        type: [Schema.Types.ObjectId],
        ref: "User"
    },
    questions:{
        type: [Schema.Types.ObjectId],
        ref: "Question"
    },
    difficulty:{
        type: String,
        enum: ["EASY", "MEDIUM", "HARD"],
        default: "MEDIUM"
    }
},{
    timestamps: true
})
quizSchema.pre("deleteOne",async function (next:CallbackWithoutResultAndOptionalError) {
    const filter:FilterQuery<unknown> = this.getFilter();
    const quizId = filter._id;
    if (!quizId) {
        return next(new Error("quiz ID is required for deletion."));
    }
    try {
        await mongoose.model("Question").deleteMany({ quiz: quizId });
        next();
    } catch (error) {
        next();
    }
})
quizSchema.pre("deleteMany",async function (next:CallbackWithoutResultAndOptionalError) {
    const filter:FilterQuery<unknown> = this.getFilter();
    const quizId = filter._id;
    if (!quizId) {
        return next(new Error("quiz ID is required for deletion."));
    }
    try {
        await mongoose.model("Question").deleteMany({ quiz: quizId });
        next();
    } catch (error) {
        next();
    }
})
const Quiz = model("Quiz",quizSchema);

export default Quiz