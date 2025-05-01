// src/pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Snackbar
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
import GroupsList from './components/GroupsList';
import FriendRequestButton from './components/FriendRequestButton';
import useUserStore from '../../contexts/userStore';
import Header from '../Dashboard/components/Header';

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
      
      // If no ID or ID matches current user, show own profile
      if (isOwnProfile) {
        if (!user) {
          await fetchUser();
        }
        setProfileUser(user);
        setProfileLoading(false);
        return;
      }
      
      // Otherwise, fetch the other user's profile
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/${id}`,
          { credentials: 'include' }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        
        const userData = await response.json();
        setProfileUser(userData);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setNotification({
          open: true,
          message: 'Failed to load user profile',
          type: 'error'
        });
      } finally {
        setProfileLoading(false);
      }
    };
    
    loadProfile();
  }, [id, user, isOwnProfile, fetchUser]);

  // Show error notification if userStore has an error
  useEffect(() => {
    if (error) {
      setNotification({
        open: true,
        message: `Error: ${error}`,
        type: 'error'
      });
    }
  }, [error]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleFormUpdate = async (updatedData) => {
    setIsSubmitting(true);
    try {
      // Use Zustand store's updateProfile function
      const updatedUser = await updateProfile(updatedData);
      
      if (updatedUser) {
        setIsEditing(false);
        setProfileUser(updatedUser);
        setNotification({
          open: true,
          message: 'Profile updated successfully',
          type: 'success'
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setNotification({
        open: true,
        message: 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

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
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        {/* Header */}
        <Header />
        
        {/* Main profile content */}
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
              {/* Profile Header Section */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={profileUser?.avatar} 
                      alt={profileUser?.username} 
                      sx={{ width: 120, height: 120, mr: 3 }}
                    />
                    <Box>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>
                        {profileUser?.username}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={profileUser?.rating || 0} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                          ({profileUser?.reviews?.length || 0} reviews)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {profileUser?.github && (
                          <IconButton component={Link} href={profileUser.github} target="_blank" size="small">
                            <GitHubIcon />
                          </IconButton>
                        )}
                        {profileUser?.linkedin && (
                          <IconButton component={Link} href={profileUser.linkedin} target="_blank" size="small">
                            <LinkedInIcon />
                          </IconButton>
                        )}
                        {profileUser?.leetcode && (
                          <IconButton component={Link} href={profileUser.leetcode} target="_blank" size="small">
                            <CodeIcon />
                          </IconButton>
                        )}
                        {profileUser?.portfolio && (
                          <IconButton component={Link} href={profileUser.portfolio} target="_blank" size="small">
                            <LanguageIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box>
                    {isOwnProfile ? (
                      <Button 
                        variant="outlined" 
                        startIcon={<EditIcon />} 
                        onClick={handleEditToggle}
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <FriendRequestButton profileUserId={profileUser._id} />
                    )}
                  </Box>
                </Box>
                
                {profileUser?.bio && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {profileUser.bio}
                  </Typography>
                )}
                
                <Grid container spacing={3}>
                  {/* Interests */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profileUser?.interests && profileUser.interests.length > 0 ? (
                        profileUser.interests.map((interest, index) => (
                          <Chip key={index} label={interest} size="small" />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No interests added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  {/* Strengths */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Strengths
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profileUser?.strengths && profileUser.strengths.length > 0 ? (
                        profileUser.strengths.map((strength, index) => (
                          <Chip 
                            key={index} 
                            label={strength} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No strengths added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  {/* Needs Help With */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Needs Help With
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {profileUser?.needsHelpWith && profileUser.needsHelpWith.length > 0 ? (
                        profileUser.needsHelpWith.map((item, index) => (
                          <Chip 
                            key={index} 
                            label={item} 
                            size="small" 
                            color="secondary" 
                            variant="outlined"
                          />
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No help areas added yet
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
              
              {/* Tabs for Badges, Friends, Reviews, Groups */}
              <Paper sx={{ borderRadius: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  variant="fullWidth"
                  sx={{ borderBottom: 1, borderColor: 'divider' }}
                >
                  <Tab 
                    icon={<EmojiEventsIcon />} 
                    label="Badges" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<GroupIcon />} 
                    label="Friends" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<ReviewsIcon />} 
                    label="Reviews" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<GroupIcon />} 
                    label="Groups" 
                    iconPosition="start"
                  />
                </Tabs>
                
                <Box sx={{ p: 3 }}>
                  {tabValue === 0 && <BadgesList badges={profileUser?.badges || []} />}
                  {tabValue === 1 && <FriendsList friends={profileUser?.friends || []} />}
                  {tabValue === 2 && <ReviewsList reviews={profileUser?.reviews || []} />}
                  {tabValue === 3 && <GroupsList groups={profileUser?.groups || []} />}
                </Box>
              </Paper>
            </>
          )}
        </Container>
      </Box>

      {/* Notification */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.type} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;