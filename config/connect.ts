import {connect} from "mongoose"
import dotenv from "dotenv";
dotenv.config();
const {MONGO_URI} = process.env;
export default async function connectToDB(){
    try {
        await connect(MONGO_URI as string);
        console.log('Connected to MongoDB')
    } catch (error) {
        console.error('Error connecting to MongoDB:', error)
    }
}