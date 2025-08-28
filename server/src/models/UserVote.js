const mongoose = require("mongoose");

const UserVoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, // Make userId optional since we're using userEmail
  },
  userEmail: {
    type: String,
    required: true,
  },
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: true,
  },
  vote: {
    type: String,
    enum: ["like", "dislike"],
    required: true,
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

// Ensure one user can only vote once per comment
// Only use userEmail + commentId as the unique constraint
UserVoteSchema.index({ userEmail: 1, commentId: 1 }, { unique: true });

// Update timestamp on save
UserVoteSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("UserVote", UserVoteSchema);
