const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const multer = require('multer');
const fileUpload = require("express-fileupload");
const mongoose = require('mongoose');
const fs = require('fs');
const router = express.Router();
const path = require('path');
const session = require('express-session');
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const moment = require('moment');
const cloudinary = require('cloudinary').v2;

// Multer configuration
const storage = multer.diskStorage({});
const upload = multer({ storage });




cloudinary.config({ 
  cloud_name: 'dreeaspu9', 
  api_key: '122313789275299', 
  api_secret: '8Av31yZ4wi0aMBWvyYXcqQiQX0A' 
});



//twilio details
const accountSid = 'AC262b2535e1894989d11c2f2d3fd01694';
const authToken = '2ea176ee534ab97e8f7644b040988b3e';
const client = require('twilio')(accountSid, authToken);

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));


app.use(bodyParser.json());



//connection to the socioCashDatabase
mongoose.connect('mongodb+srv://sociocash21:SocioRyde1@sociocashcluster.kvjopxv.mongodb.net/socioCashDatabase', { useNewUrlParser: true});

// Set up Express session middleware
app.use(session({
  secret: 'mysecret',
  resave: false,
  saveUninitialized: false,
}));

//function for reminder message
function reminder(contacts , dateBorrowing , dueDate){
  const dateReminder = new Date();
  dateReminder.setDate(dateBorrowing.getDate() + 14);
  console.log("dateBorrowing" , dateBorrowing);
  console.log("2 WEEKS REMINDER DATE   :" , dateReminder); 
  console.log("Due Date DATE   :" , dueDate); 

  //formatted date
  const formattedReminderDate = dateReminder.toISOString();

  const formattedDueDate = dueDate.toISOString();
  
  
//processing contacts
const strContacts = contacts.toString();
const trimmedcontacts = strContacts.replace(/\s/g, "");
const formattedPhoneNumber = "+27" + trimmedcontacts.substring(1); 
  
  
  // Set the reminder message and recipient
  client.messages.create({
    body: 'from SocioCash..Hello, this is a reminder to settle your advance on  :'+dueDate,
    to: formattedPhoneNumber, // replace with the recipient's phone number
    from: '+15673722225', // replace with your Twilio phone number
    send_at: formattedReminderDate// replace with the desired date and time in ISO format
  })
.then(message => console.log('Scheduled message SID:', message.sid))
.catch(error => console.error('Error scheduling message:', error));
  
  // Set the dueDate message and recipient
/*  const message2 = {
    body: 'Hello, im just reminding you that your advance is due   :'+dueDate,
    to: formattedPhoneNumber, // replace with the recipient's phone number
    from: '+15673722225', // replace with your Twilio phone number
    dateSent: formattedDueDate // replace with the desired date and time in ISO format
  }; */
  
  
  
  
  // Create the message resource with the scheduled send date
  /*client.messages.create(message2)
    .then(message => console.log('Scheduled message SID:', message.sid))
    .catch(error => console.error('Error scheduling message:', error)); */
  
  
  }




//schema for registered users
const userSchema = new mongoose.Schema({
  fullnames: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  resetToken: {
    type: String,
    default: null,
  },
  resetTokenExpiration: Date,
  password: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  idNumber: {
    type: String,
    required: true
  },
  idDocument: {
    type: String,
    required: true
  },
  cellNumbers: {
    type: String,
    required: true
  },
  statement: {
    type: String,
    required: true
  },

  isAuthenticated :Boolean ,
  qualificationStatus: {
    type: String,
    required: true
  },
  oldMaxAmountToBorrow:{
    type: Number,
    min: 0.0,
    max: 10000.0
  },
    currentMaxAmountToBorrow:{
    type: Number,
    min: 0.0,
    max: 10000.0
  },
  amountOwing :{
    type: Number,
    min: 0.0,
    max: 10000.0
  },
  socioLevel : {
    type : String ,
    required : true
  }

});
const User = mongoose.model('user', userSchema);

