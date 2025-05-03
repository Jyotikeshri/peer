// src/pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useChatContext } from 'stream-chat-react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  Link,
  Rating,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import CodeIcon from '@mui/icons-material/Code';
import LanguageIcon from '@mui/icons-material/Language';
import GroupIcon from '@mui/icons-material/Group';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import ReviewsIcon from '@mui/icons-material/Reviews';
import Sidebar from '../Dashboard/components/Sidebar';

import ProfileEditForm from './components/ProfileEditForm';
import BadgesList from './components/BadgesList';
import FriendsList from './components/FriendsList';
import ReviewsList from './components/ReviewsList';

// import FriendRequestButton from './components/FriendRequestButton';
import useUserStore from '../../contexts/userStore';
import Header from '../Dashboard/components/Header';
import GroupList from './components/GroupsList';
import { StreamChat } from 'stream-chat';

const Profile = () => {
  
  const { id } = useParams(); // Get profile ID from URL params
  const { user, isLoading, error, fetchUser, updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });
  const [profileLoading, setProfileLoading] = useState(true);

  // Check if viewing own profile
  const isOwnProfile = !id || (user && user._id === id);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      if (isOwnProfile) {
        if (!user) await fetchUser();
        setProfileUser(user);
        setProfileLoading(false);
        return;
      }
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/${id}`,
          { credentials: 'include' }
        );
        if (!response.ok) throw new Error('Failed to fetch user profile');
        const userData = await response.json();
        setProfileUser(userData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setNotification({ open: true, message: 'Failed to load user profile', type: 'error' });
      } finally {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [id, user, isOwnProfile, fetchUser]);

  useEffect(() => {
    if (error) {
      setNotification({ open: true, message: `Error: ${error}`, type: 'error' });
    }
  }, [error]);

  const handleTabChange = (event, newValue) => setTabValue(newValue);
  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleFormUpdate = async (updatedData) => {
    setIsSubmitting(true);
    try {
      const updatedUser = await updateProfile(updatedData);
      if (updatedUser) {
        setIsEditing(false);
        setProfileUser(updatedUser);
        setNotification({ open: true, message: 'Profile updated successfully', type: 'success' });
      } else throw new Error('Failed to update profile');
    } catch (err) {
      console.error('Error updating profile:', err);
      setNotification({ open: true, message: 'Failed to update profile', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => setNotification({ ...notification, open: false });

  if (isLoading || profileLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
        <Sidebar />
        <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
          <Header />
          <Container maxWidth="xl" sx={{ py: 3 }}>
            <Alert severity="error">User profile not found</Alert>
          </Container>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <Header />
        <Container maxWidth="xl" sx={{ py: 3 }}>
          {isEditing ? (
            <ProfileEditForm
              user={profileUser}
              onSubmit={handleFormUpdate}
              onCancel={handleEditToggle}
              isSubmitting={isSubmitting}
            />
          ) : (
            <>
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                {/* Profile header code unchanged */}
              </Paper>

              <Paper sx={{ borderRadius: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth" sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab icon={<EmojiEventsIcon />} label="Badges" iconPosition="start" />
                  <Tab icon={<GroupIcon />} label="Friends" iconPosition="start" />
                  <Tab icon={<ReviewsIcon />} label="Reviews" iconPosition="start" />
                  <Tab icon={<GroupIcon />} label="Groups" iconPosition="start" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                  {tabValue === 0 && <BadgesList badges={profileUser?.badges || []} />}
                  {tabValue === 1 && <FriendsList friends={profileUser?.friends || []} />}
                  {tabValue === 2 && <ReviewsList reviews={profileUser?.reviews || []} />}
                  {tabValue === 3 && (
                    <GroupList
                      
                      userGroups={profileUser?.groups || []}
                    />
                  )}
                </Box>
              </Paper>
            </>
          )}
        </Container>
      </Box>
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.type} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
