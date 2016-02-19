
// Inports all packages
var express           = require('express');
var expressHandlebars = require('express-handlebars');
var bodyParser       = require('body-parser');
var session           = require('express-session');
var Sequelize         = require('sequelize');
var sha256            = require('sha256');
var mysql             =require('mysql');
var app               = express();

// Established PORT
var PORT = process.env.PORT || 8080;

// Connects to database
var sequelize = new Sequelize('user_db', 'root');

// bodyParser to read info from HTML
app.use(bodyParser.urlencoded({extended: false}));

// setting default layout to main.handlebars
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));

// setting view to all handlebar pages
app.set('view engine','handlebars');

// creates new table in database
var User = sequelize.define('User',{
  username:{
    type: Sequelize.STRING,
    validate:{
      len: [1,30]
    }
  },
  password:{
    type:Sequelize.STRING,
  }
});

// Creates a Secret for user login
app.use(session({
  secret: 'go shawty its your birfday', //Random string of text
  cookie:{
    maxAge: 1000 * 60 * 60 * 24 * 14 //sets length of login
  },
  saveUninitialized: true,
  resave: false
}));

//takes user to registration page on page load
app.get('/', function(req, res){
  res.render('register'); //show register.handlebars
});

//takes user to login page if login in button is clicked
app.get('/login', function(req, res){
  res.render('login'); //show login.handlebars
});

// Post information from form to register the user and enter isnt the database - this must match method=POST and action=/register in form
app.post('/register', function(req,res){
  var username = req.body.username; //get the username from the username in the registration form
  if(req.body.password.length > 7){ //checking to see if password is longer than 8 characters
    var password = sha256('noonelikesawhileloop' + req.body.password); // adds sha256 in front of the enter password to make it more sercure
    User.create({username: username, password: password}).then(function(user){ //creates new user and password in DB according to user input
      req.session.authenticated = user; // Authenticates a approved user
      res.redirect('/success'); // sends user message that they have successfully logged in after registering
   }).catch(function(err){ // throws error message if user made an error
      console.log(err);
      res.redirct('/fail');
   });
  }else{
    res.render('fail'); // sends user to fail page
  }
});

app.post('/login', function(req, res){
  var username = req.body.username; //get the username from the username in the login form to verify username
  var password = sha256('noonelikesawhileloop' + req.body.password); // adds sha256 in front of the password in the login fomr to verify password

  User.findOne({ //access the User table in the DB to find a User where the username = the entered username and the password = the entered password
    where:{
      username: username,
      password: password
    }
  }).then(function(user){
    if(user){ // if the user is a valid user, send the login successful message
      req.session.authenticated = user;
      res.redirct('/success');
    }else { // if the user is not a valid user, send the login failed message
      res.redirect('/fail');
    }
  }).catch(function(err){
    throw err;
  });
});

app.get('/success', function(req,res){
  if(req.session.authenticated){
    res.render('success');
  }else{
    res.render('fail');
  }
});

app.get('/logout', function(req,res){
  req.session.authenticated = false;
  res.redirect('/');
});

sequelize.sync().then(function(){
  app.listen(PORT, function(){
    console.log("Boom");
  });
});
