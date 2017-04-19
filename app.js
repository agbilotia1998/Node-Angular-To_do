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
    User.find({username: user}, function (err, todos) {
        if (err)
            res.send(err);

        else
            res.json(todos.task);
    });
});


app.post('/:user/todos', function (req, res) {
    var user = req.params.user;
    var text = req.params.text;
    User.findOne({username: user}, function (err, found) {
        User.update({username: user}, {
            $push: {Task: text},
            $set: {Accomplished: false}
        }, function (err, updated) {
            if (err)
                console.log(err);
            else {
                User.find({username: user}, function (err, todos) {
                    if (err)
                        res.send(err);

                    else
                        res.json(todos.task);
                });
            }
        })
    });
});


app.delete('/:user/delete/:todo_id', function (req, res) {
    var user = req.params.user;
    User.update({username: user}, {$unset: {task: ""}}, function (err, removed) {
            if (err)
                console.log(err);
        }
        , function (err, todo) {
            if (err)
                res.send(err);
        });
    User.find({username: user}, function (err, todos) {
        if (err)
            res.send(err);

        else
            res.json(todos.task);
    });
});


app.listen(process.env.PORT || 5000, function () {
    console.log("SERVER STARTED");
});
