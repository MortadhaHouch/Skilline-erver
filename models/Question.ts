import { Schema, model } from "mongoose";

const resultSchema = new Schema({
    answer: { 
        type: String, 
        required: true 
    },
    time: { 
        type: Number, 
        required: true 
    },
    user: { 
        type: Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
}, { _id: false });
const questionSchema = new Schema({
    quiz: { 
        type: Schema.Types.ObjectId, 
        ref: "Quiz", 
        required: true 
    },
    answers: { 
        type: [String], 
        required: true 
    },
    participators: [
        { 
            type: Schema.Types.ObjectId, 
            ref: "User" 
        }
    ],
    correctAnswer: {
        type: String,
        required: true
    },
    results: [resultSchema],
    time: {
        type: Number,
        required: false,
    },
}, { timestamps: true });

export const Question = model("Question", questionSchema);
