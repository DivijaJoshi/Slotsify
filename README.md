# Slot Booking System for Hostel Facilities

One common problem I faced living in Hostels was that most of us had similar office or work schedules,so peak hours in recreational room became chaotic. When everyone needed to use the shared games room facilities at the same time. It resulted in long wait times or unnecessary quarrels.

To solve this problem, I built a Slot Booking system that allows you to book slots in advance and make it more convenient for everyone.

*Here are some things I kept in mind for building it.*

1. One can book slots of duration not more than 45 min to keep it convenient for others.
2. Auto (checkin) or (checkout) when they start or finish using the slot to make it available for others to book.(in case they finish early mark the slot as available)
3. Users should be able to view available slots filtering by Date and Resource ( for e.g. game room(chess) or game room (foosball))
4. No two overlapping slots will be allowed to book.
5. Users should be able to view their own bookings sorted by start time to track.
6. Assumption: There are 2 slot types (2 games rooms for different games) available to book 24/7.
7. Users can cancel their bookings if they want.
8. Only admin should be able to add or delete slot types. (In case resources increase later allows scalability)

---

## Schema Design for MongoDB

---

#### Users:

```
id
Name
Email
Password
Role (user(default)/admin)
```

#### Bookings:

```
id
userId: references User collection id
SlotId: references Slot collection id
StartTime:
EndTime:
CheckIn:
CheckOut:
Status: Booked(default)/ Cancelled (when user cancels)/ Available  {after checkout mark the status as available so early checkout allows future bookings}
timestamp
```

#### Slots:

```
id
SlotName
```

---

## API(15)

---

#### Auth Endpoints:

1. Signup(user/admin)
2. Login(user/admin)

#### Booking logic endpoints:

3. Get my bookings(user)
4. Get all Bookings(admin)
5. Get Bookings by date(admin)
6. Get available slots by date and Slot name(Resource name)(user/admin)
7. Get slot types(Resource names like game room(chess) or (foosball) whichever are available)(user/admin)

#### User action endpoints:

8. Book slot(user)
9. Cancel booking(user)
10. Slot checkin (user)
11. Slot checkout (user)

#### Admin action endpoints:

12. Get all Users (admin)
13. Delete users (admin)
14. Add more slot types(admin) B1,B2,B3 etc (admin)
15. Delete slot types (admin)

---

## Main Design Process

---

### 1) The very foundation of Slot Booking system was handling both date and time format simultaneously with mongoose schema.

One way was to store time and date separately in UTC(Universal time format) and date in (YYYY-MM-DD) format.

Instead of going with above format, I used ISO date format **YYYY-MM-DDTHH:mm:ss.sssZ** which is a standard format representing UTC with date and time both together as a single string.

Single string for Date and time made it easier for filtering and overlapping bookings logic.

---

### 2) Booking Process

> **Step 1: User views all the available facility types to book (Different game rooms in this case chess, foosball etc) *{What to Book?}***
>
> **Step 2: Users views Available Slots for each facility filtered by a specific date. *{When to Book}***
>
> **Step 3: Users can book Slot by putting**
> - ***SlotId of the Resource(which facility),***
> - ***Start time of slot***
> - ***End time of slot***

Setting time limit of max 45 minutes make the facilities more accessible for everyone.

---

### 3) Bookings Overlapping logic:

Check if slot is available or overlapping with other bookings

```js
const existingBookings=await Booking.findOne({
    slotId:slotId,
    StartTime: { $lt: new Date(reqEndTime) },
    EndTime: { $gt: new Date(reqStartTime) },
    status:'Booked'
})
```

**Logic:** If Any existing book starts before my booking time ends and existing booking ends after my booking starts, that means the bookings are overlapping.

---

### 4) Checkin Checkout logic

> In case Users finish earlier than the Booking end time, this logic makes the slot available and free for others to book.

Conditions for checkin/checkout:

1. User shouldnt have checkedin/checkedout already ie if(checkin!=null user has already checked in and vice versa)
2. Checkin/ Checkout shouldnt be allowed for cancelled bookings
3. Auto Checkin and checkout by getting current time to avoid user manipulation with data.
4. Checkin and checkout should only be allowed between booking start time and end time
5. checkout shouldnt be allowed in case user hasnt checked in.

