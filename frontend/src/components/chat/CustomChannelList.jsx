// This is a custom ChannelList component that ensures messages are properly displayed
// Add this to your project as src/components/chat/CustomChannelList.jsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

// This component will manually handle the channel preview rendering
const CustomChannelList = ({ client, filters, sort }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch channels when the component mounts
  useEffect(() => {
    if (!client) return;

    const fetchChannels = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Query channels from Stream
        const response = await client.queryChannels(
          filters,
          sort,
          {
            watch: true, // watch channels for new messages
            state: true, // retrieve channel state
            presence: true, // include presence info (online/offline)
            message_limit: 30, // limit to last 30 messages
          }
        );
        
        console.log('Fetched channels:', response);
        setChannels(response);
      } catch (err) {
        console.error('Error fetching channels:', err);
        setError('Failed to load conversations');
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();

    // Set up event listeners for new messages and channel updates
    const handleMessageNew = (event) => {
      console.log('New message event:', event);
      // Refresh channels to update the list with new messages
      client.queryChannels(filters, sort, {
        watch: true,
        state: true,
      }).then(updatedChannels => {
        console.log('Updated channels after new message:', updatedChannels);
        setChannels(updatedChannels);
      });
    };

    // Listen for new messages
    client.on('message.new', handleMessageNew);

    // Clean up event listeners
    return () => {
      client.off('message.new', handleMessageNew);
    };
  }, [client, filters, sort]);

  // Navigate to a specific channel
  const handleChannelClick = (channel) => {
    navigate(`/chat/${channel.id}`);
  };

  // Render a channel preview
  const renderChannelPreview = (channel) => {
    // Find the other user in the channel
    const otherMember = Object.values(channel.state.members).find(
      member => member.user.id !== client.user.id   // <-- use the correct property
    );
  
    // Bail early if something’s still not right
    if (!otherMember) return null;
  
    const user = otherMember.user;
  
    // Get the last message
    const lastMessage = channel.state.messages[channel.state.messages.length - 1];
    
    // Get unread count
    const unreadCount = channel.countUnread();
  
    // Format the last message time
    const formatMessageTime = (date) => {
      if (!date) return '';
      const messageDate = new Date(date);
      const now = new Date();
      const isToday = messageDate.toDateString() === now.toDateString();
      
      if (isToday) {
        return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else {
        return messageDate.toLocaleDateString();
      }
    };
  
    return (
      <ListItem
        key={channel.id}
        button
        onClick={() => handleChannelClick(channel)}
        sx={{ 
          borderRadius: 1, 
          mb: 0.5,
          bgcolor: unreadCount > 0 ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
          '&:hover': {
            bgcolor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <ListItemAvatar>
          <Avatar 
            src={user.image}           /* <-- use .image not .avatar */
            alt={user.name || 'User'}  /* <-- use .name */
          >
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </Avatar>
        </ListItemAvatar>
        <ListItemText 
          primary={
            <Typography 
              variant="body1" 
              fontWeight={unreadCount > 0 ? 'bold' : 'normal'}
            >
              {user.name || 'Unknown User'}  
            </Typography>
          }
          secondary={
            <Typography 
              variant="body2" 
              noWrap
              sx={{ 
                color: unreadCount > 0 ? 'text.primary' : 'text.secondary',
                fontWeight: unreadCount > 0 ? 'medium' : 'normal'
              }}
            >
              {lastMessage?.text || 'No messages yet'}
            </Typography>
          }
        />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {lastMessage && (
            <Typography variant="caption" color="text.secondary">
              {formatMessageTime(lastMessage.created_at)}
            </Typography>
          )}
          {unreadCount > 0 && (
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'white', 
                borderRadius: '50%',
                minWidth: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold',
                mt: 0.5
              }}
            >
              {unreadCount}
            </Box>
          )}
        </Box>
      </ListItem>
    );
  };

  if (loading) {
    return (
      <Box className="flex justify-center p-4">
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="p-4 text-center">
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Box>
    );
  }

  if (channels.length === 0) {
    return (
      <Box className="p-4 text-center">
        <Typography variant="body2" color="textSecondary">
          No conversations yet
        </Typography>
      </Box>
    );
  }

  console.log(channels);

  return (
    <List sx={{ px: 1 }}>
      {channels?.map(channel => renderChannelPreview(channel))}
    </List>
  );
};

export default CustomChannelList;