const { generateToken } = require('../config/jwtToken');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel')
const validateMongodbId = require('../utils/validateMongodbId');
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const { generateRefreshToken } = require('../config/refreshToken');
const crypto = require('crypto');
const { sendEmail } = require('./emailCtrl');
const uniqid = require('uniqid')
const createUser = asyncHandler(async (req, res) => {
    const email = req.body.email;
    const findUser = await User.findOne({ email: email });
    if (!findUser) {
        const newUser = await User.create(req.body);
        res.json(newUser);
    }
    else {
        throw new Error("User already exists");
    }
});

const loginUserCtrl = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email: email });
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await await User.findByIdAndUpdate(findUser?._id, { refreshToken: refreshToken }, { new: true });
    if (findUser && await findUser.isPasswordMatched(password)) {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id),
        });
    }
    else {
        throw new Error("Invalid email or password");
    }
});

const logout = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) {
        throw new Error("No refresh token in Cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken });
    if (!user) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
        });
        res.sendStatus(204);
    }
    await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: "",
    });
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
    });
    res.sendStatus(204);


});


const handleRefreshToken = asyncHandler(async (req, res) => {
    const cookie = req.cookies;
    if (!cookie?.refreshToken) {
        throw new Error("No refresh token in Cookies");
    }
    const refreshToken = cookie.refreshToken;
    const user = await User.findOne({ refreshToken: refreshToken });
    if (!user) {
        throw new Error("Invalid refresh token");
    }
    jwt.verify(refreshToken, process.env.JWT_SECRET, async (err, decoded) => {
        if (err || user.id !== decoded.id) {
            throw new Error(" Refresh token Error");
        }
        const accessToken = generateToken(user?.id);
        res.json({ accessToken });
    });
});



const updateAUser = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(_id,
            {
                firstname: req?.body?.firstname,
                lastname: req?.body?.lastname,
                email: req?.body?.email,
                mobile: req?.body?.mobile,
            },
            {
                new: true,
            }
        );
        res.json({ updatedUser });
    }
    catch (error) {
        throw new Error(error);
    }
});


const getAllUsers = asyncHandler(async (req, res) => {
    try {

        const getUsers = await User.find();
        res.json(getUsers);
    }
    catch (error) {
        throw new Error(error);

    }
});

const getAUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(_id);
    try {
        const getuser = await User.findById(id);
        res.json({ getuser });
    }
    catch (error) {
        throw new Error(error);
    }
});

const deleteAUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const deleteUser = await User.findByIdAndDelete(id);
        res.json({ deleteUser });
    }
    catch (error) {
        throw new Error(error);
    }
});

const blockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const block = await User.findByIdAndUpdate(
            id, {
            isBlocked: true,
        },
            {
                new: true
            });
        res.json({
            message: 'User Blocked',
        });
    }
    catch (error) {
        throw new Error(error);

    }
});

const unblockUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    validateMongodbId(id);

    try {
        const unblock = await User.findByIdAndUpdate(
            id, {
            isBlocked: false,
        },
            {
                new: true
            });
        res.json({
            message: 'User Unblocked',
        });
    }
    catch (error) {
        throw new Error(error);

    }
});

const updatePassword = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { password } = req.body;
    validateMongodbId(_id);
    const user = await User.findById(_id);
    if (!user) {
        throw new Error("User not found");
    }
    console.log(password)
    if (password) {
        user.password = password;
        const updatedPassword = await user.save();
        res.json(updatedPassword);
    }
    else {
        res.json(user);
    }
});
const forgotPasswordToken = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("User not found with this email");
    }
    try {
        const token = await user.createPasswordResetToken();
        await user.save();
        const resetURL = `Hi , Please follow this link to reset your password. THis link is valid till 10 minutes from now. <a href='http://localhost:5000/api/user/reset-password/${token}'> Click here </a>`;
        const data = {
            to: email,
            subject: "Forgot Password Link",
            text: "Hey User",
            html: resetURL,
        };
        sendEmail(data);
        res.json({ message: "Password reset link sent to your email", token });
    }
    catch (error) {
        throw new Error(error);
    }

});

const resetPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const { token } = req.params;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpire: { $gt: Date.now() },
    });
    if (!user) {
        throw new Error("Token expired, Please try again later");
    }
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpire = undefined;
    await user.save();
    res.json({ message: "Password reset successfully", user });
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email: email });
    if (findUser.role !== 'admin') throw new Error('Not Authorised');
    const refreshToken = await generateRefreshToken(findUser?._id);
    const updateuser = await await User.findByIdAndUpdate(findUser?._id, { refreshToken: refreshToken }, { new: true });
    if (findUser && await findUser.isPasswordMatched(password)) {
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            maxAge: 72 * 60 * 60 * 1000,
        });
        res.json({
            id: findUser?._id,
            firstname: findUser?.firstname,
            lastname: findUser?.lastname,
            email: findUser?.email,
            mobile: findUser?.mobile,
            token: generateToken(findUser?._id),
        });
    }
    else {
        throw new Error("Invalid email or password");
    }
});

