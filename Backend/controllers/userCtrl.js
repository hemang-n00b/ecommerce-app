const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel');
const validateMongodbId = require('../utils/validateMongodbId');
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const {generateRefreshToken} = require('../config/refreshToken');
const crypto = require('crypto');
const { sendEmail } = require('./emailCtrl');

const createUser= asyncHandler(async (req,res)=>{
    const email = req.body.email;
    const findUser = await User.findOne({email:email});
    if(!findUser){
        const newUser = await User.create(req.body);
        res.json(newUser);
    }
    else{
        throw new Error("User already exists");
    }
});

const loginUserCtrl = asyncHandler(async (req,res)=>{
    const {email,password} = req.body;
    const findUser = await User.findOne({email:email});
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await await User.findByIdAndUpdate(findUser?._id,{refreshToken:refreshToken},{new:true});
    if(findUser && await findUser.isPasswordMatched(password)){
        res.cookie("refreshToken",refreshToken,{
            httpOnly:true,
            maxAge: 72*60*60*1000,
        });
        res.json({
            id:findUser?._id,
            firstname:findUser?.firstname,
            lastname:findUser?.lastname,
            email:findUser?.email,
            mobile:findUser?.mobile,
            token:generateToken(findUser?._id),
        });
    }
    else{
        throw new Error("Invalid email or password");
    }
});

const logout = asyncHandler(async(req,res)=>{
    const cookie = req.cookies;
    if(!cookie?.refreshToken){
        throw new Error("No refresh token in Cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({refreshToken});
    if(!user){  
        res.clearCookie("refreshToken", {
            httpOnly:true,
            secure:true,
        });
        res.sendStatus(204);
    }
    await User.findOneAndUpdate({refreshToken}, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly:true,
        secure:true,
    });
    res.sendStatus(204);


});


const handleRefreshToken = asyncHandler(async(req,res)=>{
    const cookie = req.cookies;
    if(!cookie?.refreshToken){
        throw new Error("No refresh token in Cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({refreshToken:refreshToken});
    if(!user){
        throw new Error("Invalid refresh token");
    }
    jwt.verify(refreshToken,process.env.JWT_SECRET ,async(err,decoded)=>{
        if(err || user.id!==decoded.id){
            throw new Error(" Refresh token Error");
        }
        const accessToken = generateToken(user?.id);
        res.json({accessToken});
    }); 
});



const updateAUser = asyncHandler(async(req,res)=>{
    const { _id } = req.user;
    validateMongodbId(_id);
    try{
        const updatedUser = await User.findByIdAndUpdate(_id,
        {
            firstname :req?.body?.firstname,
            lastname :req?.body?.lastname,
            email :req?.body?.email,
            mobile : req?.body?.mobile,
        },
        {
            new:true,
        }
        );
        res.json({updatedUser});
    }
    catch(error){
        throw new Error(error);
    }
});


const getAllUsers = asyncHandler(async(req,res)=> {
    try{

        const getUsers = await User.find();
        res.json(getUsers);
    }
    catch(error){
        throw new Error(error);
    
    }
});

const getAUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    validateMongodbId(_id);
    try{
        const getuser = await User.findById(id);
        res.json({getuser});
    }
    catch(error){
        throw new Error(error);
    }
});

const deleteAUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    validateMongodbId(id);
    try{
        const deleteUser = await User.findByIdAndDelete(id);
        res.json({deleteUser});
    }
    catch(error){
        throw new Error(error);
    }
}); 

const blockUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    validateMongodbId(id);

    try{
        const block = await User.findByIdAndUpdate(
            id,{
            isBlocked:true,
        },
        {
            new:true
        });
        res.json({
            message: 'User Blocked',
        });
    }  
    catch(error){
        throw new Error(error);
    
    }     
});

const unblockUser = asyncHandler(async(req,res)=>{
    const { id } = req.params;
    validateMongodbId(id);

    try{
        const unblock = await User.findByIdAndUpdate(
            id,{
            isBlocked:false,
        },
        {
            new:true
        });
        res.json({
            message: 'User Unblocked',
        });
    }  
    catch(error){
        throw new Error(error);
    
    }     
});

const updatePassword = asyncHandler(async(req,res)=>{
    const {_id} = req.user;
    const {password} = req.body;
    validateMongodbId(_id);
    const user = await User.findById(_id);
    if(!user){
        throw new Error("User not found");
    }
    console.log(password)
    if(password){
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    }
    else{
        res.json(user);
    }
});
const forgotPasswordToken = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    const user = await User.findOne({email});
    if(!user){
        throw new Error("User not found with this email");
    }
    try{
        const token= await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi , Please follow this link to reset your password. THis link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'> Click here </a>`;
        const data = {
            to:email ,
            subject:"Forgot Password Link",
            text:"Hey User",
            html:resetURL ,
        };
        sendEmail(data) ;
        res.json({message:"Password reset link sent to your email" , token});
    }
    catch(error)
    {
        throw new Error(error);
    }

}) ;

const resetPassword = asyncHandler(async(req,res)=>{
    const {password} = req.body;
    const {token } = req.params;    
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken:hashedToken,
        passwordResetExpire:{$gt:Date.now()},
    });
    if(!user){
        throw new Error("Token expired, Please try again later");
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    res.json({message:"Password reset successfully" , user});
}) ;


module.exports = { createUser, resetPassword ,forgotPasswordToken , loginUserCtrl, updatePassword, logout , getAllUsers,getAUser, deleteAUser, updateAUser, blockUser ,unblockUser, handleRefreshToken};