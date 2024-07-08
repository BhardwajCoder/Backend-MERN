import { User } from "../models/user.model.js";
import { Apierror } from "../utils/Apierror.js";
import { asynchandler } from "../utils/asynchandler.js";
import jwt from  'jsonwebtoken';

export const verifyToken = asynchandler(async(req,res,next) =>{
   try{
    
    const token = req.cookies.accessToken || req.header("authorization")?.replace("Bearer ","")

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

   
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
       

        const user  = await User.findById(decodedToken?._id).select("-password -refreshToken");
        if (!user ) {
            return res.status(401).json({ message: 'Token is not valid' });
        }
    req.user = user
        next();
   } catch(err){
    throw new Apierror(201,"invalid access token",err)

   }    
})