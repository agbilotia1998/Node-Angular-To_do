/**
 * Created by AYUSH on 4/20/2017.
 */

var mongoose = require('mongoose');
var passportLocalMongoose=require('passport-local-mongoose');

var UserSchema=new mongoose.Schema({
    username:String,
    password:String,
    todos:[{
        task:String,
        accomplished:Boolean
    }],
    confirmation:String
});

UserSchema.plugin(passportLocalMongoose);
mongoose.model("User",UserSchema);
module.exports=mongoose.model("user",UserSchema);
