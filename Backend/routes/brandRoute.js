const express = require("express");
const { createBrand, updateBrand, deleteBrand, getBrand, getAllBrand } = require("../controllers/brandCtrl.js");
const { isAdmin,authMiddleware } = require("../middlewares/authMiddleware");
const router = express.Router();

router.post("/",authMiddleware,isAdmin,createBrand);
router.put("/:id",authMiddleware,isAdmin,updateBrand);
router.delete("/:id",authMiddleware,isAdmin,deleteBrand);
router.get('/',getAllBrand);
router.get('/:id',getBrand);

module.exports = router;