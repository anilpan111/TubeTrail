import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    getLikeCount,
    likeVideo 
} from "../controllers/like.controller.js";



const router = Router()

router.use(verifyJWT)
router.route("/l/:videoId").post(likeVideo)
router.route("/addLike/:videoId").post(getLikeCount)


export default router