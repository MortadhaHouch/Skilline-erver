import { Schema, model } from "mongoose";
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

export default model("Post", postSchema);