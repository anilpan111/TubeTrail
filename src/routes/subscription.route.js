import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";

import { subscribe,isSubscribed } from "../controllers/subscribtion.controller.js";

const router =Router()

router.use(verifyJWT)

router.route("/sub/:userName").post(subscribe)
router.route("/profile/:userName").get(isSubscribed)

export default router