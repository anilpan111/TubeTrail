import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    uploadVideo,
    likeVideo,
    getAllVideos,
    deleteVideo,
    playVideo
} from "../controllers/video.controller.js"


const router = Router()

// router.use(verifyJWT)
// console.log("Video route hits")


router.route("/uploadVideo").post(
    
    upload.fields([
        {
            name:"videoFile",
            maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),
    verifyJWT,
    uploadVideo
)
router.route('/play/:videoId').get(playVideo)
router.route("/likeVideo").post(verifyJWT,likeVideo)

router.route("/").get(getAllVideos)

router.route("/v/:videoId").post(verifyJWT,deleteVideo)
export default router