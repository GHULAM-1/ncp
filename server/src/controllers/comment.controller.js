const Comment = require("../models/Comment");

// @desc    Get comments for a specific post with replies
// @route   GET /api/comments/:postSlug
// @access  Public
const getCommentsByPost = async (req, res) => {
  try {
    const { postSlug } = req.params;
    const { page = 1, limit = 20, postType, userEmail } = req.query;

    const query = { 
      postSlug, 
      isApproved: true, 
      isSpam: false,
      parentCommentId: null // Only get top-level comments
    };

    if (postType) {
      query.postType = postType;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: {
        path: 'userId',
        select: 'name avatar'
      }
    };

    const comments = await Comment.paginate(query, options);

    // Recursive function to get all nested replies
    const getRepliesRecursively = async (commentId, depth = 0) => {
      if (depth > 10) return []; // Prevent infinite recursion, max 10 levels
      
      const replies = await Comment.find({
        parentCommentId: commentId,
        isApproved: true,
        isSpam: false
      }).populate('userId', 'name avatar').sort({ createdAt: 1 });

      const repliesWithVotes = await Promise.all(
        replies.map(async (reply) => {
          let replyUserVote = null;
          if (userEmail) {
            const replyVote = await UserVote.findOne({ 
              userEmail: userEmail, 
              commentId: reply._id 
            });
            replyUserVote = replyVote ? replyVote.vote : null;
          }

          // Recursively get replies to this reply
          const nestedReplies = await getRepliesRecursively(reply._id, depth + 1);

          return {
            ...reply.toObject(),
            userVote: replyUserVote,
            replies: nestedReplies,
            depth: depth + 1
          };
        })
      );

      return repliesWithVotes;
    };

    // Get replies for each comment and user votes
    const UserVote = require("../models/UserVote");
    const commentsWithReplies = await Promise.all(
      comments.docs.map(async (comment) => {
        // Get user's vote for this comment
        let userVote = null;
        if (userEmail) {
          const vote = await UserVote.findOne({ 
            userEmail: userEmail, 
            commentId: comment._id 
          });
          userVote = vote ? vote.vote : null;
        }

        // Get all nested replies recursively
        const replies = await getRepliesRecursively(comment._id);

        return {
          ...comment.toObject(),
          userVote: userVote,
          replies: replies,
          depth: 0
        };
      })
    );

    res.json({
      success: true,
      count: comments.totalDocs,
      comments: commentsWithReplies,
      totalPages: comments.totalPages,
      currentPage: comments.page,
      hasNextPage: comments.hasNextPage,
      hasPrevPage: comments.hasPrevPage
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comments",
      message: error.message
    });
  }
};

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Public (can be restricted later)
const createComment = async (req, res) => {
  try {
    const { author, content, postSlug, postTitle, postType, userEmail, parentCommentId } = req.body;

    // Basic validation
    if (!author || !content || !postSlug || !postTitle || !postType) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields"
      });
    }

    // Check if user is authenticated (optional)
    let userId = null;
    if (req.user) {
      userId = req.user._id;
    }

    // Create comment
    const comment = await Comment.create({
      author: author.trim(),
      content: content.trim(),
      postSlug,
      postTitle,
      postType,
      userId,
      userEmail: userEmail || null,
      parentCommentId: parentCommentId || null
    });

    // Populate user info if available
    if (userId) {
      await comment.populate('userId', 'name avatar');
    }

    res.status(201).json({
      success: true,
      comment,
      message: "Comment created successfully"
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create comment",
      message: error.message
    });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:id
// @access  Private (comment owner or admin)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Content is required"
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found"
      });
    }

    // Check if user owns the comment or is admin
    if (req.user && (comment.userId?.toString() === req.user._id || req.user.role === 'admin')) {
      comment.content = content.trim();
      comment.updatedAt = Date.now();
      await comment.save();

      res.json({
        success: true,
        comment,
        message: "Comment updated successfully"
      });
    } else {
      res.status(403).json({
        success: false,
        error: "Not authorized to update this comment"
      });
    }
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update comment",
      message: error.message
    });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private (comment owner or admin)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found"
      });
    }

    // Check if user owns the comment or is admin
    if (req.user && (comment.userId?.toString() === req.user._id || req.user.role === 'admin')) {
      await Comment.findByIdAndDelete(id);

      res.json({
        success: true,
        message: "Comment deleted successfully"
      });
    } else {
      res.status(403).json({
        success: false,
        error: "Not authorized to delete this comment"
      });
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete comment",
      message: error.message
    });
  }
};

