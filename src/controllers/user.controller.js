import { asynchandler } from '../utils/asynchandler.js';
import {Apierror} from '../utils/Apierror.js';
import {User} from '../models/user.model.js';
import {Apiresponse} from '../utils/Apiresponse.js';
import uploadCloudinary from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
const generateTokens = async(userId) =>{

  try{
   const user = await User.findById(userId);

   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken
   user.save({validateBeforeSave:false })

   return {accessToken, refreshToken}

  } catch(err) {
  throw new Apierror(210,"tokens not generated")
  }
}


const registerdUser = asynchandler(async(req,res)=>{

   const {fullName,email,password,username} = req.body;
   console.log(req.body)
   console.log(req.files)
   
   if(
    [fullName, email, username, password].some((field)=> field?.trim() === "")
  ){
    throw new Apierror(400,"all fields are required")
  }
  const existedUser  = await User.findOne({
    $or: [{username},{email}]
   });
   if(existedUser){
    throw new Apierror(409,"user already exsist")
   };
  
 const avatarLocalPath = req.files.avatar?.[0]?.path;
 const ImageLocalPath = req.files.Image?.[0]?.path;

 console.log('Avatar local path:', avatarLocalPath);
   console.log('Image local path:', ImageLocalPath);
 if(!avatarLocalPath) {
  throw new Apierror(400,"avatar local path not found")
 }

 const avatar = await uploadCloudinary(avatarLocalPath);
 const Image  = await uploadCloudinary(ImageLocalPath);

 if(!avatar) {
  throw new Apierror(400,"avatar is required")
 }

 const user = await User.create({
  fullName,
  email,
 avatar: avatar.url,
 Image: Image?.url || "",
  username: username.toLowerCase(),
  password,
 });

const createdUser =  await User.findById(user._id).select(
  "-password -refreshToken"
) ;
console.log(createdUser)

if(!createdUser){
  throw new Apierror(500,"something wrong with user registering user")
}
   return res.status(201).json(
    new Apiresponse(200, createdUser, "user created success")
   )
})

const loginUser = asynchandler(async (req,res) =>{
  const {  email, username,password } = req.body;
  
    const user = await User.findOne({ 
      $or: [{username},{email}]
     });
    if (!user) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.isPasswordCorrect(password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials' });
    }
   
     const {accessToken, refreshToken} = await generateTokens(user._id)
     const loginUser = await User.findById(user._id).select("-password -refreshToken")
     console.log(loginUser)
     const options = {
      httpOnly: true,
    //  secure: true
     }

     return res.status(200).cookie("accessToken", accessToken,options)
     .cookie("refreshToken",refreshToken,options)
     .json(
      new Apiresponse(
        200,
        {
          user: loginUser, accessToken,refreshToken
        },
        "user login great"
      )
     )
     

  
  
});


const logoutUser = asynchandler( async(req,res) =>{
 await User.findByIdAndUpdate(
    req.user._id,
    {
      $set:{
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
   }

   return res.clearCookie("accessToken", options).clearCookie("refreshToken",options)
   .json( new Apiresponse(400,"user log out"))

  })
  const refreshAccessToken = asynchandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new Apierror(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new Apierror(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new Apierror(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new Apiresponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new Apierror(401, error?.message || "Invalid refresh token")
    }

})
const changeCurrentPassword = asynchandler(async(req,res) =>{
  try{
    const {oldPassword, newPassword} = req.body
      const user = await  User.findById(req.user._id);
     const isPasswordCorrect = await  user.isPasswordCorrect(oldPassword)  

     if(!isPasswordCorrect){
      throw new Apierror(300, "invalid old password")
     }
     user.password = newPassword
     await user.save({validateBeforeSave: false})

     return res
     .status(200)
     .json(new Apiresponse(200, {}, "Password changed successfully"))
  } catch ( err) {
   throw new Apierror(200, "somethinh wrong in password updation")
  }

})
const getCurrentUser = asynchandler(async(req, res) => {
  return res
  .status(200)
  .json(new Apiresponse(
      200,
      req.user,
      "User fetched successfully"
  ))
})
const updateAccountDetails = asynchandler(async(req, res) => {
  const {fullName, email} = req.body

  if (!fullName || !email) {
      throw new Apierror(400, "All fields are required")
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set: {
              fullName,
              email: email
          }
      },
      {new: true}
      
  ).select("-password")

  return res
  .status(200)
  .json(new Apiresponse(200, user, "Account details updated successfully"))
});
const updateUserAvatar = asynchandler(async(req, res) => {
  const avatarLocalPath = req.file?.path

  if (!avatarLocalPath) {
      throw new Apierror(400, "Avatar file is missing")
  }

  //TODO: delete old image - assignment

  const avatar = await uploadCloudinary(avatarLocalPath)

  if (!avatar.url) {
      throw new Apierror(400, "Error while uploading on avatar")
      
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              avatar: avatar.url
          }
      },
      {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
      new Apiresponse(200, user, "Avatar image updated successfully")
  )
})
const updateUserCoverImage = asynchandler(async(req, res) => {
  const coverImageLocalPath = req.file?.path

  if (!coverImageLocalPath) {
      throw new Apierror(400, "Cover image file is missing")
  }

  //TODO: delete old image - assignment


  const coverImage = await uploadCloudinary(coverImageLocalPath)

  if (!coverImage.url) {
      throw new Apierror(400, "Error while uploading on avatar")
      
  }

  const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
          $set:{
              coverImage: coverImage.url
          }
      },
      {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
      new Apiresponse(200, user, "Cover image updated successfully")
  )
})
const getUserChannelProfile = asynchandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new Apierror(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
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
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new Apierror(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new Apiresponse(200, channel[0], "User channel fetched successfully")
    )
})
const getWatchHistory = asynchandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
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
        new Apiresponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})
export {registerdUser,
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

    }