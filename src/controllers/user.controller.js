import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiErrors } from "../utils/ApiErrors.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"


const generateAccessTokenAndRefreshtoken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        // console.log("User found while generating token",user)
        const accessToken = user.generateAccessToken()
        // console.log("Access token ",accessToken)
        // console.log("accessToken",accessToken)   
        const refreshToken = user.generateRefreshToken()


        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}

    } catch (error) {
        throw new ApiErrors(500,"Something went wrong while generatin tokens")
    }
}

const registerUser = asyncHandler( async (req,res)=>{
    // res.status(200).json({
    //     message: "Bitch i'm back"
    // })

    // recieve response from frontend
    const {userName,email,fullName,password}=req.body

    // console.log("email:",email)
    // console.log("password:",password)

    //validate the response fields are empty

    if(
        [userName,email,fullName,password].some( (field) => field?.trim() === "")
    ) {
        throw new ApiErrors(400, "All fields are required");
    }


    //check whether user already exists

    const isUserExist = await User.findOne({
        $or:[{userName},{email}] 
    })

    if(isUserExist){
        throw new ApiErrors(409,"User Already exists")
    }


    //check for avatar and cover image

    const avatarLoacalPath = req.files?.avatar[0].path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if(!avatarLoacalPath){
        throw new ApiErrors(400, "Avatar is required")
    }



    //upload avatar and cover image in cloudinary

    const avatar = await uploadOnCloudinary(avatarLoacalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiErrors(400, "Avatar is required")
    }

 
    //create user object and enter data in db

    const user = await User.create({
        fullName,
        avatar:avatar.url,
        coverImage: coverImage?.url || "",
        email,
        userName : userName.toLowerCase(),
        password
    })

    // remove password and refresh token from user object
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //check if user is created

    if(!createdUser){
        throw new ApiErrors(500,"Something went wrong while registering")
    }

    //return a response

    return res.status(201).json(
        new ApiResponse(200,createdUser,"User registered succesfully")
    )


})

const loginUser = asyncHandler( async (req,res) =>{


    //recieve data from frontend request body
    const {userName,email,password} = req.body



    if(!(userName || email)){
        throw new ApiErrors(400, "User name or email required anil")
    }

    const user= await User.findOne({
        $or: [{ userName }, { email}]
    })

   

    if(!user){
        throw new ApiErrors(404,"User not found")
    }

    //comparint passwords

    const isPasswordValid = await user.isPasswordCorrect(password)
    
    if(!isPasswordValid){
        throw new ApiErrors(401,"Incorrect password")
    }

    //generating access and refresh tokens
    const {accessToken,refreshToken}=await generateAccessTokenAndRefreshtoken(user._id)

    const loggedInUser = await User.findById(user._id).select(" -passwor -refreshtoken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'None'
    };


    //returning response to the user or frontend
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User logged in successfully"
        )
    )
})

//logout functionality
const logOutUser = asyncHandler( async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
        {
            new: true
        }
    )

    const options ={
        httpOnly: true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200, "User logged out"))
})

// validating user's refresh token with database refresh token

const refreshAccessToken =asyncHandler( async(req,res)=>{

    //get refresh token from front end
    const incomingRefreshToken =req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiErrors(400,"Unauthorized request")
    }

    try {

        //decode the refresh token using jwt
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        //find user from db using token's id
        const user = await User.findById(decodedToken?._id)

        if(!user){
            throw new ApiErrors(401,"Invalid refresh token")
        }

        //compare user's token and db token
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiErrors(401,"Refresh token is expired")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'None'
        };

        //genrate access token and refresh token

        const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshtoken(user._id)

        //return a response

        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
                },
                "Access Token refreshed successfully"
            )
        )

    } catch (error) {
        throw new ApiErrors(400, "Access token error")
    }
})


//change user password

const changeUserPasswaord = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confPassword} = req.body

    if(!oldPassword || !newPassword || !confPassword){
        throw new ApiErrors(400,"Fields cannot be empty")
    }


    if(!(newPassword === confPassword)){
        throw new ApiErrors(400,"New password and confirm password should be same")
    }

    const user = await User.findById(req.user?._id)

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiErrors(400,"Old password is incorrect")
    }

    user.password = newPassword

    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed successfully")
    )


})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"Current user fetched successfully")
    )
})

const changeName = asyncHandler(async (req,res)=>{
    const {fullName}=req.body

    if(!fullName){
        throw new ApiErrors(400,"Name cannot be empty")
    }

    await User.findOneAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName:fullName
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Name changed successfully")
    )
})

const changeAvatar = asyncHandler(async(req,res)=>{
    const avatarLoacalPath = req.file?.path

    if(!avatarLoacalPath){
        throw new ApiErrors(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLoacalPath)

    if(!avatar){
        throw new ApiErrors(500,"File not uploaded in cloudinary")
    }

    await User.findOneAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select(" -password ")

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Avatar changed succussfully")
    )
})


const changeCoverImage = asyncHandler(async(req,res)=>{
    const CoverImageLoacalPath = req.file?.path

    if(!CoverImageLoacalPath){
        throw new ApiErrors(400,"Cover Image file is missing")
    }

    const CoverImage = await uploadOnCloudinary(CoverImageLoacalPath)

    if(!CoverImage){
        throw new ApiErrors(500,"File not uploaded in cloudinary")
    }

    await User.findOneAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: CoverImage.url
            }
        },
        {new: true}
    ).select(" -password ")

    return res
    .status(200)
    .json(
        new ApiResponse(200,"Cover image changed succussfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userName}=req.params

    if(!userName?.trim()){
        throw new ApiErrors(400,"Username is missing")
    }

    const channel= await User.aggregate([
        {
            $match: {
                userName: userName?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscriberCount: {
                    $size:"$subscribers"
                },
                channelSubscribedCount :{
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id,"$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName:1,
                subscriberCount:1,
                channelSubscribedCount:1,
                coverImage:1,
                avatar:1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiErrors(400, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,channel[0],"User channel fetched successfully")
    )
})


export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeUserPasswaord,
    getCurrentUser,
    changeName,
    changeAvatar,
    changeCoverImage,
    getUserChannelProfile
}