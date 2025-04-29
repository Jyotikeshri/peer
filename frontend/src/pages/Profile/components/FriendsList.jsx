// src/pages/Profile/components/FriendsList.jsx
import { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  CircularProgress, 
  Paper,
  Avatar,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  IconButton
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import MessageIcon from '@mui/icons-material/Message';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';

const FriendsList = ({ friends = [] }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [friendsData, setFriendsData] = useState([]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        if (friends && friends.length > 0) {
          // In a real implementation, you would fetch friend details if they're not already included
          // For now, we'll just use mock data
          const mockFriendsData = [
            { 
              id: '1', 
              username: 'janedoe', 
              avatar: 'https://randomuser.me/api/portraits/women/11.jpg',
              rating: 4.8,
              isOnline: true,
              strengths: ['React', 'Node.js', 'MongoDB']
            },
            { 
              id: '2', 
              username: 'johnsmith', 
              avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
              rating: 4.5,
              isOnline: false,
              strengths: ['Python', 'Machine Learning', 'Data Science']
            },
            { 
              id: '3', 
              username: 'lisawong', 
              avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
              rating: 4.9,
              isOnline: true,
              strengths: ['Java', 'Spring Boot', 'Microservices']
            },
            { 
              id: '4', 
              username: 'mikebrown', 
              avatar: 'https://randomuser.me/api/portraits/men/58.jpg',
              rating: 4.2,
              isOnline: false,
              strengths: ['JavaScript', 'React Native', 'AWS']
            }
          ];
          
          // In a real implementation, you would use the actual data from the API
          setFriendsData(mockFriendsData);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFriends();
  }, [friends]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <GroupIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" color="text.secondary">
          No friends yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Connect with peers to expand your network
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={2}>
      {friendsData.map((friend) => (
        <Grid item xs={12} sm={6} md={4} key={friend.id}>
          <Card sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            borderRadius: 2,
          }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'flex-start' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={friend.avatar} 
                  alt={friend.username} 
                  sx={{ width: 70, height: 70 }}
                />
                {friend.isOnline && (
                  <Box 
                    sx={{
                      position: 'absolute',
                      bottom: 3,
                      right: 3,
                      width: 14,
                      height: 14,
                      bgcolor: '#4CAF50',
                      borderRadius: '50%',
                      border: '2px solid white'
                    }}
                  />
                )}
              </Box>
              <Box sx={{ ml: 2, flex: 1 }}>
                <Typography variant="h6">
                  {friend.username}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                    Rating: {friend.rating}/5
                  </Typography>
                  <Chip 
                    label={friend.isOnline ? 'Online' : 'Offline'} 
                    size="small" 
                    color={friend.isOnline ? 'success' : 'default'}
                    variant="outlined"
                  />
                </Box>
              </Box>
            </Box>
            
            <Divider />
            
            <CardContent sx={{ flexGrow: 1, pt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Strengths:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {friend.strengths.map((strength, index) => (
                  <Chip key={index} label={strength} size="small" />
                ))}
              </Box>
            </CardContent>
            
            <CardActions sx={{ p: 2, pt: 0 }}>
              <Button 
                startIcon={<MessageIcon />} 
                variant="outlined" 
                size="small"
                fullWidth
              >
                Message
              </Button>
              <IconButton color="error" size="small">
                <PersonRemoveIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default FriendsList;