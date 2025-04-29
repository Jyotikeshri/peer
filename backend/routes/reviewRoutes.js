// routes/reviewRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js'; // Protect route
import { submitReview, getAllReviews, getReviewsForUser } from '../controllers/reviewController.js';

const router = express.Router();

// Submit review
router.post('/', protect, submitReview);



// Get all reviews for the logged-in user
router.get('/', protect, getAllReviews);
router.get('/:userId', protect, getReviewsForUser);  // New route for fetching all reviews

export default router;
