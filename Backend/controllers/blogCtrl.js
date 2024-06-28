const Blog = require('../models/blogModel');
const asyncHandler = require("express-async-handler");
const User = require('../models/userModel');
const validateMongodbId = require('../utils/validateMongodbId');

const createBlog = asyncHandler(async (req,res)=>{
    try{
        const newBlog = await Blog.create(req.body);
        res.json({
            message:"Blog created successfully",
            data:newBlog,
        });
    }catch(error){
        throw new Error(error);
    }
});

module.exports = {createBlog};