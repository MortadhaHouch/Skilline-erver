import { Schema, model } from "mongoose";
const notificationSchema = new Schema({
    content: {
        type: String,
        required: true
    },
    from: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    to:[
        {
            user:{
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true
            },
            createdAt:{
                type: Date,
                default: Date.now
            },
            readAt:{
                type: Date,
                required:false
            }
        }
    ],
    isRead:{
        type: Boolean,
        default: false
    }
},{
    timestamps: true
})

export default model("Notification", notificationSchema);