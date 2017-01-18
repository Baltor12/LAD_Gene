//This is the server for the entire application

// Special Assignment On Factory Automation
// Supervisor : Anderi Lobov
// Student : Balaji Gopalakrishnan
// Email: balaji.gopalakrishnan@student.tut.fi

// set up ======================================================================
// get all the tools needed for the application

var express = require('express');
var app = express();
var http = require('http');
var bodyParser = require("body-parser");
var server = http.createServer(app);
var favicon = require('serve-favicon');
var io = require('socket.io').listen(server);

//Basic things for the webpage
var logger = require('morgan'); 
var cookieParser = require('cookie-parser'); 
var mailer = require("nodemailer");


var port = process.env.PORT || 5012;

//Adding Passport for authentication
var passport = require('passport');  
var LocalStrategy = require('passport-local').Strategy;

// Adding mongogodb for data storage
var mongoose = require('mongoose');  
var flash = require('connect-flash');  
var session = require('express-session');

//Connecting to the MongoDB database
var configDB = require('./config/database.js');  
mongoose.connect(configDB.url);

//Configure routes
var index = require('./app/index');
var users = require('./app/users');
//var fcData = require('./app/fcData');

//Using passport for authentication
require('./config/passport')(passport); 

//Json Parser functions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//Setting up logger and cookie parser
app.use(logger('dev'));
app.use(cookieParser());

//Initializing passport session
app.use(session({ secret: 'sssshhhhsecret' }));  
app.use(passport.initialize());  
app.use(passport.session());  
app.use(flash());

app.use('/', index);
app.use('/users', users);

// Setting up favicon
app.use(favicon(__dirname + '/comp/images/favicon.ico'));
//Setting the locations for the rest of the folders
app.use('/js', express.static(__dirname + '/comp/js'));
app.use('/css', express.static(__dirname + '/comp/css'));
app.use('/images', express.static(__dirname + '/comp/images'));
app.use('/fonts', express.static(__dirname + '/comp/fonts'));
app.use('/styles', express.static(__dirname + '/public/stylesheets'));

app.set('view engine', 'ejs'); // set up ejs for templating     



io.on("connection", function (socket) {
    //socket which recieves the flow chart details JSON from the front end 
    socket.on('logic', function (data) {
        require('./logic/logic.js')(data,io);
    });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Handling other error messages and forwarding to error web page
if (app.get('env') === 'development') {  
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
    });
  });
}
app.use(function(err, req, res, next) {  
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
  });
});

server.listen(port);  

module.exports = app;

console.log('The application is hosted on ' + port);
