import {Schema,model} from "mongoose"
import bcrypt from "bcrypt"
const userSchema = new Schema({
    firstName:{
        type: String,
        required: true
    },
    lastName:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    avatar: {
        type: String,
    },
    isLoggedIn:{
        type: Boolean,
        default: false
    },
    role:{
        type: String,
        default: "USER",
        enum: ["USER", "ADMIN"]
    },
    bio:{
        type: String
    },
    interests:{
        type: [String]
    }
},{
    timestamps:true
})
userSchema.pre("save",async function(){
    if(this.isNew || this.isModified("password")){
        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password,salt);
    }
})

export default model("User",userSchema)