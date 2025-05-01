import { useEffect, useState } from 'react';
import {
  Avatar,
  Button,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import useUserStore from '../../../../contexts/userStore'; // Import your store

export default function PeerItem({ peer, onSnackbar }) {
  // Get user and connection functions from the store - just like PeerCard
  const { user, addFriend, removeFriend, fetchUser } = useUserStore();
  
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Use the same isConnected logic as in PeerCard
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    if (user && user.friends && peer) {
      // Determine the peer ID consistently
      const peerId = peer.id || peer._id;
      
      if (peerId) {
        const connected = user.friends.some(
          friendId => {
            if (typeof friendId === 'string') {
              return friendId === peerId;
            } else if (friendId && typeof friendId === 'object') {
              return friendId._id === peerId || friendId.id === peerId;
            }
            return false;
          }
        );
        
        setIsConnected(connected);
      }
    }
  }, [user, peer]);
  
  const handleConnect = async (e) => {
    e.stopPropagation();
    const peerId = peer.id || peer._id;
    
    if (connecting || !peerId || !user?._id) return;
    
    setConnecting(true);
    try {
      // Use the direct API call just like in PeerCard
      const response = await fetch('http://localhost:8000/api/users/add-friend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          friendId: peerId
        })
      });
      
      if (response.ok) {
        // After successful connection, update the global user state
        await fetchUser(); // This will refresh the user data including friends list
        setIsConnected(true);
        onSnackbar(`Connected with ${peer.username}!`, 'success');
      } else {
        throw new Error('Failed to connect');
      }
    } catch (error) {
      console.error('Connection error:', error);
      onSnackbar('Failed to connect', 'error');
    } finally {
      setConnecting(false);
    }
  };
  
  const handleDisconnect = async (e) => {
    e.stopPropagation();
    const peerId = peer.id || peer._id;
    
    if (disconnecting || !peerId || !user?._id) return;
    
    setDisconnecting(true);
    try {
      const response = await fetch('http://localhost:8000/api/users/remove-friend', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user._id,
          friendId: peerId
        })
      });
      
      if (response.ok) {
        // After successful disconnection, update the global user state
        await fetchUser(); // This will refresh the user data including friends list
        setIsConnected(false);
        onSnackbar(`Disconnected from ${peer.username}`, 'info');
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      onSnackbar('Failed to disconnect', 'error');
    } finally {
      setDisconnecting(false);
    }
  };
  
  const handleToggle = (e) => {
    return isConnected ? handleDisconnect(e) : handleConnect(e);
  };
  
  return (
    <>
      <ListItem onClick={() => {/* open modal, etc */}}>
        <ListItemAvatar>
          <Avatar src={peer.avatar}>
            {!peer.avatar && peer.username?.charAt(0)}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={peer.username}
          secondary={peer.field}
        />
        <Button
          variant={isConnected ? 'outlined' : 'contained'}
          size="small"
          disabled={connecting || disconnecting}
          onClick={handleToggle}
        >
          {isConnected ? 'Connected' : 'Connect'}
          {(connecting || disconnecting) && '...'}
        </Button>
      </ListItem>
      <Divider component="li" />
    </>
  );
}