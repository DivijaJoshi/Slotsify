const express=require('express')
const router=express.Router()
const {auth,isAdmin,isUser}=require('../middlewares/auth')
const {getAllUsers,deleteUser,addNewSlot,deleteSlot}=require('../controllers/adminController')

//admin routes
router.get('/getAllUsers',auth,isAdmin,getAllUsers)
router.delete('/deleteUser/:id',auth,isAdmin,deleteUser)
router.post('/addNewSlot',auth,isAdmin,addNewSlot)
router.delete('/deleteSlot/:id', auth, isAdmin, deleteSlot)

module.exports=router