import { Schema, model } from "mongoose";
const messageSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to:{
        type: [Schema.Types.ObjectId]
    },
    isRead:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})

export default model("Message", messageSchema);