const Coupon = require('../models/couponModel');
const asyncHandler = require('express-async-handler');

const createCoupon = asyncHandler(async (req, res) => {
    try {
        const newCoupon = await Coupon.create(req.body);
        res.json(newCoupon);
    }
    catch (error) {
        throw new Error(error);
    }
});

const getAllCoupons = asyncHandler(async (req,res)=>{
    try{
        const coupons = await Coupon.find();
        res.json(coupons);
    }
    catch(error){
        throw new Error(error);
    }
});

const updateCoupon = asyncHandler( async (req,res)=>{
    const { id } = req.params;
    console.log(id);
    try{
        const updateCoupons = await Coupon.findByIdAndUpdate(id,req.body,{new:true});
        res.json(updateCoupons);
    }
    catch(error){
        throw new Error(error);
    }
});

const deleteCoupon = asyncHandler( async (req,res)=>{
    const { id } = req.params;
    try{
        const deleteCoupons = await Coupon.findByIdAndDelete(id,req.body);
        res.json(deleteCoupons);
    }
    catch(error){
        throw new Error(error);
    }
});

module.exports = {createCoupon,getAllCoupons,updateCoupon,deleteCoupon};