> // Handling Edge Case: If someone tries to book a slot at 11:30 pm today till 12:10 am tomorrow, throw an error.
> Allow only same day start and end times.

---

### 5) Users can cancel their slot if they want to

Conditions of Cancelling:

1. Users shouldn't have already checked in to the booking
2. Only user who made the booking can cancel it.

---

### 6) Authentication (RBAC Role Based access control)

There are 2 Roles user and admin for this project. So I implemented **RBAC** in auth middleware.

- User creates an account
- Hashed password stored in DB
- User receives a token signed with Secret key.

For any protected route, auth middleware verifies the role of the user using ***isAdmin*** and ***isUser*** middlewares. if Token is verified. users can access protected routes.

---

### 7) Admin routes

Admin can *get all users, delete users, add resources, delete resources, View all bookings, View all bookings by Date*.

Scalability:
In case later the resources increase, Theres a slot Model where Admin can increase or decrease them.(in case of maintainance or updates)

---

## Challenges Faced

---

#### 1) First challenge I faced was handling date and time and learning different formats.

> Bookings depended on accurate timings, and filtering.

Using ISO format solved it as it allowed comparison operators like **$gt,** **%lt** to filter dates easily.

Storing date and time together brought it down to lesser comparisons.

ISO format is universally accepted and later can be converted to local timezones easily like ASIA/KOLKATA using library like **'moment-timezone'.**

---

#### 2) Second Major challenge was thinking about Bookings Overlapping logic.

It started with **5 conditions:**

> S = Existing Booking start time
> E = Existing Booking end time
> RS=Requested start time
> RE= Requested end time

> Case 1) Existing booking starts before requested start and ends inside requested slot
>
> ***S< RS and E>RS***
>
> Case 2) Existing booking starts within requested slot
>
> ***S>=RS and S<RE***
>
> Case 3) Existing booking is fully inside the requested slot
>
> ***S>RS and E<RS***
>
> Case 4) Existing Booking overlaps the request slot or extends
>
> ***S<=RS and E>=RE***
>
> Case 5) Existing booking ends inside requested slot
>
> ***S< RE and E>RE***

All of this was simplified to:

> **S< RE and E>RS**

```js
const existingBookings=await Booking.findOne({
    slotId:slotId,
    StartTime: { $lt: new Date(reqEndTime) },
    EndTime: { $gt: new Date(reqStartTime) },
    status:'Booked'
})
```

Logic: If Any existing book starts before my booking time ends and existing booking ends after my booking starts, that means the bookings are overlapping.

---

#### 3) Most complex part was the Available Slots Implementation.

→ My thought process for this logic was to get all the available bookings for a particular slotType,
→ Store only the Start and end times of all bookings in an array.

→ Splitting the ISO String to get only the time part of it and store it in an array.

```js
const startTime=a.StartTime.toISOString().split('T')[1].slice(0,5)
const endTime=a.EndTime.toISOString().split('T')[1].slice(0,5)
```

→ Set variables:
Start of day time: 00:00
End of day time: 23:59

→ And calculate gaps throughout the entire day.

This was achieved by Sorting the array first by start time.

```js
arr.forEach(a=>{
    if(a.startTime>current)
    availableSlots.push({startTime:current,endTime:a.startTime})
    current=a.endTime
})
```

→ Check final gap:

```js
if(current<dayEnd){
    availableSlots.push({startTime:current,endTime:dayEnd})
}
```

---

#### Features:

1. MVC architecture following models, views, controllers, routes, config folder structure
2. Global error handler
3. Authentication and RBAC
4. Resource Scaling using seperate Slot schema
5. Overlapping Slots prevention Logic
6. Date based Slot Availability Check
7. Slot checkin checkout for better timeslot management
8. ISO date-time handling

---

#### Future Enhancements I considered are:

1. Implementing a logic for handling no showups for a given time window of 10 minutes.

If anyone doesn't show up or checks in within 10 minutes of Slot Start time, Release the slot as available for others to book. Integrating RabbitMq for sending messages at scheduled intervals and releasing slots.

2. Normalising time zones to users local region time zone, making it scalable for users in different regions.