//advance Request Schema
const advanceRequestSchema = new mongoose.Schema({
  idNumber: {
    type: String,
    required: true
  },
  contacts: {
    type: String,
    required: true
  },
  accType: {
    type: String,
  },
  userKey: {
    type: String,
    required: true
  },
  amountBorrowing :{
    type: Number,
    min: 0.0,
    max: 10000.0,
    required: true
  },
  amountToPay :{
    type: Number,
    min: 0.0,
    max: 10000.0,
    required: true
  },
    currentAmountToPay :{
    type: Number,
    min: 0.0,
    max: 10000.0,
    required: true
  },
  dateBorrowing :{
    type: Date,
    required: true     
  },
  onceOff :{
    type : String,
    required : true
  },
  dateToPay :{
    type: Date,
    required: true     
  },
  status :{
    type : String,
    required : true
  },
  paymentStatus :{
    type : String,
    required : true
  }
});
const AdvanceRequest = mongoose.model('advanceRequest', advanceRequestSchema);

//receipt schema
const ReceiptSchema = new mongoose.Schema({
  datePaid :{
    type: Date,
    required: true 
  },
    idNumber: {
    type: String,
    required: true
  },
   amountPaid :{
    type: Number,
    min: 0.0,
    max: 10000.0,
    required: true
  },

});

const Receipt = mongoose.model('receipt', ReceiptSchema);

//Gift schema
const GiftSchema = new mongoose.Schema({
  userKey :{
    type: String,
    required: true 
  },
    idNumber: {
    type: String,
    required: true
  },
  Name: {
    type: String,
    required: true
  },
    SocioLevel: {
    type: String,
    required: true
  },

});

const Gift = mongoose.model('gift', GiftSchema);


//bad debtor schema
const badDebtorSchema = new mongoose.Schema({
  userKey :{
    type: String,
    required: true
  }, 

    dateBorrowed : {
      type : Date,
      required : true
    },
    dateToPay : {
      type : Date,
      required : true
    },
    idNumber : {
      type : String,
      required : true
    },
    amountBorrowed : {
      type: Number,
      min: 0.0,
      max: 10000.0,
      required: true
    },
    amountToPay :   {
      type: Number,
      min: 0.0,
      max: 10000.0,
      required: true
    }

});

const BadDebtor = mongoose.model('badDebtor', badDebtorSchema);



app.post('/api/registration', upload.fields([
  { name: 'statement', maxCount: 1 },
  { name: 'id', maxCount: 1 }
]),  (req, res) => {

  const file1 = req.files['statement'][0];
  const idNumber2 = req.body.idNumber;
 const file2 = req.files['id'][0];


  

  // Upload PDF statement file to Cloudinary
cloudinary.uploader.upload(file1.path, {
  public_id: "statement" + idNumber2 ,
  resource_type: 'auto', // Automatically detect file type
  folder: 'pdfs' // Specify the folder where the file should be stored
})
.then((result) => {
  // The uploaded file is treated as a PDF
  console.log('PDF URL:', result.secure_url);

     // Upload image file to Cloudinary
    cloudinary.uploader.upload(file2.path, { folder: 'images' ,public_id: "id"+idNumber2 
  })
  .then((result2)=>{


  // Save the URL to your database or use it as needed in your application

    const statement2 = result.secure_url;
  
  
        console.log("statement url    :" , statement2);
        console.log("image url" ,result2.secure_url);
        const fullnames = req.body.fullnames;
        const surname = req.body.surname;
        const cellNumbers = req.body.cellNumbers;
        const idNumber = req.body.idNumber;
        const email = req.body.email;
        const password = req.body.password;
      
      
      
       console.log("surname  :"+surname );
       console.log("fullnames  :"+fullnames);  
       console.log("cellNumbers  :"+cellNumbers); 
       console.log("idNumber  :"+idNumber); 
       console.log("email  :"+email); 
       console.log("password  :"+password); 
       
      
      
      
      //saving to users collections
      const newUser = new User({
        fullnames: fullnames,
        email: email,
        password: password,
        surname : surname,
        cellNumbers : cellNumbers,
        statement : statement2,
        idDocument : result2.secure_url,
        idNumber : idNumber,
        isAuthenticated : false,
        qualificationStatus :"in-process",
        oldMaxAmountToBorrow : 0.00,
        currentMaxAmountToBorrow : 0.00,
        amountOwing : 0.00,
        socioLevel : "SocioLite"
        
      });
      const date = new Date();
      
      newUser.save()
        .then(doc => {
          // Handle the result of the save operation here
          console.log("successfully saved data");
      
          //send message to denias
          client.messages.create({
            body: 'Hello Dr Cash.., There is a new registrant with the following email:'+email,
            to: '+27678794560', // replace with the recipient's phone number
            from: '+15673722225', // replace with your Twilio phone number
            send_at: date// replace with the desired date and time in ISO format
          })
        .then(message => console.log('Scheduled message SID:', message.sid))
        .catch(error => console.error('Error scheduling message:', error));
      
      
      
          res.redirect('/');
        })
        .catch(err => {
          // Handle any errors that occurred during the save operation here
          console.log(err);
        });


  })

})
.catch((error) => {
  console.error('Error uploading PDF:', error);
});
  

});




