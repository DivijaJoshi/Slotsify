const express=require('express')
const app=express()
const authRouter=require('./routes/authRoutes')
const adminRouter=require('./routes/adminRoutes')
const userRouter=require('./routes/userRoutes')
const bookingRouter=require('./routes/bookingRoutes')
const errorHandler=require('./middlewares/errorHandler')

//load .env
require('dotenv').config()

//conncect to DB
const connectDB = require('./config/db');
connectDB();



//parse json requests
app.use(express.json())

//mount routes
app.use('/api/auth/',authRouter)
app.use('/api/admin/',adminRouter)
app.use('/api/user/', userRouter)
app.use('/api/bookings/', bookingRouter)



// invalid routes middleware
app.use((req,res,next)=>{
    const error=new Error('Route not found')
    error.code=404
    throw error
    
})

// mount error handler middleware
app.use(errorHandler)


// connect to server
app.listen(process.env.PORT,()=>{
    console.log("Server is running on Port",process.env.PORT)
})