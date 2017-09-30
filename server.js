

var express = require('express');
var app     = express();
var bodyParser = require('body-parser');
// For POST Request with nodejs
var request = require('request');
// Set the headers
var headers = {
    'User-Agent':       'Super Agent/0.0.1',
    //'Content-Type':     'application/x-www-form-urlencoded'
    'Content-Type':     'application/json'
}
// Configure the request
var options = {
    method: 'POST',
    headers: headers,
    form: {}
}// Missing url and form content

// Path
var path = require('path');

// MongoDB
var mongoose = require('mongoose');
var db_url = 'mongodb://master:master@ds159024.mlab.com:59024/magicbutton';
var db_login = {
    un: 'master',
    pw: 'master'
}
mongoose.connect(db_url);
// Connect to mongo db 
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  // we're connected!
  console.log('Connected to db');
});
// User schema
var userSchema = mongoose.Schema({
    username: String,
    password: String,
    personalData: {
        firstname   : {type:String, default:''},
        lastname    : {type:String, default:''},
        tel         : {type:String, default:''},
        email       : {type:String, default:''},
    },
    // Administrative options
    isSuper: {type:"bool", default:false},
    masterOf: [{type:String, default: ''}],
    // ClientCommunicationData
    ccd: [{
        startdate: {type: "date", default: new Date()},
        endDate  : {type: "date", default: new Date()},
        comType  : {type: String, default: 'TBD'},
        clientOf : {type: String, default: 'Unknown'}, // Client name=cname for the collection ip 
        link     : {type: String, default: ''},
    }]  

});
var usermodel = mongoose.model('Users', userSchema);
// Client schema
var clientSchema = mongoose.Schema({
    // Accessing the conf 
    access: {
        un: {type:String, default:'usernaem'},
        pw: {type:String, default:'passwood'},
    },
    // DataCollectionAddress
    dcAddress: String, 
    // Client/Company name
    cname: String,
});
var clientmodel = mongoose.model('Clients', clientSchema);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// File path
app.use(express.static(path.join(__dirname, 'public')));
/////////////////////////////////////////////////// FUNCTIONS /////////////////////////////////


// Function => create a new USER
var newUser = function(un, pw, cb) {
    var nUser = new usermodel({
        username: un,
        password: pw,
    });
    nUser.save(function(err) {
        if (err) return console.error(err)
        console.log('New user has been created');
        cb('New user created');
    })
}
// Function => create a new CLIENT
var newClient = function(dca, name, cb) {
    var nClient = new clientmodel({
        dcAddress: dca,
        cname: name,
    });
    nClient.save(function(err) {
        if (err) return console.error(err)
        console.log('New client has been created');
        cb('New client created');
    })
};

// Find user
var checkUser = function(un, cb) {
    usermodel.findOne({username: un}, function(err, res) {
        // User found
        if (res) {
            console.log('Found user');
            cb(0, res);
        } else {
            cb('User not found', res);
        }
    });
}
// Change user data
var changeUserData = function(un, newdata, cb) {
    usermodel.findOne({username: un}, function(err, res) {
        if (res) { // User found
            console.log('Fun new data',newdata, JSON.parse(newdata));
            res.personalData = JSON.parse(newdata);
            console.log(res.personalData);
            res.save(function(err) {
                if (err) {
                    cb('Error', res);
                } else {
                    console.log('User data has been changed');
                    cb(0, res);
                }
            })
        } else {   // User not found
            cb('User not found', res);
        }
    })
}

// Find client
var findClient = function(name, cb) {
    clientmodel.findOne({cname:name}, function(err, res) {
        if (err) return console.error(err)
        if (res) { // Found a client
            cb(0, res);
        } else {   // Client not found
            cb('Client not found', res);
        }
    });
}
// Check if given user has super privileges or not
var isAdmin = function(user) {
    return (user.isSuper == true)?true:false;
}

// Add a new meeting
var addNewMeeting = function(un, mInfo) {
    checkUser(un, function(err, u) {
        if (err==0) {
            // Set ccd accepting ready
            u.ccd.push(mInfo);

        }
    })
}

/////////////////////////////////////////////////////////////////////////////////////////////////////

// Main page
app.get('/', function(req, res) {
    console.log('New visitor');
    res.sendfile('public/index.html');
    //res.send('Welcome to the login page');
});

// Login
app.post('/login', function(req, res) {
    if (req.body.un && req.body.pw) {
        console.log('Login request');
        checkUser(req.body.un, function(err, a) {
            console.log(err,a);
            if (err == 0) { // USER FOUND

                var rUser = {
                    username: a.username,
                    personalData: a.personalData,
                    administrator: isAdmin(a)
                }
                res.send({success:1,content:rUser});
            } else {        // USER NOT FOUND
                res.send({success:0,content:err});
            }
            
        });
    };
});
// Change user data
app.post('/changedata/:who', function(req, res) {
    console.log(req.body.newdata);
    if (req.params.who == 'user') { // User data
        if (req.body.un && req.body.pw && req.body.newdata) {
            changeUserData(req.body.un, req.body.newdata, function(err, resp) {
                if (err == 0) { // Success
                    res.send({ 
                        success:1, 
                        msg    :'User data has been changed',
                    });
                } else {        // Failure
                    res.send({ 
                        success:0, 
                        msg    :'Error',
                    });
                } 
            })
        }
    }
});

// Create new User or Client
app.post('/new/:newtype', function(req, res) {
    console.log(req.params.newtype);
    if (req.params.newtype) {
        // Create a new user
        if (req.params.newtype == 'user') {
            console.log('HERE')
            if (req.body.un && req.body.pw) {
                newUser(req.body.un, req.body.pw, function(a) {
                    console.log(a);
                    res.send('Done');
                });
            }
        // Create a new client
        } else if (req.params.newtype == 'client') {
            if (req.body.dca && req.body.name) {
                newClient(req.body.dca, req.body.name, function (a) {
                    res.send(a);
                });
            }
        }
    } else {
        res.send('Error');
    }
});

// Receiving confirmation and sending data to target ip Collection site
app.post('/sendcol', function(req, res) {
    // Check for valid user
    if (req.body.un && req.body.client && req.body.ccd) {
        checkUser(req.body.un, function(err, r) {
            if (err == 0) { // If user is aOK
                // Find the matching client
                findClient(req.body.client, function(err2, cclient) {
                    if (err2 == 0) {
                        // If the client is found - send the meeting time to them
                        
                        var sendToClient = {
                            userdata: cclient.personalData,
                            ccd     : req.body.ccd,
                        };
                        console.log(sendToClient);
                        // Send the data to client
                        options.url = 'http://'+cclient.dcAddress+'/api/confirmation';
                        options.form = sendToClient;
                        // Start the request
                        request(options, function (error, response, body) {
                            //console.log('resp',response.body);
                            if (!error && response.statusCode == 200) {
                                // Print out the response body
                                console.log(body);
                                res.send('Success');
                            } 
                        });
                        //res.send('Found it');
                    } else {
                        res.send('Error');
                    }
                });
            } else {
                res.send('Error');
            }
        })
    }
});










app.listen(1337, function() {
    console.log('Server is online on port 1337');
});