// src/pages/MessagesPage.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import { Chat } from "stream-chat-react";
import toast from "react-hot-toast";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import 'stream-chat-react/dist/css/v2/index.css';
import useUserStore from "../contexts/userStore";
import CustomChannelList from "../components/chat/CustomChannelList";

// API calls
const getStreamToken = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/token`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get stream token: ${response.status}`);
  }
  
  return response.json();
};

const getFriends = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/friends`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get friends: ${response.status}`);
  }
  
  return response.json();
};

// Chat loader component
const ChatLoader = () => (
  <Box className="flex flex-col items-center justify-center h-screen">
    <CircularProgress size={40} />
    <Typography variant="body1" className="mt-4">
      Loading messages...
    </Typography>
  </Box>
);

// Custom empty conversations component
const NoConversations = () => (
  <Box className="flex items-center justify-center h-full">
    <Typography variant="body1" color="textSecondary">
      Select a conversation to start chatting
    </Typography>
  </Box>
);

export default function MessagesPage() {
  const navigate = useNavigate();
  const [chatClient, setChatClient] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  
  // Get user from userStore - correctly destructure the properties
  const { user, friends: storeFriends } = useUserStore();
  
  // Log user data for debugging
  useEffect(() => {
    console.log("User data from store:", user);
  }, [user]);
  
  // Fetch stream token using React Query
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!user?._id, // Only run when we have a user with an ID
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Use friends from store if available, otherwise fetch them
  const { data: friendsData, isLoading: friendsLoading, error: friendsError } = useQuery({
    queryKey: ['friends'],
    queryFn: getFriends,
    enabled: !!user?._id && !storeFriends?.length, // Only fetch if no friends in store
    retry: 1,
  });
  
  // Use friends from store if available, otherwise use fetched data
  const friends = storeFriends?.length ? storeFriends : friendsData;
  
  // Initialize chat when we have the token and user
  useEffect(() => {
    if (!tokenData?.token || !user?._id) {
      console.log("Missing token or user ID, not initializing chat");
      return;
    }
    
    const initChat = async () => {
      try {
        console.log("Initializing stream chat...");
        
        // Get Stream API key from env
        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        if (!apiKey) {
          throw new Error("Stream API key is missing");
        }
        
        // Initialize the client
        const client = StreamChat.getInstance(apiKey);
        
        console.log("Connecting user:", {
          id: user._id,
          name: user.username,
          image: user.avatar
        });
        
        // Connect the user with detailed logging
        try {
          await client.connectUser(
            {
              id: String(user._id),
              name: user.username || user.fullName, 
              image: user.avatar || user.profilePic
            },
            tokenData.token
          );
          console.log("Connected to Stream chat successfully");
        } catch (connErr) {
          console.error("Error connecting user to Stream:", connErr);
          throw connErr;
        }
        
        // Set the client in state
        setChatClient(client);
        setError(null);
      } catch (err) {
        console.error("Error initializing chat:", err);
        setError(err.message || "Failed to connect to chat service");
        toast.error("Could not connect to chat. Please try again.");
      }
    };
    
    initChat();
    
    // Clean up on unmount
    return () => {
      if (chatClient) {
        console.log("Disconnecting chat client");
        chatClient.disconnectUser().catch(err => {
          console.error("Error disconnecting:", err);
        });
      }
    };
  }, [tokenData, user]);
  
  // Create channels for friends
  useEffect(() => {
    if (!chatClient || !friends?.length || !user?._id) {
      console.log("Missing chat client, friends, or user ID, not creating channels");
      return;
    }
    
    const initializeChannels = async () => {
      try {
        console.log("Initializing channels for friends...");
        
        const promises = friends.map(async (friend) => {
          // Create a deterministic channel ID by sorting user IDs
          const channelId = [user._id, friend._id].sort().join('__');
          
          try {
            // Log friend data to debug name issues
            console.log("Creating channel for friend:", {
              friendId: friend._id,
              friendName: friend.username || friend.fullName || "Unknown",
              channelId
            });
            
            // Initialize the channel with explicit name and image
            const channel = chatClient.channel('messaging', channelId, {
              members: [String(user._id), String(friend._id)],
              // Set explicit name for the friend
              name: friend.username || friend.fullName || "Chat",
              // Add additional data for better identification
              friendInfo: {
                id: friend._id,
                name: friend.username || friend.fullName,
                image: friend.avatar || friend.profilePic
              }
            });
            
            // Watch the channel and force update
            await channel.watch();
            console.log(`Channel initialized: ${channelId}`);
          } catch (err) {
            // Ignore errors for channels that already exist
            if (err.code !== 4) {
              console.error(`Error creating channel ${channelId}:`, err);
            }
          }
        });
        
        await Promise.all(promises);
        console.log("All channels initialized");
      } catch (err) {
        console.error("Error initializing channels:", err);
      }
    };
    
    initializeChannels();
  }, [chatClient, friends, user]);
  
  // Handle authentication errors
  if (!user?._id) {
    console.log("No user ID found");
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Typography variant="h6" className="mb-4 text-red-600">
          Authentication Required
        </Typography>
        <Typography variant="body1" className="mb-4 text-center">
          You need to be logged in to access your messages.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/login')}
        >
          Log In
        </Button>
      </Box>
    );
  }
  
  // Handle token fetch errors
  if (tokenError) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Typography variant="h6" className="mb-4 text-red-600">
          Connection Error
        </Typography>
        <Typography variant="body1" className="mb-4 text-center">
          Failed to connect to chat service: {tokenError.message}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </Box>
    );
  }
  
  // Show loading state
  if (tokenLoading || !chatClient) {
    return <ChatLoader />;
  }
  
  // Show connection errors
  if (error) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Typography variant="h6" className="mb-4 text-red-600">
          Chat Error
        </Typography>
        <Typography variant="body1" className="mb-4 text-center">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => window.location.reload()}
        >
          Reconnect
        </Button>
      </Box>
    );
  }
  
  // Filter friends based on search
  const filteredFriends = friends?.filter(friend => 
    (friend?.username || friend?.fullName || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  ) || [];
  
  // Set up filters for channel list
  const filters = {
    type: 'messaging',
    members: { $in: [String(user._id)] }
  };
  
  const sort = { last_message_at: -1 };
  
  // Create a channel with a friend
  const handleChatWithFriend = (friend) => {
    const channelId = [user._id, friend._id].sort().join('__');
    navigate(`/chat/${channelId}`);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  
  // Render the messages page with sidebar
  return (
    <Box className="h-screen flex">
      <Paper
        elevation={0}
        sx={{ 
          width: 300, 
          borderRight: '1px solid #e0e0e0', 
          display: 'flex', 
          flexDirection: 'column',
          height: '100%',
          zIndex: 1
        }}
      >
        <Box className="p-4">
          <Typography variant="h6" className="mb-4">
            Messages
          </Typography>
          
          <TextField
            fullWidth
            label="Search friends"
            variant="outlined"
            size="small"
            value={search}
            onChange={handleSearchChange}
            className="mb-4"
          />
        </Box>
        
        {/* Friends list */}
        <Box className="px-4">
          <Typography variant="subtitle2" className="mb-2">
            Friends {friendsLoading && <CircularProgress size={16} className="ml-2" />}
          </Typography>
          
          {friendsError && (
            <Typography variant="body2" color="error" className="my-2">
              Error loading friends: {friendsError.message}
            </Typography>
          )}
          
          {filteredFriends?.length > 0 ? (
            <List>
              {filteredFriends.map((friend) => (
                <ListItem
                  key={friend._id}
                  button
                  onClick={() => handleChatWithFriend(friend)}
                  sx={{ borderRadius: 1, mb: 0.5 }}
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={friend.avatar || friend.profilePic} 
                      alt={friend.username || friend.fullName || 'User'}
                    >
                      {(friend.username || friend.fullName || 'U').charAt(0).toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={friend.username || friend.fullName || 'Unknown User'} 
                  />
                </ListItem>
              ))}
            </List>
          ) : search ? (
            <Typography variant="body2" color="textSecondary" className="text-center my-4">
              No friends match your search
            </Typography>
          ) : (
            <Typography variant="body2" color="textSecondary" className="text-center my-4">
              {!friendsLoading && 'You haven\'t added any friends yet'}
            </Typography>
          )}
        </Box>
        
        {/* Recent conversations */}
        <Box className="px-4 mt-4">
          <Typography variant="subtitle2" className="mb-2">
            Recent Conversations
          </Typography>
        </Box>
        
        {/* Using Custom Channel List instead of the built-in one */}
        <Box className="flex-1 overflow-y-auto">
          <Chat client={chatClient} theme="str-chat__theme-light">
            <CustomChannelList 
              client={chatClient} 
              filters={filters} 
              sort={sort} 
            />
          </Chat>
        </Box>
        
        {/* New group button */}
        <Box className="p-4">
          <Button 
            variant="contained" 
            fullWidth 
            className="mt-2"
          >
            New Group
          </Button>
        </Box>
      </Paper>
      
      <Box className="flex-1 bg-gray-50">
        <NoConversations />
      </Box>
    </Box>
  );
}