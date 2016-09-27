// app/routes.js
module.exports = function (app, io) {
    var userDetails = [
        { name: 'admin', password: 'admin09876' },
        { name: 'andrei', password: 'prosperityofhumankind' }
    ];

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function (req, res) {
        res.render('page0.ejs'); // load the page0.ejs file
    });

    // =====================================
    // Login page =================
    // =====================================
    // Verify the credentials and forward the user to the respective screen
    app.post('/initializing', function (req, res) {
        var flag = false;
        for (i = 0; len = userDetails.length, len > i; i++) {
            if ((req.body.email === userDetails[i].name) && (req.body.password === userDetails[i].password)) {
                flag = true;
            }
        }
        // If the login details are correct, then it is forwarded to the initializing page else it will diplay and alert message in the login page
        if (flag) {
            res.render('Initialize.ejs');
        } else {
            io.sockets.emit('wrong_credentials', '');
        }
    });

    // =====================================
    // Initializing page =================
    // =====================================
    // Depending upon the value selected by the user, send him to the required screen 
    app.post('/selection', function (req, res) {
        if (req.body.button === 'create') {
            res.render('main.ejs');
        } else {
            
        };
    });
};