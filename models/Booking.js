const mongoose=require('mongoose')
const { timeStamp } = require('node:console')
const validator = require('validator')

const booking=new mongoose.Schema({
   userId:{
    type: mongoose.Schema.Types.ObjectId, ref: 'User',
    required:[true,"User id required"]
   },
   slotId:{
    type:mongoose.Schema.Types.ObjectId,ref: 'Slot',
    required:[true,"Slot id required"]
   },
   StartTime:{
    type:Date,
    required:[true,"Start time required"]
   },
   EndTime:{
    type:Date,
    required:[true,"End Time required"]
   },
   CheckIn:
    {
    type:Date,
    default:null
   },
   CheckOut:
    {
    type:Date,
    default:null
   },
   status:{
    type:String,
    enum:['Booked','Cancelled','Available'],
    default:'Booked'
   },
   timeStamp:
    {
    type:Date,
    default:Date.now
    }
   

})

const Booking=mongoose.model('Booking',booking)
module.exports=Booking