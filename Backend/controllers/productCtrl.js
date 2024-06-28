const Product = require('../models/productModel');
const asyncHandler = require("express-async-handler");
const slugify = require('slugify');

const createProduct = asyncHandler(async (req,res)=>{
    try{
        if(req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        const newProduct = await Product.create(req.body);
        res.json(newProduct);
    }catch(error){
        throw new Error(error);
    }
});

const updateProduct = asyncHandler(async(req,res)=>{
    const {id}= req.params;
    try{
        if(req.body.title){
            req.body.slug = slugify(req.body.title);
        }
        console.log(id)
        const updateProduct = await Product.findByIdAndUpdate( id  , req.body , {
            new:true,
        });
        res.json(updateProduct);
    }catch(error){
        throw new Error(error);
    }
});

const deleteProduct = asyncHandler(async(req,res)=>{
    const { id }= req.params;
    try{
        console.log(id)
        const updateProduct = await Product.findByIdAndDelete( id  );
        if(!updateProduct){
            res.status(404);
            throw new Error("Product not found");
        }
        res.json(updateProduct);
    }catch(error){
        throw new Error(error);
    }
});

const getAProduct = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    try{
        const product = await Product.findById(id);
        res.json(product);
    }catch(error){
        throw new Error(error);
    }
});

const getAllProduct = asyncHandler(async(req,res)=>{
    console.log(req.query)
    try{

        const queryObj = {...req.query};
        const queryObj2 = {...req.query};
        const excludeFields = ['page','sort','limit','fields'];
        excludeFields.forEach((el)=> delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match)=> `$${match}`);
        console.log(JSON.parse(queryStr));
        let query = Product.find(JSON.parse(queryStr));

        if(req.query.sort)
        {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        }
        else{
            query = query.sort('-createdAt');
        }

        if(req.query.fields){
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        }
        else{
            query = query.select('-__v');
        }

        const page = req.query.page * 1 || 1;
        const limit = req.query.limit;
        const skip = (page -1 )*limit;

        query = query.skip(skip).limit(limit);
        console.log(page,limit, skip);

        if(req.query.page){
            const numProducts = await Product.countDocuments();
            if(skip >= numProducts){
                throw new Error("This page does not exist");
            }
        
        }

        const product = await query;
        res.json(product);
    }catch(error){
        throw new Error(error);
    }
});




module.exports = { createProduct, getAProduct, getAllProduct, updateProduct ,deleteProduct } ;