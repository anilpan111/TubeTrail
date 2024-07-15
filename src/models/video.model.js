import mongoose, { Schema} from "mongoose";
import mongooseAggregatePaginateV2 from "mongoose-aggregate-paginate-v2"
const videoSchema = new mongoose.Schema({
    videoFile: {
        type:String,
        required: true
    },
    thumbnail: {
        type: String,
        required: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
    },
    // duration: {
    //     type: Number,
    //     required: true
    // },
    // views :{
    //     type:Number,
    //     required:true,
    //     default:0
    // },
    // isPublished :{
    //     type: Boolean,
    //     required: true,
    //     default: false
    // }
},
{
    timestamps: true
}
);

videoSchema.plugin(mongooseAggregatePaginateV2)
export const Video = mongoose.model("Video",videoSchema)