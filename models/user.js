//Set up =====================================
var mongoose = require('mongoose');  
var bcrypt   = require('bcrypt-nodejs');

// define the schema for our user model
var userSchema = mongoose.Schema({
    user: String,
    type: String,
    email: String,
    guid: String,
    password: String
});

//Method to generate Hash for the password
userSchema.methods.generateHash = function(password) {  
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//Method to verify the password 
userSchema.methods.validPassword = function(password) {  
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', userSchema);  