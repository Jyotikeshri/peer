import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserBadges,
  findMatches,
  upload,
  getFriendsList,
  onboard,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getPendingFriendRequests,
  getUserNotifications,
  removeFriend,
  getUserById,
  addFriend
} from '../controllers/userController.js';

const router = express.Router();

// User profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('avatar'), updateUserProfile);
router.post('/onboarding', protect, onboard);

// User discovery routes
router.get('/', protect, getAllUsers);
router.get('/matches', protect, findMatches);

// User achievements
router.get('/get-badge', protect, getUserBadges);

// Friend management routes
router.get('/friends', protect, getFriendsList);
router.put('/add-friend', protect, async (req, res) => {
  const { userId, friendId } = req.body;
  
  if (!userId || !friendId) {
    return res.status(400).json({ message: 'User ID and Friend ID are required' });
  }
  
  try {
    // Assuming addFriend is a function that handles adding friends
    await addFriend(userId, friendId);
    res.status(200).json({ message: 'Friend added successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding friend', error: error.message });
  }
});

router.put('/remove-friend', protect, async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'User ID and Friend ID are required' });
    }
    
    await removeFriend(userId, friendId);
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error removing friend:', error);
    res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
});

// Friend request routes
router.post('/friend-request', protect, sendFriendRequest);
router.post('/friend-request/accept', protect, acceptFriendRequest);
router.post('/friend-request/reject', protect, rejectFriendRequest);
router.get('/friend-requests', protect, getPendingFriendRequests);
router.get('/:id', protect, getUserById);

// Notification routes
router.get('/notifications', protect, getUserNotifications);

export default router;