
const User=require('../models/User')
const Slot=require('../models/Slot')
const mongoose=require('mongoose')



//View all Users (admin)
const getAllUsers=async (req,res,next)=>{
    try{
        //get all users
        const users=await User.find({})

        //check if users array is empty ie users not found
        if(users.length===0){
            const error=new Error('No users found')
            error.code=404
            throw error
        }

        res.json({
            status:'success',
            Users:users
        })
    }
    catch(error){
        next(error)
    }
}


//Delete user by id (admin)
const deleteUser=async (req, res, next)=>{
    try{

        
        const userId=req.params.id

        //validate mongoose userId format
        let isValid = mongoose.Types.ObjectId.isValid(userId);
                if(!isValid){
                    const error=new Error('Invalid Mongoose ObjectID')
                    error.code=400
                    throw error
                }
        
        
        const userFound=await User.findById(userId)

        //check if user exists or not
        if(!userFound){
            const error=new Error('No user found with this id');
            error.code=404
            throw error
            
        }
        
        //if user exists delete user by id
        const user=await User.findByIdAndDelete(userId)
        

        res.json({
            status:'success',
            message:'User deleted successfully'

        })
    }
    catch(error){
        next(error)
    }
}


//Create new resources(slotTypes) admin
const addNewSlot=async (req, res, next)=>{
    try{

        //Check if request body is empty
        if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }

        
    
        const {slotName}=req.body

        //Check for missing fields
        if(!slotName ){
        const error=new Error('slotName ia required')
        error.code=400
        throw error;
    }


        //check for extra fields in req.body
     const allowedFields=['slotName']
        for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only slotName is allowed in request body')
            error.code=400
            throw error;
        }
    }

    // create a new SlotType
        const slot=new Slot({slotName:slotName})
        await slot.save()

        res.json({
            status:'success',
            message:'New slot added successfully',
            slot:slot
        })

    }
    catch(error){
        next(error)
    }
}



//delete slotType by id (admin)
const deleteSlot=async (req, res, next)=>{
    try{
        const slotId=req.params.id

        //validate mongoose slotId format
        let isValid = mongoose.Types.ObjectId.isValid(slotId);
                if(!isValid){
                    const error=new Error('Invalid Mongoose ObjectID')
                    error.code=400
                    throw error
                }
        
        //check if slotType exists for a gien Id
        const slotFound=await Slot.find({_id:slotId})

        if(slotFound.length===0){
            const error=new Error('No slot found with this id');
            error.code=404
            throw error

        }  

        //find and delete SlotType
        const slot=await Slot.findByIdAndDelete(slotId)
        
        res.json({
            status:'success',
            message:'Slot deleted successfully'

        })

    }
    catch(error){
        next(error)
    }
}

module.exports={getAllUsers,deleteUser,addNewSlot,deleteSlot}