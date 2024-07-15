import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Likes} from "../models/like.model.js"
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const likeVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params
    if(!videoId){
        throw new ApiErrors(400,"Video id cannot fetched")
    }

    const video = await Video.findById(videoId)


    // console.log("video object: ",video)
    if(!video){
        throw new ApiErrors(404,"something went wrong while fetching video object from db")
    }

    console.log("Video validate")


    const user = await User.findById(req.user?._id).select("-password -refreshToken -coverImage -watchHistory ")

    if(!user){
        throw new ApiErrors(401,"Login to add like")
    }

    const likeObject = await Likes.create({
        video:video,
        likedBy: user
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200,likeObject,"Videos fetched successfully")
    )

})

const getLikeCount = asyncHandler(async(req,res)=>{
    const {videoId} =req.params
    
    if(!videoId){
        throw new ApiErrors(400,"Something went wrong while fetching the video")
    }

    const noOfLikes = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup : {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likeCount"
            }
        },
        {
            $addFields: {
                likeCount: {
                    $size: "$likeCount"
                }
            }
        },
        {
            $project:{
                likeCount : 1
            }
        }
    ])
    // console.log("No of likes",noOfLikes)

    return res
    .status(200)
    .json(
        new ApiResponse(200,noOfLikes,"No of likes fetched successfully")
    )
})

export {
    likeVideo,
    getLikeCount
}