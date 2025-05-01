import { useEffect, useRef, useState } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import theme from './theme';
import useAuthStore from './contexts/authStore';
import useUserStore from './contexts/userStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import PeerMatchingPage from './pages/PeerMatching/PeerMatchingPage';
import MessagesPage from './pages/MessagesPage';
import ChatRoom from './pages/ChatRoom';
import ErrorBoundary from './components/errors/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import TopBar from './components/layout/TopBar';
// import NotificationPage from './components/notifications/NotificationPage';
import { connectStreamUser, subscribeToStreamEvents, client } from './utils/streamService';
import { useNotificationStore } from './contexts/notificationStore';

const queryClient = new QueryClient();

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { checkAuth, isAuthenticated } = useAuthStore();
  const currentUser = useUserStore((s) => s.user);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const [streamReady, setStreamReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (err) {
        console.error('Auth initialization failed:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [checkAuth]);

  const hasConnectedRef = useRef(false);


  useEffect(() => {
    if (!currentUser || hasConnectedRef.current) return;
    hasConnectedRef.current = true;
    let unsubscribe;
    let mounted = true;

    connectStreamUser()
      .then(() => {
        if (!mounted) return;
        unsubscribe = subscribeToStreamEvents(addNotification);
        setStreamReady(true);
      })
      .catch((err) => console.error('Stream init error:', err));

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
      if (streamReady) client.disconnectUser();
    };
  }, [currentUser]);

  if (isInitializing) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
      </Box>
    );
  }

  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        { index: true, element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage /> },
        { path: 'login', element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage /> },
        { path: 'signup', element: isAuthenticated ? <Navigate to="/dashboard" replace /> : <SignupPage /> },
      ],
    },
    {
      element: isAuthenticated ? <ProtectedRoute /> : <Navigate to="/login" replace />, children: [
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'profile', element: <Profile /> },
        { path: 'matching', element: <PeerMatchingPage /> },
        { path: 'messages', element: <MessagesPage /> },
        { path: 'chat/:channelId', element: <ChatRoom /> },
        // { path: 'notifications', element: <NotificationPage /> },
      ],
    },
    { path: '*', element: <ErrorBoundary /> },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen font-sans">
          
          <RouterProvider router={router} />
        </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
