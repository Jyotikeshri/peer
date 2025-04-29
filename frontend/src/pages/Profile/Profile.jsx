// src/pages/Profile/Profile.jsx
import { useState, useEffect } from 'react';
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
import useUserStore from '../../contexts/userStore';
import Header from '../Dashboard/components/Header';

const Profile = () => {
  const { user, isLoading, error, fetchUser, updateProfile } = useUserStore();
  const [isEditing, setIsEditing] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', type: 'success' });

  useEffect(() => {
    // Fetch user data if not already loaded
    if (!user) {
      fetchUser();
    }
  }, [user, fetchUser]);

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

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
              user={user} 
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
                      src={user?.avatar} 
                      alt={user?.username} 
                      sx={{ width: 120, height: 120, mr: 3 }}
                    />
                    <Box>
                      <Typography variant="h4" sx={{ mb: 0.5 }}>
                        {user?.username}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={user?.rating || 0} readOnly precision={0.5} />
                        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
                          ({user?.reviews?.length || 0} reviews)
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {user?.github && (
                          <IconButton component={Link} href={user.github} target="_blank" size="small">
                            <GitHubIcon />
                          </IconButton>
                        )}
                        {user?.linkedin && (
                          <IconButton component={Link} href={user.linkedin} target="_blank" size="small">
                            <LinkedInIcon />
                          </IconButton>
                        )}
                        {user?.leetcode && (
                          <IconButton component={Link} href={user.leetcode} target="_blank" size="small">
                            <CodeIcon />
                          </IconButton>
                        )}
                        {user?.portfolio && (
                          <IconButton component={Link} href={user.portfolio} target="_blank" size="small">
                            <LanguageIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Button 
                    variant="outlined" 
                    startIcon={<EditIcon />} 
                    onClick={handleEditToggle}
                  >
                    Edit Profile
                  </Button>
                </Box>
                
                {user?.bio && (
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {user.bio}
                  </Typography>
                )}
                
                <Grid container spacing={3}>
                  {/* Interests */}
                  <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                      Interests
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {user?.interests && user.interests.length > 0 ? (
                        user.interests.map((interest, index) => (
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
                      {user?.strengths && user.strengths.length > 0 ? (
                        user.strengths.map((strength, index) => (
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
                      {user?.needsHelpWith && user.needsHelpWith.length > 0 ? (
                        user.needsHelpWith.map((item, index) => (
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
                  {tabValue === 0 && <BadgesList badges={user?.badges || []} />}
                  {tabValue === 1 && <FriendsList friends={user?.friends || []} />}
                  {tabValue === 2 && <ReviewsList reviews={user?.reviews || []} />}
                  {tabValue === 3 && <GroupsList groups={user?.groups || []} />}
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