import {  Router } from 'express';
import {  loginUser, logoutUser, refreshAccessToken, registerdUser } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.middleware.js';
import {  verifyToken } from '../middlewares/auth.middleware.js';
import { travelData, travelFinder } from '../controllers/travel.controller.js';



const router = Router()

router.route("/register").post(
  upload.fields([
    {
      name:"avatar",
      maxCount:1
    },
    {
      name:"Image",
      maxCount:1
    }
  ]),
  registerdUser
)

router.route("/login").post(loginUser)
router.route("/logout").post(verifyToken, logoutUser)
router.route("/refresh-token").post( refreshAccessToken)
router.route("/travel-data").post(travelData)
router.route("/travel-finder").post(travelFinder)
export default router