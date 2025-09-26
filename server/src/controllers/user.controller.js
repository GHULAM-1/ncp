const User = require("../models/User");
const { validationResult } = require("express-validator");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file provided" });
    }

    const result = await cloudinary.uploader.upload_stream(
      {
        folder: "avatars",
        resource_type: "image",
        width: 400,
        height: 400,
        crop: "fill",
        gravity: "face", // Automatically detect and center on face if possible
        quality: "auto"
      },
      async (error, result) => {
        if (error) {
          console.error(error);
          return res
            .status(500)
            .json({ success: false, message: "Cloudinary upload failed" });
        }

        const user = await User.findByIdAndUpdate(
          req.user._id,
          { avatar: result.secure_url },
          { new: true }
        );

        res.status(200).json({ success: true, avatar: user.avatar });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("Error fetching current user:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
