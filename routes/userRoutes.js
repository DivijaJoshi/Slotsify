const express=require('express')
const router=express.Router()
const {bookSlot,checkInSlot,checkOutSlot,cancelSlot}=require('../controllers/userController')
const {auth,isAdmin,isUser}=require('../middlewares/auth')

//user routes
router.post('/bookSlot',auth,isUser,bookSlot)
router.post('/checkInSlot/:id',auth,isUser,checkInSlot)
router.post('/checkOutSlot/:id',auth,isUser,checkOutSlot)
router.post('/cancelSlot/:id',auth,isUser,cancelSlot)

module.exports=router