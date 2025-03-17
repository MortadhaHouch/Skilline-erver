import { Schema ,model} from "mongoose";

const acceptSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    community: { type: Schema.Types.ObjectId, ref: 'Community' },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
})

export default model("Accept",acceptSchema);