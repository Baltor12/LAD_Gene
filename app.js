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

var port = process.env.PORT || 5012;
var flash = require('connect-flash');

//var logic = require('./logic/logic.js');

//Json Parser functions
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Setting up favicon
app.use(favicon(__dirname + '/comp/images/favicon.ico'));
//Setting the locations for the rest of the folders
app.use('/js', express.static(__dirname + '/comp/js'));
app.use('/css', express.static(__dirname + '/comp/css'));
app.use('/images', express.static(__dirname + '/comp/images'));
app.use('/fonts', express.static(__dirname + '/comp/fonts'));
app.use('/styles', express.static(__dirname + '/public/stylesheets'));

app.set('view engine', 'ejs'); // set up ejs for templating

// routes ======================================================================
require('./app/routes.js')(app, io); // load our routes and pass in our app and fully configured passport

io.on("connection", function (socket) {
    //socket which recieves the flow chart details JSON from the front end 
    socket.on('logic', function (data) {
        require('./logic/logic.js')(data,io);
    });
});

server.listen(port);

console.log('The application is hosted on ' + port);
