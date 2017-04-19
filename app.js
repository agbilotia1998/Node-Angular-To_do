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
    database = require('./config/mongo_db'),
    app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serialiseUser());
passport.deserializeUser(User.deserialiseUser());
mongoose.Promise = global.Promise;
mongoose.connect(database.localUrl);


app.get('/', function (req, res) {
    res.render('index.ejs');
});

app.listen(process.env.PORT || 5000, function () {
    console.log("SERVER STARTED");
});
