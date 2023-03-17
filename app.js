require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');


console.log(process.env);
const app = express();

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
});
// const Secret =  "thisisourlittlesecret";
// const ssecret = process.env.SOME_LONG_UNGUESSABLE_STRING;

userSchema.plugin(encrypt,{secret:process.env.SECRET_KEY, encryptedFields:['password']});

const User = new mongoose.model('user', userSchema);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));


app.get('/',function(req,res){
    res.render('home');
});
app.get('/register',function(req,res){
    res.render('register');
});

app.get('/login',function(req,res){
    res.render('login');
});

app.get('/logout',function(req,res){
 res.redirect('/');
});
// app.get('/secrets',function(req,res){
//     res.render('secrets');
// })

app.post('/register', async(req,res) => {
  try{
    const Email = req.body.username;
  const Password = req.body.password;

  const newUser = new User ({
    email: Email,
    password: Password,
  });
  const savedUser = await newUser.save();
  console.log(savedUser);
    if(savedUser){
     res.render('secrets');
    }

  }catch(e){
    res.send(e);
  }
  
});

app.post('/login', async(req,res)=>{
 try{
    const userName = req.body.username;
    const Password = req.body.password;
   
    const foundedUser = await User.find({email: userName});
    
    if(foundedUser[0].email === userName){
        if(foundedUser[0].password == Password){
            res.render('secrets');
        }else{
            res.send('Password you have entered is wrong');
        }
    }
 } catch(e){
    res.send('No match found for this user');
 }
    
 

});




app.listen(3000,function(){
    console.log("listening on port 3000");
});