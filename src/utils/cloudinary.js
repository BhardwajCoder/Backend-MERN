import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
cloudinary.config({ 
  cloud_name:process.env.CLOUDINARY_CLOUD_NAME, 
  api_key:process.env.CLOUDINARY_API_KEY, 
  api_secret:process.env.CLOUDINARY_API_SECRET 
});

const uploadCloudinary = async (localFile)=> {
  try{
    if(!localFile) return null
   const response = await cloudinary.uploader.upload(localFile , {
      resource_type: "auto"
    })
    console.log("file upload cloudinary",response.url)
    return response
  } catch (error) {
   fs.unlinkSync(localFile)
    return null
   
  }
}


export default uploadCloudinary;