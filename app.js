require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session')
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const flash = require('connect-flash');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-find-or-create');
// const bcrypt = require('bcrypt');
// const encrypt = require('mongoose-encryption');
// var md5 = require('md5');


const app = express();
app.use(flash());
app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

// 1.Set up a session that has a secret
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
 })
 );
 
// 2. initialize passport 
app.use(passport.initialize());
// 3. use passport to set up session
app.use(passport.session());

mongoose.set('strictQuery', false);
mongoose.connect("mongodb://localhost:27017/userDB");


const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    googleId: String, 
});
// 4.hash and salt passwords as well as saving users into DB
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// userSchema.plugin(encrypt,{secret:process.env.SECRET_KEY, encryptedFields:['password']});

const User = new mongoose.model('user', userSchema);
// 5. Strategy
passport.use(User.createStrategy());
// Google Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: "http://localhost:3000/auth/google/secrets"
},
function(accessToken, refreshToken, profile, cb) {
  console.log(profile);
  User.findOrCreate({ googleId: profile.id }, function (err, user) {
    return cb(err, user);
  });
}
));



// 6. serializeUser (add the user's identification into the cookie)
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

// 7. deserialize is to allow passport to check up the user's information for authentication
passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});




app.get('/',function(req,res){
    res.render('home');
});
app.get('/register',function(req,res){
    res.render('register');
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }
  ));

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });


  app.get('/login',function(req,res){
    res.render('login', { Message: req.flash('error') });
});

app.get('/logout',function(req,res){
 req.logout(function(err){
  if(err){
    console.log(err)
  } else{
    res.redirect('/')
  }
 });
});

app.get('/secrets',function(req,res){
  if (req.isAuthenticated()){
    res.render('secrets');
  }else{
    res.redirect('/login')
  } 
    
});

app.get('/submit',function(req,res){
  if(req.isAuthenticated()){
    res.render('submit');
  }else{
    res.redirect('/login');
  }
})

app.post('/register', function(req,res) {

    User.register({username: req.body.username}, req.body.password, function(err,user){
     if(err){
      console.log(err);
      res.redirect('/register');
    } else{
      // passport.authenticate is to setup a cookie that saves the current logged in session 
      passport.authenticate('local')(req,res,function(){
        res.redirect('/secrets');
      })
     }
  });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), function(req, res) {
  res.redirect('/secrets');
});

app.listen(3000,function(){
  console.log("listening on port 3000");
});
    
    
   