app.get('/api/auth', (req, res) => {
  //check if user is qualified
 

  //find current user
  const userId = req.session.userId.toString();
  console.log("user id :"+userId);

  if(userId){
      //document from current user
  User.findById(userId)
  .then((user) => {
    console.log('Userqual   :   '+ user.qualificationStatus);
    const data = { qualificationStatus: user.qualificationStatus };
    res.json(data);
  })
  .catch((err) => {
    res.json(err);
  });

  }
  else{
    console.log("user not found");
  }



});

app.post('/api/login' , (req , res) => {

  const loginDetails = req.body;
  const userEmail  = loginDetails.email;
  const password = loginDetails.password;
  console.log("email; :"+ userEmail);
  console.log("password; :" +password);

  // Find the user in the database by their username
  User.findOne({ email: userEmail })
  .then(user => {
    if (!user) {
      return res.status(401).json({message :'Invalid username or password'});
    } 
    
    else {
       // Check the user's password
    if (user.password !== password) {
      return res.status(401).json({message :'Invalid username or password'});
    }

    else{
 // Store the user's ID in the session object
 req.session.userId = user._id;
  
 //send a success message to react home page
 res.status(200).json({ message: 'Login successful' });
    }
   
  
    }
  })
  .catch(error => {
    console.error('Error finding user:', error);
  });

});

app.post('/api/getAdvance' , (req , res) =>{
  const advanceDetails = req.body;
  const howMuch = advanceDetails.howMuch;
  const paymentType = advanceDetails.paymentType;
  console.log("paymentType :   " , paymentType);
  var contacts2 = "";
  var accType = "";
  var contacts ="";
  console.log("howMuch  " + howMuch);


  if(paymentType ==="cashSend"){
    contacts = advanceDetails.contacts;
    console.log("contacts for cashsend   :" , contacts);
  }
  else if(paymentType==="bank") {
    contacts2 = advanceDetails.accNumber;
    accType = advanceDetails.accType;
    console.log("bank contacts  :" , contacts2);
    console.log("acc Type:   ",accType);
  
  }

  //find maxAmount to borrow of the current User

  //find current user
  const userId = req.session.userId;
  console.log("userId  :" + userId);
  User.findById(userId)
  .then((doc) => {
    const maxAmountToBorrow = doc.currentMaxAmountToBorrow
    console.log('MaxAmountToBorrow   :   '+ maxAmountToBorrow);
    const amountOwing = doc.amountOwing;
    if(howMuch > maxAmountToBorrow){
      //advance higher than maxToBorrow
      res.json({ message: 'The advance you are requesting is higher than  your maximum amount to borrow' });
      
    }
    else{
      //does the user owe money
      if(amountOwing > 0){
        res.json({message : "You need to settle your current advance first before requesting for another one"});
      }

       else if(amountOwing ===0){
        //get todays date
        const today = new Date();
        //get due date
        const dueDate = new Date(); // create a new date object
        dueDate.setDate(today.getDate() + 30); // add 30 days to the new date object
        const amountToPay = howMuch * 135 / 100 ;
        console.log("amountToPay    :" , amountToPay)


        //take transaction to advanceRequest collection
        var newAdvanceRequest = {};
     //if cashSend
        if(paymentType ==="cashSend"){

          newAdvanceRequest = new AdvanceRequest({
            idNumber: doc.idNumber,
            userKey: userId,
            contacts : contacts,
            amountBorrowing: howMuch,
            amountToPay : amountToPay,
            currentAmountToPay : amountToPay,
            dateBorrowing : today,
            onceOff : "yes",
            dateToPay : dueDate,
            status  : "pending",
            paymentStatus : "unpaid"
          });
        }

        else if(paymentType === "bank"){
          newAdvanceRequest = new AdvanceRequest({
            idNumber: doc.idNumber,
            userKey: userId,
            contacts : contacts2,
            accType : accType,
            amountBorrowing: howMuch,
            amountToPay : amountToPay,
            currentAmountToPay : amountToPay,
            dateBorrowing : today,
            onceOff : "yes",
            dateToPay : dueDate,
            status  : "pending",
            paymentStatus : "unpaid"
          });
        }
   

        //saving advanceRequest
        newAdvanceRequest.save()
        .then(doc2 => {

         // Handle the result of the save operation here
        console.log("successfully saved data");     
        const date2 = new Date(); 
       

        //update amount owing in users collection
        User.findByIdAndUpdate(userId , { amountOwing: amountToPay }, { new: true })
        .then(doc3 => {
          console.log("amountPaid updated to   :" , amountToPay); // logs the updated user object

           //send message to Thato
           client.messages.create({
            body: 'Hello Thato.., There is a new advance request with the following idNumber:'+doc.idNumber,
            to: '+27699712992', // replace with the recipient's phone number
            from: '+15673722225', // replace with your Twilio phone number
            send_at: date2// replace with the desired date and time in ISO format
          })
        .then(message => console.log('Scheduled message SID:', message.sid))
        .catch(error => console.error('Error scheduling message:', error));

        })
        .catch(err => {
          console.error(err);
        });

        res.json({message :"success"})
        })
        .catch(err => {
        // Handle any errors that occurred during the save operation here
        console.log(err);
        res.json({message : err});
        });

       }
    }
    
    

  })
  .catch((err) => {
    res.json(err);
  });


});

