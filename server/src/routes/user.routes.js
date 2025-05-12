const express = require("express");
const { check } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/multer");
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  uploadAvatar,
  getCurrentUser,
} = require("../controllers/user.controller");

const router = express.Router();

// Allow any logged-in user to upload avatar
router.post("/upload-avatar", protect, upload.single("avatar"), uploadAvatar);

// ✅ NEW: Get current authenticated user's profile
router.get("/me", protect, getCurrentUser);

// Admin-only routes below
router.use(protect);
router.use(authorize("admin"));

router.route("/").get(getUsers);

router
  .route("/:id")
  .get(getUser)
  .put(
    [
      check("name", "Name is required").optional().not().isEmpty(),
      check("email", "Please include a valid email").optional().isEmail(),
    ],
    updateUser
  )
  .delete(deleteUser);

module.exports = router;
