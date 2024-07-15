import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";



const uploadVideo = asyncHandler(async(req,res)=>{



    //get title and description from body
    const {title,description}=req.body

    // console.log("Title and description",title,description)


    //check whether title and description are empty
    if(
        [title,description].some((field)=>field?.trim() === "")
    ){
        throw new ApiErrors(400,"All fields are requied to upload video")
    }


    const videoLoacalPath = req.files?.videoFile[0].path
    
    if(!videoLoacalPath){
        throw new ApiErrors(400,"Video is missing")
    }


    //get thumbnail file path
    const thumbnailLocalPath= req.files?.thumbnail[0].path

    //validate path

    if(!thumbnailLocalPath){
        throw new ApiErrors(400,"Thumbnail is missing")
    }

    
    //upload files on cloudinary

    const videoFile= await uploadOnCloudinary(videoLoacalPath);
    
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const owner = await User.findById(req.user._id).select(
        "-password -refreshToken"
    )

    if(!owner){
        throw new ApiErrors(400,"Unauthorized user");
    }

    const video = await Video.create({
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        owner
    })

    if(!video){
        throw new ApiErrors(500,"Something went wrong while uploading in db")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "Video uploaded successfully"
        )
    )

})


const likeVideo = ()=>{
    console.log("video liked ")
}

const getAllVideos = asyncHandler(async(req,res)=>{
    const videos = await Video.aggregate([
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as:"uploader"
            },
        },
        {
            $unwind: "$uploader"
        },
        {
            $addFields:{
                avatar: "$uploader.avatar",
                channelName: "$uploader.fullName",

            },
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                avatar:1,
                channelName:1,
                description:1,
                createdAt:1,
            },
        },
    //     {
    //     $lookup: {
    //       from: "users", // The collection name in MongoDB (usually the model name in lowercase and plural)
    //       localField: "owner",
    //       foreignField: "_id",
    //       as: "ownerDetails",
    //     },
    //   },
    //   {
    //     $unwind: "$ownerDetails", // Flatten the array to get the object directly
    //   },
    //   {
    //     $project: {
    //       videoFile: 1,
    //       thumbnail: 1,
    //       title: 1,
    //       description: 1,
    //       owner: 1,
    //       "ownerDetails.userName": 1,
    //       "ownerDetails.email": 1,
    //       "ownerDetails.fullName": 1,
    //       "ownerDetails.avatar": 1,
    //     },
    //   },
    ])

    if(!videos){
        throw new ApiErrors(500, "videos not fetched")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,videos,"Videos fetched successfully")
    )
})

const deleteVideo =  asyncHandler(async(req,res)=>{
    const {videoId} =req.params

    if(!videoId){
        throw new ApiErrors(400,"Something went wrong while fetching video id ")
    }

    try {
        await Video.findByIdAndDelete(videoId )
    } catch (error) {
        console.log("Error while deleting video",error)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Video deleted successfully")
    )
})

const playVideo = asyncHandler(async(req,res)=>{
    const {videoId} =req.params
    if(!videoId){
        throw new ApiErrors(400,"Something went wrong while fetching video anil")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $addFields: {
                avatar: "$channelDetails.avatar",
                channelName: "$channelDetails.fullName",
                channelUserName: "$channelDetails.userName"

            }
        },
        {
            $project:{
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                avatar:1,
                channelName:1,
                description:1,
                createdAt:1, 
                channelUserName:1,
            }
        },
    ])

    if(video.length === 0){
        throw new ApiErrors(500,"Video not fetched from database")
    }

    // const isSubscribed = await Subscription.exists({
    //     subscriber: req.user._id,
    //     channel: video[0]
    // })

    return res
    .status(200)
    .json(
        new ApiResponse(200,video[0],"Video fetched successfully")
    )
})

export{
    uploadVideo,
    likeVideo,
    getAllVideos,
    deleteVideo,
    playVideo
}