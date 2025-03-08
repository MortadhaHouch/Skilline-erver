import { Schema, model } from "mongoose";
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
    }
},{
    timestamps: true
})

export default model("Community", communitySchema);