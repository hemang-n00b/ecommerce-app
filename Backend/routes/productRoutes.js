const express = require('express');
const { createProduct,getAProduct, getAllProduct, updateProduct, deleteProduct, addToWishlist, rating } = require('../controllers/productCtrl');
const { isAdmin , authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post("/",authMiddleware , isAdmin  , createProduct);
router.get("/:id" , getAProduct);
router.get("/" , getAllProduct);
router.delete("/:id" ,authMiddleware,isAdmin, deleteProduct);
router.put("/wishlist",authMiddleware,addToWishlist);
router.put("/:id" ,authMiddleware ,isAdmin, updateProduct);
router.put("/rating",authMiddleware,rating)


module.exports = router ;