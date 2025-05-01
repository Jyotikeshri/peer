// Updated userRoutes.js with direct handler implementation
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getUserProfile, 
  updateUserProfile, 
  getAllUsers, 
  getUserBadges,
  addFriend,
  findMatches,
  upload,
  getFriendsList,
  onboard
} from '../controllers/userController.js';
import User from '../models/User.js';

const router = express.Router();

// Your existing routes
router.get('/profile', protect, getUserProfile);
router.post('/onboarding', protect, onboard);

router.put('/profile', protect, upload.single('avatar'), updateUserProfile);
router.get('/', protect, getAllUsers);
router.get('/get-badge', protect, getUserBadges);
router.get('/matches', protect, findMatches);

// Add friend route
router.put('/add-friend', protect, async (req, res) => {
  const { userId, friendId } = req.body;
  
  if (!userId || !friendId) {
    return res.status(400).json({ message: 'User ID and Friend ID are required' });
  }
  
  try {
    await addFriend(userId, friendId);
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding friend', error: error.message });
  }
});

router.get('/friends', protect , getFriendsList);

// Remove friend route - implement directly here for now
router.put('/remove-friend', protect, async (req, res) => {
  try {
    console.log('Remove Friend route handler called');
    console.log('Request body:', req.body);
    
    const { userId, friendId } = req.body;
    
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'User ID and Friend ID are required' });
    }
    
    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove the friendId from the friends array
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    await user.save();
    
    // Also remove the user from the friend's friends list for consistency
    const friend = await User.findById(friendId);
    if (friend) {
      friend.friends = friend.friends.filter(id => id.toString() !== userId);
      await friend.save();
    }
    
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
});

export default router;