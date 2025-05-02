// src/components/chat/GroupInfoPanel.jsx
import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import ListItemSecondaryAction from '@mui/material/ListItemSecondaryAction';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import useUserStore from '../../contexts/userStore';
import toast from 'react-hot-toast';

export default function GroupInfoPanel({ 
  open, 
  onClose, 
  groupData, 
  refetchGroup, 
  isAdmin 
}) {
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [availableFriends, setAvailableFriends] = useState([]);
  const { user, friends } = useUserStore();
  
  // Determine which friends are not already in the group
  useEffect(() => {
    if (!friends || !groupData) return;
    
    // Get all member IDs from the group
    const memberIds = groupData.members.map(member => member._id);
    
    // Filter friends who are not already members
    const nonMemberFriends = friends.filter(friend => 
      !memberIds.includes(friend._id)
    );
    
    setAvailableFriends(nonMemberFriends);
  }, [friends, groupData]);
  
  // Filter available friends based on search term
  const filteredFriends = availableFriends?.filter(friend => 
    (friend?.username || friend?.fullName || '')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  ) || [];
  
  // Handle adding a member to the group
  const handleAddMember = async (friendId) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/groups/member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          groupId: groupData._id,
          userId: friendId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add member');
      }
      
      // Close dialog and refresh group data
      setAddMemberOpen(false);
      toast.success('Member added successfully');
      
      if (refetchGroup) {
        refetchGroup();
      }
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error(error.message || 'Failed to add member');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle removing a member from the group
  const handleRemoveMember = async (memberId) => {
    try {
      // Don't allow removing self if admin
      if (memberId === groupData.admin._id) {
        toast.error("Group admin cannot be removed");
        return;
      }
      
      setLoading(true);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/groups/member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          groupId: groupData._id,
          userId: memberId
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to remove member');
      }
      
      toast.success('Member removed successfully');
      
      if (refetchGroup) {
        refetchGroup();
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error(error.message || 'Failed to remove member');
    } finally {
      setLoading(false);
    }
  };
  
  if (!groupData) {
    return null;
  }
  
  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        sx={{
          '& .MuiDrawer-paper': { 
            width: { xs: '100%', sm: 320 },
            p: 2
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Group Info</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Avatar
            src={groupData.avatar}
            sx={{
              width: 80,
              height: 80,
              mx: 'auto',
              mb: 1,
              bgcolor: 'primary.main'
            }}
          >
            {groupData.name.charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="h6">{groupData.name}</Typography>
          {groupData.description && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {groupData.description}
            </Typography>
          )}
        </Box>
        
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            Members ({groupData.members.length})
          </Typography>
          
          {isAdmin && (
            <Button
              startIcon={<PersonAddIcon />}
              size="small"
              onClick={() => setAddMemberOpen(true)}
            >
              Add
            </Button>
          )}
        </Box>
        
        <List>
          {groupData.members.map((member) => {
            const isCurrentUserAdmin = user._id === groupData.admin._id;
            const isMemberAdmin = member._id === groupData.admin._id;
            const isCurrentUser = member._id === user._id;
            
            // Determine if this member can be removed
            const canRemove = isCurrentUserAdmin && !isMemberAdmin;
            
            return (
              <ListItem key={member._id}>
                <ListItemAvatar>
                  <Avatar src={member.avatar}>
                    {(member.username || 'U').charAt(0).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.username || 'Unknown User'}
                  secondary={isMemberAdmin ? 'Admin' : null}
                  primaryTypographyProps={{
                    fontWeight: isMemberAdmin ? 'bold' : 'normal',
                  }}
                />
                {canRemove && (
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="remove" 
                      size="small"
                      onClick={() => handleRemoveMember(member._id)}
                      disabled={loading}
                    >
                      <PersonRemoveIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                )}
              </ListItem>
            );
          })}
        </List>
      </Drawer>
      
      {/* Add Member Dialog */}
      <Dialog
        open={addMemberOpen}
        onClose={() => setAddMemberOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Members</DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Search Friends"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            margin="normal"
            size="small"
          />
          
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
          
          <List sx={{ mt: 2 }}>
            {filteredFriends.length > 0 ? (
              filteredFriends.map((friend) => (
                <ListItem
                  key={friend._id}
                  button
                  onClick={() => handleAddMember(friend._id)}
                  disabled={loading}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={friend.avatar} 
                      alt={friend.username || friend.fullName}
                    >
                      {(friend.username || friend.fullName || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={friend.username || friend.fullName} />
                </ListItem>
              ))
            ) : (
              <ListItem>
                <ListItemText 
                  primary={
                    searchTerm 
                      ? "No matching friends found" 
                      : availableFriends.length === 0
                        ? "All your friends are already in this group"
                        : "No friends available to add"
                  } 
                  primaryTypographyProps={{ align: 'center', color: 'text.secondary' }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}