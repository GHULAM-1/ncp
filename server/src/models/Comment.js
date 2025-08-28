const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const CommentSchema = new mongoose.Schema({
  author: {
    type: String,
    required: [true, "Please add an author name"],
    trim: true,
    maxlength: [100, "Author name cannot be more than 100 characters"],
  },
  content: {
    type: String,
    required: [true, "Please add comment content"],
    trim: true,
    maxlength: [1000, "Comment cannot be more than 1000 characters"],
  },
  postSlug: {
    type: String,
    required: [true, "Please add a post slug"],
    trim: true,
  },
  postTitle: {
    type: String,
    required: [true, "Please add a post title"],
    trim: true,
  },
  postType: {
    type: String,
    enum: ["youtube", "facebook", "news", "rss"],
    required: [true, "Please specify post type"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Optional for guest comments
  },
  userEmail: {
    type: String,
    required: false, // Optional for guest comments
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      "Please add a valid email",
    ],
  },
  isApproved: {
    type: Boolean,
    default: true, // Set to false if you want moderation
  },
  isSpam: {
    type: Boolean,
    default: false,
  },
  parentCommentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: false, // For nested replies
  },
  likes: {
    type: Number,
    default: 0,
  },
  dislikes: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for better query performance
CommentSchema.index({ postSlug: 1, createdAt: -1 });
CommentSchema.index({ postType: 1, postSlug: 1 });
CommentSchema.index({ userId: 1 });
CommentSchema.index({ isApproved: 1 });

// Update timestamp on save
CommentSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual for total engagement
CommentSchema.virtual("totalEngagement").get(function () {
  return this.likes + this.dislikes;
});

// Ensure virtual fields are serialized
CommentSchema.set("toJSON", { virtuals: true });
CommentSchema.set("toObject", { virtuals: true });

// Add pagination plugin
CommentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model("Comment", CommentSchema);
