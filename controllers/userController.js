const Booking=require('../models/Booking')
const Slot=require('../models/Slot')
const mongoose=require('mongoose');

//function to validate date in ISO format YYYY-MM-DDThh:mm:ss
function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str); 
  return !isNaN(d.getTime()) && d.toISOString()===str; // valid date 
}


// Make bookings for a Resource(user)
const bookSlot=async(req,res,next)=>{
    try{

        //check for empty request body
        if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }
        const{slotId,reqStartTime,reqEndTime}=req.body


        //check for missing fields
        if(!slotId||!reqStartTime||!reqEndTime ){
        const error=new Error('slotId,reqStartTime,reqEndTime are required')
        error.code=400
        throw error;
    }


    //check for invalid fields in request body
    const allowedFields=['slotId','reqStartTime','reqEndTime']
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only slotId,reqStartTime,reqEndTime are allowed in request body')
            error.code=400
            throw error;
        }
    }
    
    //validate mongoose format for slotID
    let isValid = mongoose.Types.ObjectId.isValid(slotId);
        if(!isValid){
            const error=new Error('Invalid Mongoose ObjectID')
            error.code=400
            throw error
        }
        
    //validate ISO date format for reqStartTime and reqEndTime
        if(!isIsoDate(reqStartTime) || !isIsoDate(reqEndTime)){
            const error=new Error("Invalid date format (should follow Format YYYY-MM-DDTHH:mm:ss.sssZ")
            error.code=400
            throw error
        }

    
        //if user tries to book slot starting from current date to 
        // next date for example today 11:45 pm to tomorrow 12:10 am.
        
        let s1=reqStartTime.split('T')[0] //extract date part of ISO string
        let s2=reqEndTime.split('T')[0]

        //check if dates are same or not
        if(s1!==s2){
            const error=new Error('Start time date and end time date should be same')
            error.code=400
            throw error
        }


        //find if Resouce type exists
        const slotTypeExists=await Slot.findOne({_id:slotId})

        //throw error if slotType not found
        if(!slotTypeExists){
            const error=new Error("Slot not available")
            error.code=400
            throw error

        }

        //convert json string to Date type
        const date1=new Date(reqStartTime)
        const date2=new Date(reqEndTime)

        //get current date
        const TodaysDate=new Date()

        //check if user trying to book slots for Previous day or time.
        if(date1<TodaysDate){
            const error=new Error("Cannot book slots for Previous day or time ")
            error.code=400
            throw error

        }


        //calcuate time Different in request slot start and end time
        var diff = date2.valueOf() - date1.valueOf();

        //start time shouldnt be greater than end time
        if(diff < 0){
            const error=new Error("Start time cannot be greater than end time")
            error.code=400
            throw error
        }

        //check if slot start and end time are same
        if(diff === 0){
            const error=new Error("Start time cannot be same as end time")
            error.code=400
            throw error
        }
        

        //check if duration of slot is more than 45 minutes

        var diffInHours = diff/1000/60/60;
        var diffInMinutes=diffInHours*60

        if(diffInMinutes>45){
            const error=new Error("Slot duration cannot exceed 45 minutes at once.")
            error.code=400
            throw error
        }

    //Check if slot is available or overlapping with other bookings

        //Existing Booking starts before my current end time and ends after my currnt start time ,
        //then bookings are overlapping

        const existingBookings=await Booking.findOne({
            slotId:slotId,
            StartTime: { $lt: new Date(reqEndTime) },
            EndTime: { $gt: new Date(reqStartTime) },
            status:'Booked'
        }

        //if Booking Found then Slot overlaps, throw error
        if(existingBookings){
            const error=new Error("Slot already taken.")
            error.code=400
            throw error
        }

        
        // create new booking if no overlapping
        const newBooking=new Booking({
            userId:req.user.id,
            slotId,
            StartTime:reqStartTime,
            EndTime:reqEndTime
        })

        await newBooking.save()
        res.json({
            status:'Success',
            message:"New booking created"
        })
        

        
    }
    catch(error){
        next(error)
    }
}



