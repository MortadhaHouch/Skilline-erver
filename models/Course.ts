import {Schema,model} from "mongoose"
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
        type:String,
        required: true
    },
    author:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    quizzes:{
        type: [Schema.Types.ObjectId],
        ref: "Quiz"
    }
})

export default model("Course", courseSchema)