import { Router } from "express";
import { logOutUser, loginUser, registerUser,refreshAccessToken ,changeUserPasswaord,getCurrentUser, changeName, changeAvatar, changeCoverImage, getUserChannelProfile} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();
// console.log("User route hits")



router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser)
//login route
router.route("/login").post(loginUser)


//logout route
//added verifyJWT middleware so that user can be assigned by user id
router.route("/logout").post(verifyJWT,logOutUser)
router.route("/refreshToken").post(refreshAccessToken)
router.route("/changePassword").post(verifyJWT,changeUserPasswaord)
router.route("/getCurrentUser").get(verifyJWT,getCurrentUser)
router.route("/changeName").post(verifyJWT,changeName)
router.route("/changeAvatar").post(verifyJWT,upload.single("avatar"),changeAvatar)
router.route("/changeCoverImage").post(verifyJWT,upload.single("coverImage"),changeCoverImage)
router.route("/c/:userName").get(getUserChannelProfile)





export default  router