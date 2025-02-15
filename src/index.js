import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';
dotenv.config({
    path:'./.env'
})

connectDB()

.then(()=>{
  app.listen(process.env.PORT || 5000,()=>{
    console.log(`server is running ${process.env.PORT}`)
  })
})
.catch((err)=>{
  console.log('db connection failed',err)
})


/*
 import express from 'express';
 const app = express()
;(async ()=>{
 try{
  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
  app.on("error",(error)=>{
    console.log("ERR",error)
    throw error
  })

  app.listen(process.env.PORT,()=>{
    console.log(`app is listenig on port ${process.env.PORT}`)
  })
 }
 catch(error){
    console.log(error)
 }
 
})()
*/