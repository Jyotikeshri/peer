// src/pages/ChatRoom.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { StreamChat } from "stream-chat";
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window
} from "stream-chat-react";
import toast from "react-hot-toast";
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import 'stream-chat-react/dist/css/v2/index.css';
import useUserStore from "../contexts/userStore";

// API function to get stream token
const getStreamToken = async () => {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/token`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get stream token: ${response.status}`);
  }
  
  return response.json();
};

// Chat loader component
const ChatLoader = () => (
  <Box className="flex flex-col items-center justify-center h-screen">
    <CircularProgress size={40} />
    <Typography variant="body1" className="mt-4">
      Connecting to chat...
    </Typography>
  </Box>
);

export default function ChatRoom() {
  const { channelId } = useParams();
  const navigate = useNavigate();
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [error, setError] = useState(null);
  
  // Get user from localStorage
  const getUserFromStorage = () => {
    try {
      const {user} = useUserStore();
      
      // const parsedData = JSON.parse(user);
      return user;
    } catch (err) {
      console.error('Error reading user data:', err);
      return null;
    }
  };
  
  const user = getUserFromStorage();
  
  // Fetch stream token using React Query
  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ['streamToken'],
    queryFn: getStreamToken,
    enabled: !!user, // Only run when we have a user
    retry: 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Initialize chat when we have the token and user
  useEffect(() => {
    if (!tokenData?.token || !user || !channelId) return;
    
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
        
        // Connect the user
        await client.connectUser(
          {
            id: String(user._id),
            name: user.username,
            image: user.avatar || undefined
          },
          tokenData.token
        );
        
        console.log("Connected to Stream chat");
        
        // Initialize the channel
        const currentChannel = client.channel('messaging', channelId);
        
        // Watch the channel to receive messages
        await currentChannel.watch();
        console.log("Watching channel:", channelId);
        
        // Set the client and channel in state
        setChatClient(client);
        setChannel(currentChannel);
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
  }, [tokenData, user, channelId]);
  
  // Handle authentication errors
  if (!user) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen p-4">
        <Typography variant="h6" className="mb-4 text-red-600">
          Authentication Required
        </Typography>
        <Typography variant="body1" className="mb-4 text-center">
          You need to be logged in to access the chat.
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
  if (tokenLoading || !chatClient || !channel) {
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
  
  // Finally, render the chat interface
  return (
    <Box className="h-screen">
      <Chat client={chatClient} theme="str-chat__theme-light">
        <Channel channel={channel}>
          <Window>
            <ChannelHeader />
            <MessageList />
            <MessageInput focus />
          </Window>
          <Thread />
        </Channel>
      </Chat>
    </Box>
  );
}