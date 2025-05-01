import multer from 'multer';
import cloudinary from 'cloudinary';
import { v2 as cloudinaryV2 } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import User from '../models/User.js';
import Badge from '../models/Badge.js';
import dotenv from 'dotenv';
dotenv.config();
import * as tf from '@tensorflow/tfjs';
import * as use from '@tensorflow-models/universal-sentence-encoder';
import { upsertStreamUser } from '../config/stream.js';


// Cloudinary configuration
cloudinaryV2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dj5qqi6ly',
  api_key: process.env.CLOUDINARY_API_KEY || '712721644946881',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'N4WRbAS9GVJCpUB3M8JOqazfezM'
});

// Cloudinary storage configuration for Multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinaryV2,
  params: {
    folder: 'avatars', // folder where images will be uploaded
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'], // allowed formats
  },
});

// Initialize multer with cloudinary storage
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Simple model loading without complex memory management
let model = null;
let modelLoading = false;

async function loadModel() {
  if (model) return model;
  
  if (modelLoading) {
    // Wait for model to load
    console.log("Model is already loading, waiting...");
    while (modelLoading) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return model;
  }
  
  try {
    modelLoading = true;
    console.log("Loading Universal Sentence Encoder model...");
    model = await use.load();
    console.log("Model loaded successfully");
    return model;
  } catch (error) {
    console.error("Failed to load model:", error);
    throw error;
  } finally {
    modelLoading = false;
  }
}

