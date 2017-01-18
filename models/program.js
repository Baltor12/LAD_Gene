var mongoose = require('mongoose');  

var programSchema = mongoose.Schema({
    user:String,
    name:String,
    obj:Object
}); 

module.exports = mongoose.model('Program', programSchema); 