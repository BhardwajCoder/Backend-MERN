import mongoose ,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber:{
        type:Schema.Types.ObjectId, // who is subscribing
        ref: "User"
    },
   channel: {
   type: Schema.Types.ObjectId,
   ref: 'User'
    }

},{timestamps})

export const subscription = mongoose.model("Subscription", subscriptionSchema)