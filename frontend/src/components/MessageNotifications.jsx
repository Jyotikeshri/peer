import { useState, useEffect } from 'react';
import { 
  Badge, 
  IconButton, 
  Menu, 
  MenuItem, 
  Typography, 
  Box, 
  Avatar, 
  Divider, 
  Button
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MessageIcon from '@mui/icons-material/Message';
import useMessageStore from '../contexts/messageStore';
import { formatDistanceToNow } from 'date-fns';

const MessageNotifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { conversations, fetchConversations, setActiveConversation } = useMessageStore();
  const navigate = useNavigate();
  
  // Calculate total unread count
  const totalUnreadCount = conversations.reduce((total, conv) => 
    total + (conv.unreadCount || 0), 0);
  
  // Get conversations with unread messages
  const unreadConversations = conversations.filter(conv => conv.unreadCount > 0);
  
  // Fetch conversations on component mount
  useEffect(() => {
    if (conversations.length === 0) {
      fetchConversations();
    }
  }, [fetchConversations, conversations.length]);
  
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };
  
  const handleNavigateToConversation = (conversationId) => {
    setActiveConversation(conversationId);
    navigate('/messages');
    handleCloseMenu();
  };
  
  const handleNavigateToAllMessages = () => {
    navigate('/messages');
    handleCloseMenu();
  };
  
  const getConversationName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.groupName;
    }
    
    // Find the other user in the conversation
    const otherUser = conversation.participants.find(p => 
      p._id !== localStorage.getItem('userId')
    );
    
    return otherUser?.name || 'Unknown User';
  };
  
  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    if (conversation.lastMessage.isDeleted) {
      return 'This message was deleted';
    }
    
    // Truncate message if it's too long
    const messageText = conversation.lastMessage.text;
    return messageText.length > 30 
      ? `${messageText.substring(0, 30)}...` 
      : messageText;
  };
  
  const getLastMessageTime = (conversation) => {
    if (!conversation.lastMessage?.createdAt) {
      return '';
    }
    
    return formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { 
      addSuffix: true 
    });
  };

  return (
    <>
      <IconButton 
        color="inherit" 
        onClick={handleOpenMenu}
        sx={{ mr: 2 }}
      >
        <Badge badgeContent={totalUnreadCount} color="error">
          <MessageIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
        PaperProps={{
          sx: { 
            width: 320,
            maxHeight: 400
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Messages</Typography>
        </Box>
        
        <Divider />
        
        {unreadConversations.length > 0 ? (
          <>
            {unreadConversations.map((conversation) => (
              <MenuItem 
                key={conversation._id} 
                onClick={() => handleNavigateToConversation(conversation._id)}
                sx={{ py: 1.5, px: 2 }}
              >
                <Box sx={{ display: 'flex', width: '100%' }}>
                  <Avatar 
                    src={
                      !conversation.isGroup 
                        ? conversation.participants.find(p => 
                            p._id !== localStorage.getItem('userId')
                          )?.avatar 
                        : null
                    }
                    sx={{ mr: 2 }}
                  >
                    {getConversationName(conversation).charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2" noWrap>
                        {getConversationName(conversation)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getLastMessageTime(conversation)}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {getLastMessagePreview(conversation)}
                    </Typography>
                    <Badge 
                      badgeContent={conversation.unreadCount} 
                      color="primary"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No unread messages
            </Typography>
          </Box>
        )}
        
        <Divider />
        
        <Box sx={{ p: 1.5, textAlign: 'center' }}>
          <Button 
            fullWidth 
            onClick={handleNavigateToAllMessages}
            variant="outlined"
          >
            See All Messages
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default MessageNotifications;