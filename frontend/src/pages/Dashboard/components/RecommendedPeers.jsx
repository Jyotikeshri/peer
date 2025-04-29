// src/components/RecommendedPeers/RecommendedPeers.jsx
import { useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Link
} from '@mui/material';

// Mock data for recommended peers
const mockPeers = [
  {
    id: 1,
    name: 'Alex Smith',
    avatar: null,
    initials: 'AS',
    field: 'Web Development',
    connected: false
  },
  {
    id: 2,
    name: 'Maria Johnson',
    avatar: null,
    initials: 'MJ',
    field: 'Data Science',
    connected: false
  },
  {
    id: 3,
    name: 'David Chen',
    avatar: null,
    initials: 'DC',
    field: 'React Native',
    connected: true
  }
];

const RecommendedPeers = () => {
  const [peers, setPeers] = useState(mockPeers);

  const handleConnect = (peerId) => {
    setPeers(peers.map(peer => 
      peer.id === peerId ? { ...peer, connected: !peer.connected } : peer
    ));
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Recommended Peers
        </Typography>
        
        <Link href="#" color="primary" underline="hover">
          View All
        </Link>
      </Box>
      
      <Paper elevation={0} sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <List sx={{ py: 0 }}>
          {peers.map((peer, index) => (
            <Box key={peer.id}>
              <ListItem 
                alignItems="center" 
                sx={{ 
                  px: 2, 
                  py: 2
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    sx={{ 
                      bgcolor: peer.id === 1 ? '#3B82F6' : peer.id === 2 ? '#8B5CF6' : '#EC4899',
                      width: 40,
                      height: 40
                    }}
                  >
                    {peer.initials}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {peer.name}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {peer.field}
                    </Typography>
                  }
                />
                <Button
                  variant={peer.connected ? "outlined" : "contained"}
                  color="primary"
                  size="small"
                  sx={{ 
                    minWidth: 90, 
                    borderRadius: 6,
                    textTransform: 'none',
                    fontSize: '0.75rem',
                    py: 0.5
                  }}
                  onClick={() => handleConnect(peer.id)}
                >
                  {peer.connected ? 'Connected' : 'Connect'}
                </Button>
              </ListItem>
              {index < peers.length - 1 && (
                <Divider component="li" />
              )}
            </Box>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default RecommendedPeers;