const mongoose=require('mongoose')
const validator = require('validator')

const slot=new mongoose.Schema({
    slotName:{
        type:String,
        required:[true,"Slot required"],
        unique:[true,'Slot name should be unique']
    }

})

const Slot=mongoose.model('Slot',slot)
module.exports=Slot