app.get('/api/dashboard' , (req , res) =>{
  const userId = req.session.userId;



  User.findById(userId)
  .then((doc) =>{
const info = {
  maxAmountToBorrow : doc.currentMaxAmountToBorrow,
  amountOwing : 0,
  socioLevel : doc.socioLevel,
  dueDate : "",
  dateBorrowing :"",
  cellNumbers : doc.cellNumbers
}
console.log("maxAmountToBorrow   :" + info.maxAmountToBorrow);
console.log("amountOwing   :" + info.amountOwing);
console.log("SocioLevel  :" + info.socioLevel);




//send a message if socioLevel = SocioElite
if(doc.socioLevel ==="SocioElite"){
Gift.findOne({userkey :userId})
.then((gifts) =>{
  if(!gifts){
const fullnames = doc.fullnames +" "+doc.surname;
     //take gift to gift collections
      const giftSave = new Gift({
        userKey: userId,
        idNumber: doc.idNumber,
        Name : fullnames,
        SocioLevel : "SocioElite"         
      });

      giftSave.save()
      .then((saved) =>{
        console.log("gifts saved");

      //send messgae to SocioCash admin
        // Set the reminder message and recipient
//date
const date2 = new Date();


  const messageT = {
    body: 'SocioCash king..please prepare a gift for  :'+doc.fullnames +"  "+doc.surname+
    "  wih the following ID number  :" +doc.idNumber,
    to: "+27699712992", // replace with the recipient's phone number
    from: '+15673722225', // replace with your Twilio phone number
    dateSent: date2 // replace with the desired date and time in ISO format
  };

  const messageD = {
    body: 'SocioCash king..please prepare a gift for  :'+doc.fullnames +"  "+doc.surname+
    "  wih the following ID number  :" +doc.idNumber,
    to: "+27678794560", // replace with the recipient's phone number
    from: '+15673722225', // replace with your Twilio phone number
    dateSent: date2 // replace with the desired date and time in ISO format
  };

    // Create the message resource with the scheduled send date
    client.messages.create(messageT)
    .then(message => console.log('Scheduled message SID:', message.sid))
    .catch(error => console.error('Error scheduling message:', error));
    console.log('Gift message : ',messageT);


    client.messages.create(messageD)
    .then(message => console.log('Scheduled message SID:', message.sid))
    .catch(error => console.error('Error scheduling message:', error));
    console.log('Gift message : ',messageD); 


      })
      .catch((err) =>{
        console.log(err);
      })

  }
  else if(gifts){
    console.log("Already received a gift");

  }

 
})
}





//find dueDate
AdvanceRequest.findOne({userKey :userId})
.then((doc2) =>{
  if(!doc2){
    res.json(info)
  }
  else{

//check if the advance is paid or not
if(doc2.paymentStatus === "paid"){
  res.json(info);
}

else{

      //check if the advanceRequest is approved or not
      const advanceStatus = doc2.status;
      if(advanceStatus ==="pending"){
        res.json(info)
      } 
      else if (advanceStatus ==="approved"){
        info.dueDate = doc2.dateToPay ;
        info.amountOwing = doc2.currentAmountToPay;
        info.dateBorrowing = doc2.dateBorrowing;
  
          //reminder system  
          const currentDate = new Date();
          const futureDate = new Date(currentDate.getTime() + (2 * 60 * 1000));  
          reminder(info.cellNumbers ,info.dateBorrowing , info.dueDate);
         
        
        
  
  
          
  
        //update amountOwing on User collection
        User.findByIdAndUpdate(userId , { amountOwing: info.amountOwing }, { new: true })
        .then(updatedDocument => {
        console.log('Updated document is successful');
        })
        .catch(err => {
        console.log('Error:', err);
        });
  
  //Decide to decrease the maxAmountToBorrow or not
  const paymentStatus = doc2.paymentStatus; //payment status of the transaction
  
  const dueDate = doc2.dateToPay; //dueDate of the user in the advance requests table
  const currentDate2 = new Date(); // Today's date
  
  //difference between current Date and dueDate
  // Calculate the difference in milliseconds
  const diffMs = currentDate2 - dueDate;
  // Convert the difference to days
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  console.log(`The difference between the due date and today is ${diffDays} days.`);
  
  
  
  
  //payment status of user
  if(paymentStatus ==="unpaid"){
  
  
  
    //record bad debtors
        if(diffDays >= 30){

          BadDebtor.findOne({userKey : userId})
          .then((bDebtor)=>{
            if(!bDebtor){
              const badDebtor = new BadDebtor({
                userKey : userId,
                dateBorrowed : doc2.dateBorrowing  ,
                dateToPay : doc2.dateToPay ,
                idNumber : doc.idNumber,
                amountBorrowed : doc2.amountBorrowing ,
                amountToPay :   doc2.amountToPay     
              });
              badDebtor.save()
              .then((bDebtor)=>{
                console.log("badDebtor saved");
              })
              .catch((err)=>{
                console.log(err);
              })
            }
            else{
              console.log("already recorded bad debtor");
            }
          })

          }
      
    
    
    
    
    
    
    
    
    
    if(diffDays > 0){
    const maxAmountToBorrow2 = doc.oldMaxAmountToBorrow;
    console.log("old maxAmount To Borrow :",maxAmountToBorrow2);
    //maxAmountDecreases by 1 percent
    const subtractAmount = maxAmountToBorrow2 *0.01*diffDays;
    console.log("amount subtracted  by  :",subtractAmount);
    const newMaxAmountToBorrow = maxAmountToBorrow2 - subtractAmount;
    console.log("newMaxAmountToBorrow   by  :",newMaxAmountToBorrow );
    
    
    //change maxAmountToBorrow
    User.findByIdAndUpdate(userId ,{currentMaxAmountToBorrow :newMaxAmountToBorrow } ,{ new: true })
    .then((doc5) =>{
    console.log("newMaxAmountToBorrow   :" , newMaxAmountToBorrow);
    
    //find number of user
    const strContacts = doc5.cellNumbers.toString();
    const trimmedcontacts = strContacts.replace(/\s/g, "");
    const formattedPhoneNumber2 = "+27" + trimmedcontacts.substring(1); 
    
    //send user message
      // Set the reminder message and recipient
      const message5 = {
        body: 'From SocioCash...We would like to inform you that your maximum amount to borrow has reduced from  R  :'+maxAmountToBorrow2+ '    to:   R'+newMaxAmountToBorrow ,
        to: formattedPhoneNumber2, // replace with the recipient's phone number
        from: '+15673722225', // replace with your Twilio phone number
        dateSent: currentDate // replace with the desired date and time in ISO format
      };
    
       // Create the message resource with the scheduled send date
      client.messages.create(message5)
        .then(message => console.log('Scheduled message SID:', message.sid))
        .catch(error => console.error('Error scheduling message:', error));
        console.log('Twilio : ',message5);
    
    
    })
    .catch((err) =>{
      console.log(err);
    })
  
      //late payment policy
    //add interest on current amount to pay
    const interest = diffDays * 0.013
    console.log("Total late payment interest  :" , interest);
    const oldAmountToPay = doc2.amountToPay ;
    const currentAmountToPay = (oldAmountToPay * interest) + oldAmountToPay;
    console.log("currentAmountToPay  :" , currentAmountToPay);
    AdvanceRequest.findOneAndUpdate({userKey : userId} , {currentAmountToPay : currentAmountToPay} ,{ new: true })
    .then((updatedLatePayment)=>{
     console.log("late payment policy amount updated to  :", updatedLatePayment.currentAmountToPay);
    })
    .catch((err)=>{
      console.log(err);
    })
    }
    }
  
  
      
  
        res.json(info)
      }   

}



    
   
  }

})
.catch((err) =>{
  res.json(err)
})

//Gamification
var amountPaid = [];
const idNumberUser = doc.idNumber;
Receipt.find({idNumber :idNumberUser})
.then((receipts)=>{
  for(x=0; x< receipts.length;x++){
    amountPaid.push(receipts[x].amountPaid);
  }
  console.log("amountPaid   :",amountPaid);
  const totalPaidSum = amountPaid.reduce((accumulator, currentValue) => accumulator + currentValue, 0);
  console.log("totalPaid  :" ,totalPaidSum );

    //send message to admin
if(totalPaidSum => 2500){

  User.findByIdAndUpdate(userId , { socioLevel: "SocioLite" }, { new: true })
  .then((user3)=>{
    console.log("changed to SocioLite")
})
  .catch((err)=>{
    console.log(err)
  })


}

else if (totalPaidSum > 2500 && totalPaidSum < 3500){
  User.findByIdAndUpdate(userId , { socioLevel: "SocioLite2" }, { new: true })
  .then((user3)=>{
    console.log("changed to SocioLite2")
})
  .catch((err)=>{
    console.log(err)
  })

}

else if (totalPaidSum => 4500 && totalPaidSum < 5000){
  User.findByIdAndUpdate(userId , { socioLevel: "SocioElite" }, { new: true })
  .then((user3)=>{
    console.log("changed to SocioElite")
})
  .catch((err)=>{
    console.log(err)
  })
}

else if (totalPaidSum => 6000){
  User.findByIdAndUpdate(userId , { socioLevel: "SocioSupreme" }, { new: true })
  .then((user3)=>{
    console.log("changed to SocioSupreme")
})
  .catch((err)=>{
    console.log(err)
  })
}






})
.catch((err)=>{
  console.log(err);
});


  })
  .catch((err) =>{
    res.json(err)
  })
});