// Simple similarity computation function
async function computeSimilarity(text1, text2) {
  try {
    // Skip if either input is empty
    if (!text1 || !text2) {
      return 0;
    }
    
    // Get the model
    const useModel = await loadModel();
    
    // Embed the texts
    const embeddings = await useModel.embed([text1, text2]);
    const embedArray = await embeddings.array();
    
    // Calculate cosine similarity manually to avoid TensorFlow issues
    const vec1 = embedArray[0];
    const vec2 = embedArray[1];
    
    // Compute dot product
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    // Calculate cosine similarity
    const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    
    // Clean up tensors
    embeddings.dispose();
    
    return similarity;
  } catch (error) {
    console.error('Error computing similarity:', error);
    return 0; // Return default value if there's an error
  }
}

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update user profile with avatar upload
export const updateUserProfile = async (req, res) => {
  try {
    console.log("Request received to update profile");
    console.log("Request file:", req.file);  
    console.log("Request body:", req.body);

    // Parse JSON strings back to arrays if they were stringified
    let interests = req.body.interests;
    let strengths = req.body.strengths;
    let needsHelpWith = req.body.needsHelpWith;

    try {
      // Check if these fields are JSON strings and parse them
      if (interests && typeof interests === 'string') {
        interests = JSON.parse(interests);
      }
      if (strengths && typeof strengths === 'string') {
        strengths = JSON.parse(strengths);
      }
      if (needsHelpWith && typeof needsHelpWith === 'string') {
        needsHelpWith = JSON.parse(needsHelpWith);
      }
    } catch (parseError) {
      console.error("Error parsing JSON fields:", parseError);
      // Continue with the original values if parsing fails
    }

    const { bio, github, linkedin, leetcode, portfolio, isOnboarded } = req.body;

    // Check if avatar file is uploaded
    let avatar;
    if (req.file) {
      avatar = req.file.path; // Contains Cloudinary URL if successful
      console.log('Avatar URL:', avatar);
    } else {
      console.log('No new avatar file uploaded');
    }

    // Build the update object, only including fields that are provided
    const updatedUserData = {};
    
    if (bio !== undefined) updatedUserData.bio = bio;
    if (avatar) updatedUserData.avatar = avatar;
    if (interests) updatedUserData.interests = interests;
    if (strengths) updatedUserData.strengths = strengths;
    if (needsHelpWith) updatedUserData.needsHelpWith = needsHelpWith;
    if (github !== undefined) updatedUserData.github = github;
    if (linkedin !== undefined) updatedUserData.linkedin = linkedin;
    if (leetcode !== undefined) updatedUserData.leetcode = leetcode;
    if (portfolio !== undefined) updatedUserData.portfolio = portfolio;

    if (typeof isOnboarded !== 'undefined') {
      updatedUserData.isOnboarded = (isOnboarded === 'true' || isOnboarded === true);
    }

    console.log('Updating user with data:', updatedUserData);


    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedUserData,
      { new: true } // Return updated user
    ).select('-password');
    
    
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.username,
        image: updatedUser.avatar || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.username}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }
    // Exclude password field

    if (!updatedUser) {
      console.log('User not found with ID:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User updated successfully:', updatedUser._id);
    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all users (for admin or search feature)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user badges
export const getUserBadges = async (req, res) => {
  try {
    const badges = await Badge.find({ user: req.user._id });

    if (badges.length === 0) {
      return res.status(404).json({ message: 'No badges earned yet.' });
    }

    res.status(200).json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add friend function
async function addFriend(userId, friendId) {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  // Check if the friend is already in the friends list
  if (!user.friends.includes(friendId)) {
    user.friends.push(friendId);
    await user.save();
    console.log(`User ${userId} added friend ${friendId}`);
  } else {
    console.log('Friend already added');
  }
}

// Simplified findMatches function without complex TensorFlow memory management
export const findMatches = async (req, res) => {
  const requestId = Math.random().toString(36).substring(2, 10);
  console.log(`[${requestId}] Starting findMatches`);

  try {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const allUsers = await User.find({ _id: { $ne: user._id } }).populate('friends', '-password');
    console.log(`[${requestId}] Found ${allUsers.length} potential matches`);

    const matches = [];
    const threshold = 0.3; // Lowered threshold for better matching

    for (const potentialMatch of allUsers) {
      let score = 0;

      const userBio = (user.bio || '').toLowerCase();
      const matchBio = (potentialMatch.bio || '').toLowerCase();

      const userInterests = (user.interests || []).join(' ').toLowerCase();
      const matchInterests = (potentialMatch.interests || []).join(' ').toLowerCase();

      const userStrengths = (user.strengths || []).join(' ').toLowerCase();
      const matchStrengths = (potentialMatch.strengths || []).join(' ').toLowerCase();

      const userNeeds = (user.needsHelpWith || []).join(' ').toLowerCase();
      const matchNeeds = (potentialMatch.needsHelpWith || []).join(' ').toLowerCase();

      // 1. Tensorflow semantic similarity
      if (userBio && matchBio) score += await computeSimilarity(userBio, matchBio);
      if (userInterests && matchInterests) score += await computeSimilarity(userInterests, matchInterests);
      if (userStrengths && matchNeeds) score += await computeSimilarity(userStrengths, matchNeeds);
      if (matchStrengths && userNeeds) score += await computeSimilarity(matchStrengths, userNeeds);

      // 2. Fallback: Direct text inclusion bonus
      if (userStrengths && matchNeeds && (userStrengths.includes(matchNeeds) || matchNeeds.includes(userStrengths))) {
        score += 0.5;
      }
      if (matchStrengths && userNeeds && (matchStrengths.includes(userNeeds) || userNeeds.includes(matchStrengths))) {
        score += 0.5;
      }

      // 3. Mutual friends bonus
      const userFriendIds = user.friends.map(f => f._id.toString());
      const matchFriendIds = potentialMatch.friends.map(f => f._id.toString());

      const hasMutualFriends = userFriendIds.some(friendId => matchFriendIds.includes(friendId));
      if (hasMutualFriends) {
        score += 0.5;
      }

      // 4. Only include if good enough
      if (score >= threshold) {
        matches.push({
          user: {
            _id: potentialMatch._id,
            username: potentialMatch.username,
            avatar: potentialMatch.avatar,
            bio: potentialMatch.bio,
            interests: potentialMatch.interests,
            strengths: potentialMatch.strengths,
            needsHelpWith: potentialMatch.needsHelpWith,
            friends: potentialMatch.friends,
          },
          score: parseFloat(score.toFixed(2))
        });
      }
    }

    // Sort descending by best match first
    matches.sort((a, b) => b.score - a.score);

    console.log(`[${requestId}] Found ${matches.length} matches after scoring`);
    res.status(200).json(matches);
    
  } catch (error) {
    console.error(`[${requestId}] Error in findMatches:`, error);
    res.status(500).json({ message: error.message || 'Error finding matches' });
  }
};

// -------------------------
// Helper: partial matcher
function stringPartialMatch(textA, textB) {
  return textA.includes(textB) || textB.includes(textA);
}


export const onboard =  async (req, res) => {
  try {
    const { isOnboarded } = req.body;
    
    if (typeof isOnboarded !== 'boolean') {
      return res.status(400).json({ message: 'isOnboarded must be a boolean value' });
    }
    
    // Get the user's ID from the authenticated session
    const userId = req.user.id;
    
    // Update only the isOnboarded field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isOnboarded },
      { new: true } // Return the updated document
    );

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.username,
        image: updatedUser.avatar || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.username}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};




export const removeFriendHandler = async (req, res) => {
  try {
    console.log('Remove Friend handler called');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    // Check if body exists
    if (!req.body) {
      return res.status(400).json({ message: 'Request body is missing' });
    }
    
    const { userId, friendId } = req.body;
    
    console.log('Extracted IDs:', { userId, friendId });
    
    if (!userId || !friendId) {
      return res.status(400).json({ message: 'User ID and Friend ID are required' });
    }
    
    // Call the helper function that does the actual work
    await removeFriend(userId, friendId);
    
    res.status(200).json({ message: 'Friend removed successfully' });
  } catch (error) {
    console.error('Error in removeFriendHandler:', error);
    res.status(500).json({ message: 'Error removing friend', error: error.message });
  }
};

// This is the helper function that actually removes the friend
// It doesn't use res because it's not a controller
export const removeFriend = async (userId, friendId) => {
  // Remove the friend from the user's friends list
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
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
};

export const getFriendsList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', '-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user.friends);
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ message: 'Server error fetching friends' });
  }
};


export { addFriend, upload };