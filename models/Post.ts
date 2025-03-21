import mongoose, { ObjectId, Schema, model } from "mongoose";

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
    comments: {
        type: [Schema.Types.ObjectId],
        ref: "Comment"
    },
    likers: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    },
    dislikers: {
        type: [Schema.Types.ObjectId],
        ref: "User"
    }
}, {
    timestamps: true
});
async function deleteComments(postId:ObjectId) {
    try {
        const post = await mongoose.model("Post").findById(postId).exec();
        if (!post) {
            console.warn(`Post with ID ${postId} not found.`);
            return;
        }
        if (post.comments.length > 0) {
            await mongoose.model("Comment").deleteMany({ _id: { $in: post.comments } });
            console.log(`Deleted ${post.comments.length} comments associated with post ${postId}.`);
        }
    } catch (error:any) {
        console.error(`Error while deleting comments for post ${postId}:`, error.message);
    }
}
postSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
    const filter = this.getFilter();
    const postId = filter._id;
    if (!postId) {
        return next(new Error("Post ID is required for deletion."));
    }
    await deleteComments(postId);
    next();
});

// Middleware for deleting multiple posts
postSchema.pre("deleteMany", { document: false, query: true }, async function (next) {
    const filter = this.getFilter();
    const posts = await mongoose.model("Post").find(filter).exec();
    for (const post of posts) {
        await deleteComments(post._id);
    }
    next();
});

export default model("Post", postSchema);
