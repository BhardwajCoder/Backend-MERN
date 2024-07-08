import mongoose, {Schema} from 'mongoose';

const TravelSchema = new Schema({
    budget:{
        type:String,
        required:true
    },
    tripLocation:{
        type:String,
        required:true
    },
    region:{
        type:String,
        required:true
    },
    travelBy:[{
        type:String
    }],
    stayOption:[{
        type:String
    }],
    famousplace:[{
        type:String,
    }]
},{timestamps:true})

export const Travel = mongoose.model('Travel',TravelSchema)