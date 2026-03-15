const Booking=require('../models/Booking')
const Slot=require('../models/Slot')
const mongoose=require('mongoose');


// Function to validate date Format "YYYY-MM-DD" (Y-year, M- month, D - date)
function isValidDate(stringDate) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    return regex.test(stringDate);
}


// function to validate Date in ISO format YYYY-MM-DDThh:mm:ss
function isIsoDate(str) {
  if (!/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/.test(str)) return false;
  const d = new Date(str); 
  return !isNaN(d.getTime()) && d.toISOString()===str; // valid date 
}


//View own bookings(user)
const getmyBookings=async(req,res,next)=>{
    try{

        //check if bookings exist for a user and sort it in ascending order if it exists.
       const bookings= await Booking.find({userId:req.user.id}).sort({StartTime:'asc'}).populate('slotId')


       //throw error if no bookings found
       if(bookings.length===0){
        const error=new Error('No bookings found for this user')
        error.code=404
        throw error
       }

       res.json({
        status:'Success',
        YourBookings:bookings

       })


    }
    catch(error){
        next(error)
    }
}


//get all bookings (admin)
const getAllBookings=async(req,res,next)=>{
    try{

        //find bookings if they exist with user data who booked (without password field). and which resource booked(slotId)
        const bookings=await Booking.find({}).populate('userId','-password').populate('slotId')


        //if bookings not found throw error
        if(bookings.length===0){
        const error=new Error('No bookings found')
        error.code=404
        throw error
       }

       res.json({
        status:'Success',
        YourBookings:bookings

       })

    }
    catch(error){
        next(error)
    }
}


//get bookings by date(admin)
const getBookingsByDate=async(req,res,next)=>{
    try{
        
        //check of empty request body
        if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;

    }
    const {date}=req.body
    
    
    // check for required fields
    if(!date ){
        const error=new Error('date is required')
        error.code=400
        throw error;
    }


    // check if invalid fields are given in req.body
    const allowedFields=['date']
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('only date is allowed in request body')
            error.code=400
            throw error;
        }
    }

    
    //validate date format
    if(!isValidDate(date)){
        const error=new Error("Invalid date format (should follow Format YYYY-MM-DD)")
        error.code=400
        throw error
    }


//Logic for finding all bookings on a give date

    //Convert json string to date format
    const reqDate=new Date(date)


//store day start and day end time, to check for bookings falling between dayStartTime and dayEndTime

    //convert date type to ISO string format for comparison
    const dayStartISODate=reqDate.toISOString();


    //store day End time and convert it to Date type
    const endofDayTime=new Date(`${date}T23:59:59.000Z`)
    
    //convert date type to ISO string format for comparison
    const dayEndISODate=endofDayTime.toISOString();


    //find all bookings on given date and with status as Booked 
    const bookings=await Booking.find({StartTime: { 
        $gte:dayStartISODate,
        $lte: dayEndISODate
     },
    status:'Booked'
    }).populate('userId','-password').populate('slotId') //avoid password field in response


    //throw error if no bookings found
    if(bookings.length===0){
        const error=new Error('No bookings found for this date')
        error.code=404
        throw error
       }
    
    

       res.json({
        status:'Success',
        BookingsByDate:bookings

       })


    }
    catch(error){
        next(error)
    }
}


const availableSlotsByDate=async (req,res,next)=>{
    try{

    //check for empty request body
    if(!req.body){
        const error=new Error('Missing fields')
        error.code=400
        throw error;
    }

    const {date,slotId}=req.body

    //check for required fields
    if(!date||!slotId ){
        const error=new Error('slotId,date are required')
        error.code=400
        throw error;
    }


    //check for invalid fields in request body
    const allowedFields=['slotId','date']
    for(let key in req.body){
        if(!allowedFields.includes(key)){
            const error=new Error('Only slotId,date are allowed in request body')
            error.code=400
            throw error;
        }
    }


    //validate mongoose format for slotId
    let isValid = mongoose.Types.ObjectId.isValid(slotId);
            if(!isValid){
                const error=new Error('Invalid Mongoose ObjectID')
                error.code=400
                throw error
            }
    

    //validate date in Format YYYY-MM-DD
    if(!isValidDate(date)){
        const error=new Error("Invalid date format (should follow Format YYYY-MM-DD)")
        error.code=400
        throw error
    }

    const slotExists=await Slot.findOne({_id:slotId})
    if(!slotExists){
        const error=new Error('SlotType does not exist')
        error.code=400
        throw error
    }


    // Find all Bookings on given date by filtering if they fall between day start time and day end time
    
    //convert json string to Date format
    const reqDate=new Date(date)
    //convert Date to ISO string for comparing
    const dayStartISODate=reqDate.toISOString();


    //set End of day time 
    const endofDayTime=new Date(`${date}T23:59:59.000Z`)

    //convert Date to ISO string for comparing
    const dayEndISODate=endofDayTime.toISOString();

    //find all bookings on given date, for a given slotType and status as Booked
    const booking=await Booking.find({StartTime: { 
        $gte:dayStartISODate,
        $lte: dayEndISODate
     },
    status:'Booked',
    slotId:slotId
    })


    let arr=[] //store all booked slot timings

    //extract only the time part of ISO String and store it in an array
    booking.forEach(a => {

        const startTime=a.StartTime.toISOString().split('T')[1].slice(0,5)
        const endTime=a.EndTime.toISOString().split('T')[1].slice(0,5)


        arr.push({startTime:startTime,endTime:endTime})

        
    });

    //Logic to find gaps between bookings and find available times

    //set day start and end timings
    let current='00:00'
    const dayEnd='23:59'


    //empty array to store available slots
    let availableSlots=[]

    //sort all slots by start time
    arr.sort((a,b)=>a.startTime.localeCompare(b.startTime))
    
    //check if there is a gap between current time and First booking start time.
    arr.forEach(a=>{
        if(a.startTime>current)
            //if gap found, store current time and start time of booking in availableSlots
            availableSlots.push({startTime:current,endTime:a.startTime}) 
        //update current time with end time of first slot and iterate
        current=a.endTime

    })

    //check for last available slot of the day (last gap between last booked and day End Time)
    if(current<dayEnd){
        availableSlots.push({startTime:current,endTime:dayEnd}) //add last slot to availableSlots array
    }

    //If day is fully booked throw error
    if(!availableSlots ||availableSlots.length==0){

        const error=new Error('No available slots found on this date')
        error.code=404
        throw error
    }

    res.json({status:'success',
        AvailableSlots:
        availableSlots

    })


    }
    catch(error){
        next(error)
    }
}


//get available facilitis or slotTypes to book
const getSlotTypes=async(req,res,next)=>{
    try{
        //find slotTypes by Id
        const slot=await Slot.find({})
        
        //throw error if no resources found
        if(slot.length===0){
            const error=new Error('No slots found')
            error.code=404
            throw error
        }

        res.json({
            status:'success',
            SlotTypes:slot
        }
        )
    }
    catch(error){
        next(error)
    }
}

module.exports={getmyBookings,getAllBookings,getBookingsByDate,availableSlotsByDate,getSlotTypes}
