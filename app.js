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


app.get('/', function (req, res) {
    res.render('index.ejs');
});


app.post("/registered", function (req, res) {
    var details = {
        username: req.body.username,
        email: req.body.email,
        confirmation: "0"
    };
    User.register(new User(details),
        req.body.password, function (err, user) {
            if (err) {
                console.log(err);
                return res.render('create.ejs', {b: "1"});
            }
            User.findOne({email: details.email}, function (err, found) {
                if (!found) {
                    passport.authenticate("local")(req, res, function () {
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
                                    name: 'To_do app',
                                    email: '<iec2016039@iiita.ac.in>'
                                },
                                content: [
                                    {
                                        type: 'text/html',
                                        value: '<html><body>' +
                                        '<b> Thanks for registering<br><br></b>' +
                                        "<a href='http:///localhost:5000/confirmation/username/" + details.username + "' target='_blank'> 'Click on the link to activate your account'</a><br>" +
                                        '</body></html>'
                                    }
                                ]
                            }
                        });


                        res.render("registered.ejs", {username: details.username});
                    });
                }
                else {
                    console.log(err);
                    return res.render('create.ejs', {b: "0"});
                }
            });
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
    var user = req.body.username;
    var pass = req.body.password;
    User.findOne({username: user, confirmation: "1"}, function (err, approved) {
        if (!approved) {
            res.redirect("/");
            // alert("Invalid username or password");
        }
        else {
            auth.hash(pass, function (err, hashed) {
                console.log(hashed);
                auth.verify(pass, hashed, function (err, verified) {
                    if (verified) {
                        req.session.username = user;
                        res.send('entered');
                    }
                    else if (err)
                        res.redirect('/');
                });
            });
        }
    })
});


app.get('/:user/todos', function (req, res) {

    var user = req.params.user;
    User.find({username: user}, function (err, result) {
        if (err)
            res.send(err);

        else {
            //console.log(result[0].todos[0]);
            var dataObj = [];
            for (var i = 0; i < result[0].todos.length; i++) {
                //console.log(result[0].todos[i]);
                dataObj.push(result[0].todos[i].task);
            }
            //console.log();
            res.json(dataObj);
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
                        //console.log(result[0].todos[0]);
                        var dataObj = [];
                        for (var i = 0; i < result[0].todos.length; i++) {
                            //console.log(result[0].todos[i]);
                            dataObj.push(result[0].todos[i].task);
                        }
                        //console.log();
                        res.json(dataObj);
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
                User.update({"todos._id": todo_id},{$set:{"todos.$.accomplished":true}}, function (err, toUpdate) {
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
            //console.log(result[0].todos[0]);
            var dataObj = [];
            for (var i = 0; i < result[0].todos.length; i++) {
                //console.log(result[0].todos[i]);
                dataObj.push(result[0].todos[i].task);
            }
            //console.log();
            res.json(dataObj);
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
            //console.log(result[0].todos[0]);
            var dataObj = [];
            for (var i = 0; i < result[0].todos.length; i++) {
                //console.log(result[0].todos[i]);
                dataObj.push(result[0].todos[i].task);
            }
            //console.log();
            res.json(dataObj);
        }
    });
});


app.listen(process.env.PORT || 5000, function () {
    console.log("SERVER STARTED");
});
