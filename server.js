// This is a simulation of the client server

var express = require('express');
var app     = express();
var bodyParser = require('body-parser');


// Path
var path = require('path');



// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// File path
app.use(express.static(path.join(__dirname, 'public')));


/////////////////////////////////////////////////// FUNCTIONS /////////////////////////////////


// For somewat reason, this is the db
var niceDB = [];

// Main page
app.get('/', function(req, res) {
    console.log('New visitor');
    res.sendfile('public/main.html');
    //res.send('Welcome to the login page');
});

// Collection Url
app.post('/api/:mestype', function(req, res) {
    if (req.params.mestype) {
        // Create a new user
        if (req.params.mestype == 'collection' || req.params.mestype == 'confirmation') {
            console.log('HERE', req.body);
            // Add client & meeting data to db
            niceDB.push({
                startdate: (req.body.startdate)?req.body.startdate:'none',
                endDate  : (req.body.enddate)?req.body.enddate:'none',
                comType  : (req.body.comType)?req.body.comType:'none',
                client   : (req.body.client)?req.body.client:'none',
            });
            console.log('CurrentDB:', niceDB);
            // Return the meeting link, if necessary
            res.send({success:1, msg:(req.body.comType=='cyber')?'LINK_GOOGLEHANGOUTSI':''});
        }
    } else {
        res.send({success:0, msg:'Something went wrong'});
    }
});


app.listen(80, function() {
    console.log('Client TestServer is online on port 80');
});