const getWishlist = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    try {
        const findUser = await User.findById(_id).populate('wishlist');
        res.json(findUser);
    }
    catch (error) {
        throw new Error(error);
    }
})

//save user address

const saveAddress = asyncHandler(async (req, res, next) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try {
        const updatedUser = await User.findByIdAndUpdate(_id,
            {
                address: req?.body?.address,
            },
            {
                new: true,
            }
        );
        res.json({ updatedUser });
    }
    catch (error) {
        throw new Error(error);
    }
});

const userCart = asyncHandler(async (req, res) => {
    const { cart } = req.body;
    const { _id } = req.user;
    validateMongodbId(_id);
    const user = await User.findById(_id);
    try {
        let products = [];
        const user = await User.findById(_id);
        const alreadyExist = await Cart.findOne({ orderBy: user._id });
        if (alreadyExist) {
            alreadyExist.remove();
        }
        for (let i = 0; i < cart.length; i++) {
            let object = {};
            object.product = cart[i]._id;
            object.count = cart[i].count;
            object.color = cart[i].color;
            let getPrice = await Product.findById(cart[i]._id).select('price').exec();
            object.price = getPrice.price;
            products.push(object);
        }
        let cartTotal = 0;
        for (let i = 0; i < products.length; i++) {
            cartTotal = cartTotal + products[i].price * products[i].count;
        }
        let newCart = await new Cart({
            products, cartTotal, orderBy: user?._id
        }).save();

        res.json(newCart);


    }
    catch (error) {
        throw new Error(error);
    }

})

const getUserCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);

    try {
        const cart = await Cart.findOne({ orderBy: _id }).populate("products.product");
        res.json(cart);
    }
    catch (error) {
        throw new Error(error);
    }

})

const emptyCart = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try {
        const user = await User.findOne({ _id });
        const cart = await Cart.findOneAndRemove({ orderby: user._id });
        res.json(cart);

    }
    catch (error) {
        throw new Error(error);
    }
})

const applyCoupon = asyncHandler(async (req, res) => {
    const { coupon } = req.body;
    const { id } = req.user;
    const validCoupon = await Coupon.findOne({ name: coupon });
    if (validCoupon == null) {
        throw new Error("Invalid coupon");
    }
    const user = await User.findOne({ _id });
    let { products, cartTotal } = await Cart.findOne({ orderBy: user._id }).populate("products.product");
    let totalAfterDiscount = (cartTotal - (cartTotal * validCoupon.discount) / 100).toFixed(2);
    await Cart.findOneAndUpdate({ orderBy: user._id }, { totalAfterDiscount }, { new: true });
    res.json(totalAfterDiscount);

})


const createOrder = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    const { COD, couponApplied } = req.body;

    try {
        if (!COD) throw new Error('Create cash order failed');
        const user = await User.findById(_id);
        let userCart = await Cart.findOne({ orderby: user._id });
        let finalAmount = 0;
        if (couponApplied && userCart.totalAfterDiscount) {
            finalAmount = userCart.totalAfterDiscount * 100
        }
        else {
            finalAmount = userCart.cartTotal * 100;
        }

        let newOrder = await new Order({
            products: userCart.products,
            paymentIntent: {
                id: uniqid(),
                method: "COD",
                amount: finalAmount,
                status: "Cash on Delivery",
                created: Date.now(),
                currency: "usd"
            },
            orderBy: user._id,
            orderStatus: "Cash on Delivery",
        }).save();
        let update = userCart.products.map((item) => {
            return {
                updateOne: {
                    filter: { _id: item.product._id },
                    update: { $inc: { quantity: -item.count, sold: +item.count } },
                }
            }
        })
        const updated = await Product.bulkWrite(update, {});
        res.json({ message: success })
    }
    catch (error) {
        throw new Error(error);
    }

})

const getOrders = asyncHandler(async (req, res) => {
    const { _id } = req.user;
    validateMongodbId(_id);
    try {
        const userorders = await Order.findOne({ orderBy: _id }).populate('products.product');
        res.json(userorders);
    }
    catch (error) {
        throw new Error(error);
    }
})

const updateOrderStatus = asyncHandler(async (req, res) => {

    const { status } = req.body;
    const { id } = req.params;
    validateMongodbId(id);
    try {
        const findOrder = await Order.findByIdAndUpdate(id, {
            orderStatus: status,
            paymentIntent: {
                status: status,
            }
        }, { new: true })
        res.json(findOrder);
    }
    catch (error) {
        throw new Error(error);
    }
})

module.exports = { createUser, resetPassword, forgotPasswordToken, loginUserCtrl, updatePassword, logout, getAllUsers, getAUser, deleteAUser, updateAUser, blockUser, unblockUser, handleRefreshToken, loginAdmin, getWishlist, saveAddress, userCart, getUserCart, emptyCart, applyCoupon, createOrder, getOrders, updateOrderStatus };