import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { StreamChat } from "stream-chat";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import useUserStore from "../contexts/userStore";
import { getStreamToken } from "../lib/api";
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Singleton pattern to prevent duplicate clients
let videoClientInstance = null;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const navigate = useNavigate();
  const acceptMessageSentRef = useRef(false);
  const initCallExecutedRef = useRef(false);

  const { user, isLoading: userLoading } = useUserStore();

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // Cache token for 5 minutes
  });

  // Send call acceptance notification when joining
  useEffect(() => {
    if (call && user && callId && !acceptMessageSentRef.current) {
      // Create a chat client to send acceptance notification
      const sendCallAcceptance = async () => {
        try {
          if (!tokenData?.token) return;

          const chatClient = StreamChat.getInstance(STREAM_API_KEY);
          
          // Check if already connected
          if (!chatClient.userID) {
            await chatClient.connectUser(
              {
                id: String(user._id),
                name: user.username,
                image: user.avatar || undefined
              },
              tokenData.token
            );
          }
          
          const channel = chatClient.channel('messaging', callId);
          await channel.watch();
          
          // Send acceptance notification
          const acceptData = {
            userId: user._id,
            callId: callId,
            timestamp: new Date().toISOString()
          };
          
          await channel.sendMessage({
            text: `CALL_ACCEPTED:${JSON.stringify(acceptData)}`,
          });
          
          acceptMessageSentRef.current = true;
          console.log('Sent call acceptance notification');
        } catch (err) {
          console.error('Error sending call acceptance notification:', err);
        }
      };
      
      sendCallAcceptance();
    }
  }, [call, user, callId, tokenData]);

  // Handle cleanup when component unmounts
  useEffect(() => {
    const handleBeforeUnload = () => {
      sendUserLeftMessage();
    };

    // Add event listener for page unload
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      
      // Don't send USER_LEFT_CALL when navigating to the call page from the notification
      if (call) {
        sendUserLeftMessage();
      }
      
      if (videoClientInstance) {
        console.log("Disconnecting video client on unmount");
        videoClientInstance.disconnectUser()
          .catch(err => console.error("Error disconnecting video client:", err));
        videoClientInstance = null;
      }
    };
  }, [videoClientInstance, user, callId, tokenData, call]);

  // Function to send user left message
  const sendUserLeftMessage = () => {
    if (call && user && callId && tokenData?.token) {
      try {
        const chatClient = StreamChat.getInstance(STREAM_API_KEY);
        if (chatClient.userID) {
          const channel = chatClient.channel('messaging', callId);
          channel.sendMessage({
            text: `USER_LEFT_CALL:${JSON.stringify({
              userId: user._id,
              callId: callId,
              timestamp: new Date().toISOString()
            })}`,
          }).catch(err => console.error('Error sending call left message:', err));
        }
      } catch (err) {
        console.error('Error notifying about leaving call:', err);
      }
    }
  };

  // Handle call status updates
  useEffect(() => {
    if (!call) return;
    
    const handleCallStateChange = (event) => {
      console.log('Call state changed:', event.state);
      setCallStatus(event.state);
      
      if (event.state === 'joined') {
        // Play connect sound
        try {
          const connectSound = new Audio('/sounds/call-connect.mp3');
          connectSound.play().catch(err => console.error('Error playing connect sound:', err));
        } catch (err) {
          console.error('Error playing connect sound:', err);
        }
      }
    };
    
    // Subscribe to call state updates
    call.on('call_state_updated', handleCallStateChange);
    
    return () => {
      call.off('call_state_updated', handleCallStateChange);
    };
  }, [call]);

  // Initialize call
  useEffect(() => {
    const initCall = async () => {
      if (!tokenData?.token || !user || !callId) {
        console.log("Missing required data for call:", { 
          hasToken: !!tokenData?.token, 
          hasUser: !!user, 
          callId 
        });
        return;
      }

      if (initCallExecutedRef.current) return;
      initCallExecutedRef.current = true;

      try {
        setIsConnecting(true);
        console.log("Initializing Stream video client...");

        // Always clean up any existing client first
        if (videoClientInstance) {
          console.log("Disconnecting existing video client");
          await videoClientInstance.disconnectUser();
          videoClientInstance = null;
        }

        const userData = {
          id: user._id,
          name: user.username,
          image: user.avatar || undefined,
        };

        // Create a new client with the correct token
        const videoClient = new StreamVideoClient({
          apiKey: STREAM_API_KEY,
          user: userData,
          token: tokenData.token,
        });

        videoClientInstance = videoClient;

        // Get call instance
        const callInstance = videoClient.call("default", callId);

        // Get or create the call
        console.log("Getting or creating call");
        await callInstance.getOrCreate();
        
        // Join the call with explicit camera and microphone settings
        console.log("Joining call");
        await callInstance.join({
          create: false,
          microphone: 'enabled',
          camera: 'enabled',
          speaker: 'enabled'
        });
        
        console.log("Successfully joined call");

        // Set state with the client and call objects
        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call. Please try again.");
        
        // Increment connection attempts
        setConnectionAttempts(prev => prev + 1);
        
        // Reset the init flag if we've tried fewer than 3 times
        if (connectionAttempts < 2) {
          initCallExecutedRef.current = false;
        }
        
        // Cleanup on error
        if (videoClientInstance) {
          videoClientInstance.disconnectUser().catch(console.error);
          videoClientInstance = null;
        }
      } finally {
        setIsConnecting(false);
      }
    };

    if (tokenData && user && !client && !initCallExecutedRef.current) {
      // Small delay to ensure proper initialization
      setTimeout(() => {
        initCall();
      }, 500);
    }
  }, [tokenData, user, callId, client, connectionAttempts]);

  if (userLoading || tokenLoading || isConnecting) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen">
        <CircularProgress size={40} />
        <Typography variant="body1" className="mt-4">
          Connecting to call...
        </Typography>
      </Box>
    );
  }

  if (!client || !call) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen">
        <Typography variant="h6" className="mb-4 text-red-600">
          Call Connection Error
        </Typography>
        <Typography variant="body1" className="mb-4 text-center">
          Could not initialize the call. Please check your connection and try again.
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            initCallExecutedRef.current = false;
            setConnectionAttempts(prev => prev + 1);
          }}
        >
          Retry
        </Button>
        <Button 
          variant="outlined" 
          color="error"
          sx={{ mt: 2 }}
          onClick={() => navigate("/messages")}
        >
          Return to Messages
        </Button>
      </Box>
    );
  }

  return (
    <div className="h-screen">
      <StreamVideo client={client}>
        <StreamCall call={call}>
          <CallContent navigate={navigate} callStatus={callStatus} />
        </StreamCall>
      </StreamVideo>
    </div>
  );
};

const CallContent = ({ navigate, callStatus }) => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const userLeftRef = useRef(false);

  useEffect(() => {
    if (callingState === CallingState.LEFT && !userLeftRef.current) {
      userLeftRef.current = true;
      navigate("/messages");
    }
  }, [callingState, navigate]);
  
  // Show connecting message when call is initializing
  if (callStatus === 'connecting' || callStatus === 'ringing') {
    return (
      <StreamTheme>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <CircularProgress size={60} sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              {callStatus === 'connecting' ? 'Establishing connection...' : 'Waiting for participants...'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your call will begin shortly
            </Typography>
            <Button 
              variant="outlined" 
              color="error"
              sx={{ mt: 3 }}
              onClick={() => navigate("/messages")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </StreamTheme>
    );
  }

  return (
    <StreamTheme>
      <div className="h-screen flex flex-col">
        <div className="flex-grow">
          <SpeakerLayout />
        </div>
        <div className="bg-white p-4 border-t border-gray-200">
          <CallControls />
        </div>
      </div>
    </StreamTheme>
  );
};

export default CallPage;