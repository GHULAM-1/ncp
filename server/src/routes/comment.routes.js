const express = require('express');
const router = express.Router();
const {
  getCommentsByPost,
  createComment,
  updateComment,
  deleteComment,
  reactToComment,
  getCommentStats,
  getCommentReplies
} = require('../controllers/comment.controller');

// Public routes
router.get('/:postSlug', getCommentsByPost);
router.get('/:commentId/replies', getCommentReplies);
router.post('/', createComment);
router.post('/:id/reaction', reactToComment);
router.get('/stats/:postSlug', getCommentStats);

// Protected routes (require authentication)
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);

module.exports = router;
