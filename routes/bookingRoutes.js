const express=require('express')
const router=express.Router()

const {auth,isAdmin,isUser}=require('../middlewares/auth')
const {getmyBookings,getAllBookings,getBookingsByDate,availableSlotsByDate,getSlotTypes}=require('../controllers/bookingController')

//user route
router.get('/getmyBookings',auth,isUser,getmyBookings)

//admin routes
router.get('/getBookingsByDate',auth,isAdmin,getBookingsByDate)
router.get('/getAllBookings',auth,isAdmin,getAllBookings)

//common routes
router.get('/getAvailableSlotsByDate',auth,availableSlotsByDate)
router.get('/getSlotTypes',auth,getSlotTypes)


module.exports=router