app.post("/api/forgotPassword" ,  (req , res) =>{
  const email2 = req.body.email;
  const idNumber = req.body.idNumber;
  console.log("forgot password email   :" , email2);
  console.log("forgot password idNumber    :" , idNumber );

  User.findOne({email : email2})
  .then((user)=>{
    if (!user) {
      return res.status(404).json({ responseMessage: 'User not found' });
      console.log("user nt found password");
    }
    else{
      if(user.idNumber ===idNumber){
     res.json({responseMessage : "user is valid"});
     console.log("user found ");
      }
      else if(user.idNumber !==idNumber){
        res.json({responseMessage : "idNumber is not valid"});
        console.log("user n0t found password");
         }
    }


  })
});

app.post('/api/resetPassword', (req , res) =>{
  const newPassword = req.body.newPassword;
  const email = req.body.email;
  console.log("new password  :" , newPassword);
  console.log("new email  :" , email);

User.findOneAndUpdate({email : email} , {password : newPassword} ,{new : true})
.then((newPass) =>{
  if(!newPass){
    res.json({message :"user not found"})
  }
  else{
    res.json({message : "password updated successfully"});
    console.log("password updated successfully")
  }
})
.catch((err)=>{
  res.json({message : err});
})

})

//react app
// All other requests will be handled by React
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});



let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}
app.listen(port , ()=>{
console.log("listening to port 5000");
});
