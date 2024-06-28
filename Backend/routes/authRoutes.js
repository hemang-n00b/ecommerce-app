const express= require('express');
const {createUser,loginUserCtrl, resetPassword , updatePassword, getAllUsers, getAUser, deleteAUser, updateAUser, blockUser, unblockUser, handleRefreshToken, logout, forgotPasswordToken} = require('../controllers/userCtrl');
const { authMiddleware,isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();



router.post("/register" , createUser);
router.post("/forgot-password-token" , forgotPasswordToken);
router.put("/reset-password/:token" , resetPassword);
router.put("/password", authMiddleware , updatePassword);
router.post("/login" , loginUserCtrl);
router.get("/all-users" , getAllUsers);
router.get("/refresh", handleRefreshToken);
router.get("/logout", logout);
router.get("/:id",authMiddleware,isAdmin, getAUser);
router.delete("/:id" , deleteAUser);
router.put("/edit-user", authMiddleware , updateAUser);
router.put("/block-user/:id", authMiddleware ,isAdmin, blockUser);
router.put("/unblock-user/:id", authMiddleware ,isAdmin, unblockUser);





module.exports = router;