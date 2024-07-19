import express from 'express';
import cors from "cors"
import cookieParser from "cookie-parser"


const app = express();  

app.use( cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use( express.json({limit:"16kb"}))
app.use(express.urlencoded( {extended: true, limit: "16kb"}))
app.use(cookieParser())

//route import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import LikeRouter from "./routes/like.routes.js"
import subscriptionRoute from "./routes/subscription.route.js"


// route declaration

app.use("/api/v1/user",userRouter)
app.use("/api/v1/video",videoRouter)
app.use("/api/v1/like",LikeRouter)
app.use("/api/v1/subscribe",subscriptionRoute)

export {app};