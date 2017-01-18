var express = require('express');
var passport = require('passport');
var Program = require('../models/program');
var router = express.Router();

// =====================================
// HOME PAGE (with login links) ========
// =====================================
router.get('/', function (req, res, next) {
    res.render('login', { message: req.flash('loginMessage') });
});

router.get('/help', function (req, res, next) {
    res.render('help');
});

router.get('/profile', isLoggedIn, function (req, res) {
    // Forward to the initialize page and also pass the user details to it as part of sessioning
    res.render('initialize', { user: req.user.user });
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/'); // edirect to the login page
});

//Sign up to the app using the passport authentication method
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true,
}));

// Verify the user using passport authentication
router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile',
    failureRedirect: '/',
    failureFlash: true,
}));

// Supplying the help page
router.post('/help', function (req, res) {
    res.render('help');
});

// =====================================
// Initializing page =================
// =====================================
// Depending upon the value selected by the user, send him to the required screen
router.post('/selection', function (req, res) {
    if (req.body.user === '' || req.body.user === undefined) {
        res.redirect('/');
    } else {
        if (req.body.button === 'create') {
            res.render('main', { user: req.body.user, obj: {}, name: '' });
        } else if (req.body.button === 'modify') {
            var prog_name_arr = [];
            //Get the list of programs the user has saved
            Program.find(function (err, programs) {
                if (err) return console.error(err);
                for (var i = 0; i < programs.length; i++) {
                    if (programs[i].user = req.body.user) {
                        prog_name_arr.push(programs[i].name);
                    }
                }
                res.render('modify', { progName: prog_name_arr, progUser: req.body.user });
            });
        };
    };
});


// =====================================
// Saving program =================
// =====================================
//Saving program of user to the database
router.post('/save', function (req, res) {
    var newProg = new Program();
    newProg.user = req.body.user;
    newProg.name = req.body.name;
    newProg.obj = req.body.obj;
    newProg.save(function (err) {
        if (err)
            throw err;
    });
});

// =====================================
// editing program =================
// =====================================
//Editing program of user
router.post('/editDelete', function (req, res) {
    //Process done to edit/delete the program
    // While editing,the program and its details are forwarded to the main screen
    // While deleting, the program is detleted and the new list is forwarded to the modify screen
    if (req.body.button === 'edit') {
        Program.find(function (err, programs) {
            if (err) return console.error(err);
            var editableProgram = {};
            for (var i = 0; i < programs.length; i++) {
                if (programs[i].user == req.body.user && programs[i].name == req.body.name) {
                    editableProgram = JSON.parse(programs[i].obj);
                }
            }
            console.log(Object.keys(editableProgram).length);
            //Check if the object value is correct.
            if (Object.keys(editableProgram).length > 0) {
                res.render('main', { user: req.body.user, obj: editableProgram, name: req.body.name });
            } else {
                res.render('initialize', { user: req.body.user });
            }
        });
    } else if (req.body.button === 'delete') {
        Program.findOneAndRemove({ name: req.body.name, user: req.body.user }, function (err) {
            if (err)
                throw err;
        });
        var prog_name_arr = [];
        //Get the list of programs the user has saved
        Program.find(function (err, programs) {
            if (err) return console.error(err);
            for (var i = 0; i < programs.length; i++) {
                if (programs[i].user = req.body.user) {
                    prog_name_arr.push(programs[i].name);
                }
            }
            res.render('modify', { progName: prog_name_arr, progUser: req.body.user });
        });
    }
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();
    res.redirect('/');
}

module.exports = router;
