import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens=async(userId)=>{
  try {
    const user=await User.findById(userId)
    const accessToken=user.generateAccessToken()
    const refreshToken=user.generateRefreshToken()

    user.refreshToken=refreshToken
    user.save({validateBeforesave:false})

    return {accessToken,refreshToken}

  } catch (error) {
    throw new ApiError(500,"Internal Error !!")
  }
}

const registerUser=asyncHandler(async (req,res) =>{
  const {fullname,email,username,password}=req.body
  console.log("email ",email);
  
  if(
    [fullname,email,username,password].some((field)=>
    field?.trim()=== "")
  ){
    throw new ApiError(400," All fields are Required!"); 
  }

  const existUser=await User.findOne({
    $or:[{ username },{ email }]
  })
  if (existUser){
    throw new ApiError(402,"User or emial Exist ")
  }

  console.log(req.files);
  
  const avatarLocalPath=req.files?.avatar[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage > 0 ) {
    coverImageLocalPath=req.files.coverImage[0].path
  }

  if (!avatarLocalPath){
    throw new ApiError(400,"Avatar File is Required");    
  }

  const avatar= await uploadCloudinary(avatarLocalPath)
  const coverImage=await uploadCloudinary(coverImageLocalPath)

  if (!avatar){
    throw new ApiError(400,"Avatar not Found");    
  }

  const user = await User.create({
    fullname,
    avatar:avatar.url,
    coverImage:coverImage?.url || "",
    email,
    password,
    username:username.toLowerCase()
  })

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser){
    throw new ApiError(500,"Something went wrong from our side");    
  }

  return res.status(201).json(
    new ApiResponse (200,createdUser,"User Registerd Successfully!!")
  )
})

const loginUser=asyncHandler(async (req,res) =>{

  const {username,email,password}=req.body

  if(!(username || email)){
    throw new ApiError(400,"Username or Email is required!!");    
  }

  const user = await User.findOne({
    $or:[{username},{email}]
  })
  
  if(!user){
    throw new ApiError(404,"User not exist!!");    
  }

  const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401,"Wrong Credentials!!")
  }

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

  const options={
    httpOnly:true,
    secure: true
  }

  return res
  .status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
      200,
      {
        user:loggedInUser,accessToken,refreshToken
      },
      "User LoggedIn Successfully"
    )
  )
})

const logoutUser=asyncHandler(async(req,res)=>{
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset:{
        refreshToken:1
      }
    },
    {
      new:true
    }
  )
  const options={
    httpOnly:true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie("accessToken",options)
  .clearCookie("refreshToken",options)
  .json(new ApiResponse(200,{},"User Logged Out!!"))
})

const refreshAccessToken= asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
    throw new ApiError(401,"Unauthorized Request")
  }
  try {
    const decodedToken=jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
  
    const user=await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401,"Invalid Refresh Token")
    }
    if(incomingRefreshToken!==user?.refreshToken) {
      throw new ApiError(401,"Refresh token is Expired or used")
    }
  
    const options={
      httpOnly:true,
      secure:true
    }
  
    const {accessToken,newRefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,refreshToken:newRefreshToken
        },
        "Access Token refreshed"
      )
    )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid Refreh token")
  }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{

  const {oldPasword,newPassword}=req.body

  const user=await User.findById(req.user?._id)
  const isPasswordCorrect=await user.isPasswordCorrect(oldPasword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"invalid Password")
  }

  user.password=newPassword
  await user.save({validateBeforesave:false})

  return res
  .status(200)
  .json(new ApiResponse(200,{},"Password Changed Successfully"))

})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res 
  .status(200)
  .json(200,new ApiResponse(200,req.user,"current User Found Successfully!!"))
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullname,email}=req.body

  if (!fullname||!email){
    throw new ApiError(400,"All fields are Required")
  }

  const user=User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullname,
        email
      }
    },
    {new:true}
  ).select("-passwrord")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Account Details Updated Successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath= req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(401,"Avatar File is  Missing!!")
  }

  const avatar=await uploadCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(401,"Error while uploading on avataar")
  }

  const user=await User.findOneAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})

const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath= req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(401,"Avatar File is  Missing!!")
  }

  const coverImage=await uploadCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(401,"Error while uploading on avataar")
  }

  const user=await User.findOneAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar Updated Successfully"))
})

const getUserChannelProfile=asyncHandler(async(req,res)=>{
  const {username}=req.params

  if(!username?.trim()){
    throw new ApiError(401,"Username is Missing");
  }

  const channel=await User.aggregate([
    {
      $match:{
        username:username?.toLowerCase()
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscriber"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribedTo"
      }
    },
    {
      $addFields:{
        subscribersCount:{
          $size:"$subscribers"
        },
        channelsSubscribedToCount:{
          $size:"$subscribedTo"
        },
        isSubscribed:{
          $cond:{
            if:{$:[req.user?._id,"$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullname:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1
      }
    }
  ])

  if(!channel?.length){
    throw new ApiError(404,"Channel does not Exist")
  }

  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User Channel fetched Successfully!!")
  )
})

const getWatchHistory=asyncHandler(async(req,res)=>{
  const user= await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullname:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ]) 

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History fetched Successfully!!"
    )
  )
})
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};