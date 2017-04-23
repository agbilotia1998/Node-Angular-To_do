/**
 * Created by AYUSH on 4/19/2017.
 */

var express = require('express'),
    bodyParser = require('body-parser'),
    passport = require('passport'),
    LocalStrategy = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    cookieParser = require("cookie-parser"),
    mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    database = require("./config/mongo_db"),
    User = require("./models/user.js"),
    sg = require('sendgrid')(process.env.SENDGRID_API_KEY),
    path = require('path'),
    app = express();
    auth = require('passport-local-authenticate');

mongoose.Promise = global.Promise;
mongoose.connect(database.localUrl);

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(require("express-session")({
    secret: "A to-do app",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    },

    User.authenticate()));

passport.serializeUser(function (User, err) {
    User.serialiseUser()
});

passport.deserializeUser(function (User, err) {
    User.deserialiseUser()
});

app.post("/registered", function (req, res) {
    //console.log("done");
    var details = {
        username: req.body.username,
        email: req.body.email,
        password:req.body.password,
        confirmation: "0"
    };

    User.findOne({username: details.username}, function (err,found) {
        if (!found) {
            User.findOne({email: details.email}, function (err, found) {
                if (!found) {
                    var request = sg.emptyRequest({
                        method: 'POST',
                        path: '/v3/mail/send',
                        body: {
                            personalizations: [
                                {
                                    to: [
                                        {
                                            email: details.email
                                        }
                                    ],
                                    subject: 'Registered ✔'
                                }
                            ],
                            from: {
                                name: 'Banke Bihari Fashions',
                                email: 'To do app <iec2016039@iiita.ac.in>'
                            },
                            content: [
                                {
                                    type: 'text/html',
                                    value: '<html><body>' +
                                    '<b> Thanks for registering <br><br></b>' +
                                    "<a href='http:///localhost:3000/confirmation/username/" + details.username + "' target='_blank'> 'Click on the link to activate your account'</a><br>" +
                                     +// html body
                                    '</body></html>'
                                }
                            ]
                        }
                    });

                    sg.API(request, function (error, response) {
                        if (error) {
                            console.log('Error response received');
                        }
                        else {
                            User.create(details);
                            res.sendfile('index.html', {name: details.name});
                        }
                        console.log(response.statusCode);
                        console.log(response.body);
                        console.log(response.headers);
                    });
                }
                else {
                    res.sendfile('index.html');
                }
            })
        }
        else {
            res.sendfile('index.html');
        }
    });
});



app.get("/confirmation/username/:un", function (req, res) {
    var verify = (req.params.un);
    User.findOne({username: (req.params.un)}, function (err, nameUser) {
        if (nameUser) {
            User.update({username: verify}, {$set: {confirmation: "1"}}, function (err, numUpdated) {
                if (err) {
                    console.log(err);
                } else if (numUpdated) {
                    console.log('Confirmation set to 1');
                } else {
                    console.log('No document found with defined "find" criteria!');
                }
            });
            res.redirect("/login");
        }
        else {
            res.send("USER NOT REGISTERED");
        }
    });
});

app.post("/login", function (req, res) {
    //console.log("Invalid username or password");
    var user = req.body.username;
    var pass = req.body.password;
    console.log(pass);
    User.findOne({username: user, password: pass, confirmation: "1"}, function (err, approved) {
        if (!approved) {
             console.log("Invalid username or password");
        }
        else {
            req.session.username = user;
            console.log("ok");
            res.json({user:user});
            //res.redirect('/');
        }
    })
});


app.get('/:user/todos', function (req, res) {
    var user = req.params.user;
    User.find({username: user}, function (err, result) {
        if (err)
            res.send(err);

        else {
            res.json(result[0].todos);
        }
    });
});


app.post('/:user/todos', function (req, res) {
    var user = req.params.user;
    var text = req.body.text;
    User.find({username: user}, function (err, found) {
        User.update({username: user}, {
            $push: {
                todos: {
                    task: text,
                    accomplished: false
                }
            }
        }, function (err, updated) {
            if (err)
                console.log(err);
            else {
                User.find({username: user}, function (err, result) {
                    if (err)
                        res.send(err);

                    else {
                        res.json(result[0].todos);
                    }
                });
            }
        })
    });
});


app.get('/:user/update/:todo_id', function (req, res) {
    var user = req.params.user;
    var todo_id = req.params.todo_id;
    User.find({username: user}, function (err, result) {
            if (err)
                console.log(err);

            else {
                User.update({"todos._id": todo_id}, {$set: {"todos.$.accomplished": true}}, function (err, toUpdate) {
                    if (err)
                        console.log(err);
                    else
                        console.log(result[0]);
                });
            }
        }
        , function (err, todo) {
            if (err)
                res.send(err);
        });

    User.find({username: user}, function (err, result) {
        if (err)
            res.send(err);

        else {
            res.json(result[0].todos);
        }
    });
});


app.get('/:user/delete/:todo_id', function (req, res) {
    var user = req.params.user;
    var todo_id = req.params.todo_id;
    User.find({username: user}, function (err, result) {
            if (err)
                console.log(err);

            else {
                //console.log(result[0]);

                User.update({username: user}, {$pull: {"todos": {_id: todo_id}}}, function (err, updated) {
                    if (err)
                        console.log(err);
                    else
                        console.log(result[0]);
                });
            }
        }
        , function (err, todo) {
            if (err)
                res.send(err);
        });

    User.find({username: user}, function (err, result) {
        if (err)
            res.send(err);

        else {
            //console.log();
            res.json(result[0].todos);
        }
    });
});

app.get('*', function(req, res) {
    res.sendfile('index.html');
});


app.listen(process.env.PORT || 5000, function () {
    console.log("SERVER STARTED");
});
