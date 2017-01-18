var LocalStrategy = require('passport-local').Strategy;
var User = require('../models/user');

var mailer = require("nodemailer");

module.exports = function (passport) {
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
      done(err, user);
    });
  });

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'user',
    emailField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
  },
    function (req, email, password, done) {
      process.nextTick(function () {
        User.findOne({ 'user': req.body.user }, function (err, usr) {
          if (err)
            return done(err);
          if (usr) {
            return done(null, false, req.flash('signupMessage', 'That email/user name is already in use.'));
          } else {

            var send_to = email;
            // Use Smtp Protocol to send Email
            var smtpTransport = mailer.createTransport("SMTP", {
              service: "Gmail",
              //host: 'smtp.yourprovider.org',		//yourprovider = > gmail
              auth: {
                user: "ladder.gene@gmail.com",
                pass: "beffybeaf12"
              }
            });

            var mail = {
              from: "ladder.gene@gmail",
              to: send_to,
              cc: "balaji.aviator@gmail.com",
              subject: "Welcome to Ladder Generator",
              text: "UserName: admin\nPassword: admin",
              html: "<b>You have been granted an access to Ladder Generator Software.</b><br><p>UserName: " + req.body.user + "</p>"
            }

            smtpTransport.sendMail(mail, function (error, response) {
              if (error) {
                //response.send('Username: ' + request.body.loggedinUser);
                console.log(error);
              } else {
                //response.send('Username: ' + request.query['username']);
                console.log("message sent");
              }

              smtpTransport.close();
            });

            var newUser = new User();
            newUser.user = req.body.user;
            newUser.email = req.body.email;
            newUser.password = newUser.generateHash(password);
            newUser.save(function (err) {
              if (err)
                throw err;
              return done(null, newUser);
            });
          }
        });
      });
    }));

  passport.use('local-login', new LocalStrategy({
    usernameField: 'user',
    passwordField: 'password',
    passReqToCallback: true,
  },
    function (req, user, password, done) {
      User.findOne({ 'user': user }, function (err, usr) {
        if (err)
          return done(err);
        if (!usr)
          return done(null, false, req.flash('loginMessage', 'No user found.'));
        if (!usr.validPassword(password))
          return done(null, false, req.flash('loginMessage', 'Wrong password.'));
        return done(null, usr);
      });
    }));
};