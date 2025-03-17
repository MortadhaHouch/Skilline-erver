import mongoose, { Schema, model } from "mongoose";
const postSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    comments:{
        type: [Schema.Types.ObjectId]
    },
    likers:{
        type: [Schema.Types.ObjectId]
    },
    dislikers:{
        type: [Schema.Types.ObjectId]
    }
},{
    timestamps: true
})
postSchema.pre("deleteOne",async function (next) {
    const filter = this.getFilter();
    const postId = filter._id;
    if (!postId) {
        return next(new Error("post ID is required for deletion."));
    }
    try {
        const post = await this.model.findOne(filter).exec();
        if (!post) {
            return next(new Error("Post not found."));
        }
        await mongoose.model("Comment").deleteMany({ _id: { $in: post.comments } });
        next();
    } catch (error) {
        next();
    }
})
export default model("Post", postSchema);