//checkIn for a booking(user)
const checkInSlot=async(req,res,next)=>{
    try{

        const bookingId=req.params.id

        
        //check for required fields
        
        if(!bookingId){
            const error=new Error('BookingId is required')
            error.code=400  
            throw error
        }


        //validate mongoose format for bookingId
        let isValid = mongoose.Types.ObjectId.isValid(bookingId);
        if(!isValid){
            const error=new Error('Invalid Mongoose ObjectID')
            error.code=400
            throw error
        }
        

        //find booking by Id
        const bookingFound=await Booking.findById({_id:bookingId})


        //throw error if booking not found
        if(!bookingFound){
            const error=new Error('Booking not found')
            error.code=404
            throw error
        }


        //Prevent double checkin if checkin if already done
        if(bookingFound.CheckIn!=null){
            const error=new Error('You have already checked-in.')
            error.code=400
            throw error

        }

        //prevent checkin for cancelled bookings
        if(bookingFound.status!=='Booked'){
            const error=new Error('Cannot checkin for cancelled Bookings')
            error.code=400
            throw error

        }


        //get current date and time for checkin
        let checkInDate=new Date()

        //convert Date to ISO string
        let checkInISODate=checkInDate.toISOString()


        //check if current checkin time falls between start and end time of slot else throw error
        if(checkInDate<bookingFound.StartTime ||checkInDate>bookingFound.EndTime){
            const error=new Error('Check in time should be between start and end time of slot')
            error.code=400
            throw error

        }
        
        // if booking found update the CheckIn date-time
        const booking=await Booking.findOneAndUpdate({
                userId:req.user.id,
                _id:bookingId,
                status:'Booked'
            },
            {CheckIn:checkInISODate,status:'Booked'},
            {new:true}
        )

        res.json({
            status:'Success',
            message:"Check-in successful"
        })







    }
    catch(error){
        next(error)
    }
}



////checkIn for a booking(user)

const checkOutSlot=async(req,res,next)=>{
    try{
        const bookingId=req.params.id

        //check for required fields
        if(!bookingId){
            const error=new Error('BookingId is required')
            error.code=400  
            throw error
        }
        

        //validate mongoose format for bookingID
        let isValid = mongoose.Types.ObjectId.isValid(bookingId);
            if(!isValid){
                const error=new Error('Invalid Mongoose ObjectID')
                error.code=400
                throw error
        }

        //find booking by Id
        const bookingFound=await Booking.findById({_id:bookingId})

        //if Booking doesnt exist, throw error
        if(!bookingFound){
            const error=new Error('Booking not found')
            error.code=404
            throw error
        }

        //prevent double checkout if checkout already done
        if(bookingFound.CheckOut!=null){
            const error=new Error('You have already checked-out.')
            error.code=400
            throw error

        }

        //prevent checkout if checkin not done
        if(bookingFound.CheckIn===null){
        const error=new Error('Cannot checkout. You need to check-in first.')
        error.code=400
        throw error
    
    }


        //convert json string to Date type
        const checkOutDate=new Date()

        //convert date to ISO string
        const checkOutDateISO=checkOutDate.toISOString()

        
        //check if current checkin time falls between start and end time of slot else throw error
        if(checkOutDate<bookingFound.StartTime ||checkOutDate>bookingFound.EndTime){
            const error=new Error('Check out time should be between start and end time of slot')
            error.code=400
            throw error

        }
    
        //if booking found, add booking checkout time and set booking slot status as available for future bookings
        const booking=await Booking.findOneAndUpdate({
                userId:req.user.id,
                _id:bookingId
            },
            {CheckOut:checkOutDateISO,status:'Available'},
            {new:true}
        )

        res.json({
            status:'Success',
            message:"Check-out successful"
        })
    }
    catch(error){
        next(error)
    }
}


//cancel slot by bookingId(user)
const cancelSlot=async(req,res,next)=>{
    try{

        const bookingId=req.params.id

        //validate mongoose ObjectId 
        let isValid = mongoose.Types.ObjectId.isValid(bookingId);
        if(!isValid){
            const error=new Error('Invalid Mongoose ObjectID')
            error.code=400
            throw error
        }

        
        
    //check if booking exists for a given Id
        const bookingExists=await Booking.findOne({
            _id:bookingId
                            })

    //if boooking not found throw error
        if(!bookingExists){
            const error=new Error('Booking not found for this bookingId')
            error.code=404
            throw error
        }


    //prevent cancelling if user already checkin
    if(bookingExists.CheckIn!=null){
        const error=new Error('Cannot cancel booking as you have already checked In')
        error.code=400
        throw error
    
    }
    
    //avoid double cancellation, if already cancelled
    if(bookingExists.status==='Cancelled'){
        const error=new Error('Booking is already cancelled. Cannot cancel again.')
        error.code=400
        throw error
    
    }


    //check if user tries to cancel his own bookings
    if(bookingExists.userId!=req.user.id){
        const error=new Error('This booking does not belong to you. Cannot cancel.')
        error.code=400
        throw error
    
    }
    

    //find bookingID and update status as cancelled if found
        const booking=await Booking.findOneAndUpdate({_id:bookingId,
            userId:req.user.id,
            status:'Booked',  //only cancel if status is Booked
            CheckIn:null  //should not cancel if user already checked in
        }, {status:'Cancelled'},{new:true})
        

        
        
        res.json({status:'Success',message:'Your booked slot has been cancelled successfully'})


    }
    catch(error){
        next(error)
    }
}

module.exports={bookSlot,checkInSlot,checkOutSlot,cancelSlot}