// @desc    Like/Dislike a comment
// @route   POST /api/comments/:id/reaction
// @access  Public
const reactToComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, userEmail } = req.body; // 'like' or 'dislike'

    if (!['like', 'dislike'].includes(reaction)) {
      return res.status(400).json({
        success: false,
        error: "Invalid reaction type"
      });
    }

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: "User email is required"
      });
    }

    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: "Comment not found"
      });
    }

    // Check if user already voted on this comment
    const UserVote = require("../models/UserVote");
    let existingVote = await UserVote.findOne({ 
      userEmail: userEmail, 
      commentId: id 
    });

    if (existingVote) {
      // User already voted, update their vote
      if (existingVote.vote === reaction) {
        // User is clicking the same reaction, remove their vote
        if (reaction === 'like') {
          comment.likes = Math.max(0, comment.likes - 1);
        } else {
          comment.dislikes = Math.max(0, comment.dislikes - 1);
        }
        await existingVote.deleteOne();
      } else {
        // User is changing their vote
        if (existingVote.vote === 'like') {
          comment.likes = Math.max(0, comment.likes - 1);
        } else {
          comment.dislikes = Math.max(0, comment.dislikes - 1);
        }
        
        if (reaction === 'like') {
          comment.likes += 1;
        } else {
          comment.dislikes += 1;
        }
        
        existingVote.vote = reaction;
        // Update userId if available from the comment
        if (comment.userId) {
          existingVote.userId = comment.userId;
        }
        await existingVote.save();
      }
    } else {
      // User hasn't voted yet, add their vote
      if (reaction === 'like') {
        comment.likes += 1;
      } else {
        comment.dislikes += 1;
      }
      
      // Create new vote record
      const voteData = {
        userEmail: userEmail,
        commentId: id,
        vote: reaction
      };
      
      // Add userId if available from the comment
      if (comment.userId) {
        voteData.userId = comment.userId;
      }
      
      await UserVote.create(voteData);
    }

    await comment.save();

    res.json({
      success: true,
      comment,
      message: `Comment ${reaction}d successfully`
    });
  } catch (error) {
    console.error("Error reacting to comment:", error);
    res.status(500).json({
      success: false,
      error: "Failed to react to comment",
      message: error.message
    });
  }
};

// @desc    Get replies for a specific comment
// @route   GET /api/comments/:commentId/replies
// @access  Public
const getCommentReplies = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const query = { 
      parentCommentId: commentId,
      isApproved: true, 
      isSpam: false 
    };

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: 1 },
      populate: {
        path: 'userId',
        select: 'name avatar'
      }
    };

    const replies = await Comment.paginate(query, options);

    res.json({
      success: true,
      count: replies.totalDocs,
      replies: replies.docs,
      totalPages: replies.totalPages,
      currentPage: replies.page,
      hasNextPage: replies.hasNextPage,
      hasPrevPage: replies.hasPrevPage
    });
  } catch (error) {
    console.error("Error fetching comment replies:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comment replies",
      message: error.message
    });
  }
};

// @desc    Get comment statistics
// @route   GET /api/comments/stats/:postSlug
// @access  Public
const getCommentStats = async (req, res) => {
  try {
    const { postSlug } = req.params;

    const stats = await Comment.aggregate([
      { $match: { postSlug, isApproved: true, isSpam: false } },
      {
        $group: {
          _id: null,
          totalComments: { $sum: 1 },
          totalLikes: { $sum: "$likes" },
          totalDislikes: { $sum: "$dislikes" },
          avgLikes: { $avg: "$likes" },
          avgDislikes: { $avg: "$dislikes" }
        }
      }
    ]);

    const result = stats[0] || {
      totalComments: 0,
      totalLikes: 0,
      totalDislikes: 0,
      avgLikes: 0,
      avgDislikes: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    console.error("Error fetching comment stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch comment statistics",
      message: error.message
    });
  }
};

module.exports = {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  reactToComment,
  getCommentStats,
  getCommentReplies
};
