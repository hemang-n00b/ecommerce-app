const express = require('express');
const router = express.Router();
const { authMiddleware,isAdmin } = require('../middlewares/authMiddleware');
const {createBlog,updateBlog, getBlog,getAllBlogs,deleteBlogs, likeBlog, dislikeBlog} = require('../controllers/blogCtrl');

router.post("/", authMiddleware, isAdmin,createBlog);
router.put('/likes',authMiddleware,likeBlog);
router.put('/dislikes',authMiddleware,dislikeBlog);
router.put("/:id", authMiddleware, isAdmin,updateBlog);
router.get("/:id", getBlog);
router.get("/", getAllBlogs);
router.delete("/:id",authMiddleware,isAdmin,deleteBlogs);

module.exports = router;
