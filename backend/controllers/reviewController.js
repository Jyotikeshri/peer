import Review from "../models/Review.js";
import User from "../models/User.js";

export const submitReview = async (req, res) => {
    try {
        const { revieweeId, ratings, text } = req.body;

        if (!revieweeId || !ratings)
            return res.status(400).json({ message: 'All fields are required' });

        // Destructure the ratings object to ensure we pass individual values
        const { collaboration, skill, communication, teamwork, punctuality } = ratings;

        // Ensure all ratings values are numbers between 1 and 5
        if (
            [collaboration, skill, communication, teamwork, punctuality].some(
                rating => typeof rating !== 'number' || rating < 1 || rating > 5
            )
        ) {
            return res.status(400).json({ message: 'Ratings must be numbers between 1 and 5' });
        }

        // Create the review with individual ratings fields
        const review = new Review({
            reviewer: req.user._id,
            reviewee: revieweeId,
            ratings: {
                collaboration,
                skill,
                communication,
                teamwork,
                punctuality
            },
            text
        });

        await review.save();

        // Update reviewee's average ratings
        await updateUserRating(revieweeId);

        res.status(201).json({ message: 'Review submitted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
};

// Function to update user rating based on reviews
const updateUserRating = async (userId) => {
    const reviews = await Review.find({ reviewee: userId });

    // If there are no reviews, don't update the rating
    if (reviews.length === 0) {
        return;
    }

    // Calculate the average for each rating category
    const avgRatings = {
        collaboration: reviews.reduce((sum, r) => sum + r.ratings.collaboration, 0) / reviews.length,
        skill: reviews.reduce((sum, r) => sum + r.ratings.skill, 0) / reviews.length,
        communication: reviews.reduce((sum, r) => sum + r.ratings.communication, 0) / reviews.length,
        teamwork: reviews.reduce((sum, r) => sum + r.ratings.teamwork, 0) / reviews.length,
        punctuality: reviews.reduce((sum, r) => sum + r.ratings.punctuality, 0) / reviews.length
    };

    // Calculate the overall average rating from the individual ratings
    const overallAverageRating = (
        avgRatings.collaboration + 
        avgRatings.skill + 
        avgRatings.communication + 
        avgRatings.teamwork + 
        avgRatings.punctuality
    ) / 5;  // You can adjust the divisor based on your rating structure

    // Update the user rating with the overall average rating
    await User.findByIdAndUpdate(userId, { rating: overallAverageRating });
};

export const getReviewsForUser = async (req, res) => {
    try {
      // If the logged-in user is not an admin, allow them to only fetch their own reviews
      const userId = req.params.userId;  // Get the userId from the URL parameter
      const reviews = await Review.find({ reviewee: userId })
        .populate('reviewer', 'username email') // Populate reviewer details
        .sort({ date: -1 }); // Sort by most recent review
    
      if (reviews.length === 0) {
        return res.status(404).json({ message: 'No reviews found for this user' });
      }
  
      res.status(200).json(reviews);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
 };
export const getAllReviews = async (req, res) => {
    try {
        // Fetch reviews for the user (using user ID from the token)
        const reviews = await Review.find({ reviewee: req.user._id })
            .populate('reviewer', 'username email') // Get reviewer details
            .populate('session', 'name subject scheduledTime') // Get session details
            .sort({ date: -1 }); // Sort by most recent review
    
        if (reviews.length === 0) {
            return res.status(404).json({ message: 'No reviews found' });
        }
    
        res.status(200).json(reviews);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
