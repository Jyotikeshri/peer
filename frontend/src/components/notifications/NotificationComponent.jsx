// src/components/NotificationComponent.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Avatar,
  Divider,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import useUserStore from '../../contexts/userStore';

const NotificationComponent = () => {
  const navigate = useNavigate();
  const { user, fetchUser, acceptFriendRequest, rejectFriendRequest } = useUserStore();
  const [anchorEl, setAnchorEl] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // Stores ID of request being processed

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Load friend requests when menu opens
    if (!anchorEl) {
      loadFriendRequests();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // Function to load friend request details
  const loadFriendRequests = async () => {
    if (!user?.friendRequests?.length) {
      setFriendRequests([]);
      return;
    }
    
    setLoading(true);
    try {
      // Using the endpoint for pending friend requests
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/friend-requests`,
        { credentials: 'include' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to load friend requests');
      }
      
      const data = await response.json();
      console.log('Friend requests loaded:', data);
      setFriendRequests(data);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load friend requests when user data changes
  useEffect(() => {
    if (anchorEl && user?.friendRequests?.length) {
      loadFriendRequests();
    }
  }, [user, anchorEl]);

  // Handle accepting a friend request
  const handleAccept = async (requesterId) => {
    if (actionLoading) return;
    setActionLoading(requesterId);
    
    try {
      const success = await acceptFriendRequest(requesterId);
      if (success) {
        // Update local state to remove the request
        setFriendRequests(prev => prev.filter(req => req._id !== requesterId));
        // Refresh user data
        await fetchUser();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle rejecting a friend request
  const handleReject = async (requesterId) => {
    if (actionLoading) return;
    setActionLoading(requesterId);
    
    try {
      const success = await rejectFriendRequest(requesterId);
      if (success) {
        // Update local state to remove the request
        setFriendRequests(prev => prev.filter(req => req._id !== requesterId));
        // Refresh user data
        await fetchUser();
      }
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle viewing all friend requests
  const handleViewAll = () => {
    navigate('/friends');
    handleClose();
  };

  // Count total notifications
  const notificationCount = (user?.friendRequests?.length || 0);

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        aria-controls="notification-menu"
        aria-haspopup="true"
      >
        <Badge badgeContent={notificationCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        id="notification-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          style: {
            width: '320px',
            maxHeight: '400px',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Notifications</Typography>
        </Box>
        
        <Divider />
        
        {/* Friend Requests Section */}
        {user?.friendRequests?.length > 0 ? (
          <>
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Friend Requests ({user.friendRequests.length})
              </Typography>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <>
                {friendRequests.length > 0 ? (
                  <List sx={{ width: '100%', py: 0 }}>
                    {friendRequests.map(request => (
                      <ListItem key={request._id} sx={{ px: 2 }}>
                        <ListItemAvatar>
                          <Avatar src={request.avatar} alt={request.username} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={request.username}
                          secondary="Sent you a friend request"
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                        <ListItemSecondaryAction>
                          {actionLoading === request._id ? (
                            <CircularProgress size={20} />
                          ) : (
                            <>
                              <IconButton
                                edge="end"
                                color="primary"
                                size="small"
                                onClick={() => handleAccept(request._id)}
                                sx={{ mr: 0.5 }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                edge="end"
                                color="error"
                                size="small"
                                onClick={() => handleReject(request._id)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </ListItemSecondaryAction>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <MenuItem disabled>
                    <Typography variant="body2">No friend requests found</Typography>
                  </MenuItem>
                )}
              </>
            )}
            
            {user.friendRequests.length > 2 && (
              <Box sx={{ p: 1.5, textAlign: 'center' }}>
                <Button
                  size="small"
                  onClick={handleViewAll}
                  endIcon={<PersonAddIcon />}
                >
                  View All Requests
                </Button>
              </Box>
            )}
          </>
        ) : (
          <MenuItem disabled>
            <Typography variant="body2">No new notifications</Typography>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default NotificationComponent;