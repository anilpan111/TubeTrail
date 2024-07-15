import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrors } from "../utils/ApiErrors.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";


const subscribe = asyncHandler(async(req,res)=>{

    const subscribedBy = await User.aggregate([
        {
            $match:{
                _id:  new mongoose.Types.ObjectId(req.user._id)
            }
        },
       
    ])

    if(subscribedBy.length === 0){
        throw new ApiErrors(401,"User not logged in to subscribe")
    }
    // console.log("Channel username ins controller:")


    const {userName} =req.params


    if(!userName){
        throw new ApiErrors(401,"Something went wrong while fetching user")
    }
    
    const subscribedTo = await User.aggregate([
        {
            $match: {
                userName : userName?.toLowerCase()
            }
        },

    ])

    if(subscribedTo.length === 0){
        throw new ApiErrors(401,"Something went wrong while fetching Channel")
    }

    const subscriptionDetails = await Subscription.create({
        subscriber: subscribedBy[0],
        channel : subscribedTo[0]
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscriptionDetails,
            "Subscription done successfully"
        )
    )


})

const isSubscribed = asyncHandler(async (req,res)=>{
    const {userName} = req.params
    const user = await User.findById(req.user._id)
    
    if(!user){
        throw new ApiErrors(400,"Something went wrong while fetching user")
    }

    // console.log("User find by id:",user._id)

    const subscribedTo = await User.findOne({userName : userName.toLowerCase()})

    if(!subscribedTo){
        throw new ApiErrors(400,"Something went wrong while fetching username")
    }
    // console.log("User find by id:",subscribedTo._id)

    // const subscriptionStatus = await Subscription.exists({
    //     subscriber: user._id,
    //     channel: subscribedTo._id
    // })

    const subscriptionStatus = await Subscription.aggregate([
        {
            $match: {
                subscriber:new mongoose.Types.ObjectId(user._id),
                channel: new mongoose.Types.ObjectId(subscribedTo._id)
            }
        },
        {
            $count: "count"
        }
    ]);
    const isSubscribed = subscriptionStatus.length > 0 && subscriptionStatus[0].count > 0;

    // console.log("Subs status:",isSubscribed)
    return res
    .status(200)
    .json(
        new ApiResponse(200,isSubscribed,"Subscription status fetched")
    )
})

export {
    subscribe,
    isSubscribed
}