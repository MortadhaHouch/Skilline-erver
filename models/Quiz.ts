import {Schema,model} from "mongoose";
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
    }
},{
    timestamps: true
})

const Quiz = model("Quiz",quizSchema);

export default Quiz