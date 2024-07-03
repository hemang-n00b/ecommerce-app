const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var blogcategorySchema = new mongoose.Schema({
    title:{
        type:String,
        required:true,
        unique:true,
        index:true
    }},
    {timestamps:true},
);

module.exports = mongoose.model('blogcategory',blogcategorySchema);