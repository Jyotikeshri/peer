// src/App.jsx
import { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import theme from './theme';
import useAuthStore from './contexts/authStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Fixed import here

const queryClient = new QueryClient();
 
// Layouts & pages
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

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { checkAuth, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    initAuth();
  }, [checkAuth]);
  
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
        {
          index: true,
          element: isAuthenticated 
             ? <Navigate to="/dashboard" replace />
             : <HomePage />
        },
        {
          path: 'login',
          element: isAuthenticated 
             ? <Navigate to="/dashboard" replace />
             : <LoginPage />
        },
        {
          path: 'signup',
          element: isAuthenticated 
             ? <Navigate to="/dashboard" replace />
             : <SignupPage />
        },
      ],
    },
    {
      // All protected routes go here
      element: isAuthenticated 
         ? <ProtectedRoute />
         : <Navigate to="/login" replace />,
      children: [
        { path: 'dashboard', element: <Dashboard /> },
        { path: 'profile',   element: <Profile /> },
        { path: 'matching',  element: <PeerMatchingPage /> },
        // **Messaging**
        { path: 'messages',          element: <MessagesPage /> },
        { path: 'chat/:channelId',   element: <ChatRoom /> },
      ],
    },
    {
      path: '*',
      element: <ErrorBoundary />,
    },
  ]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}> {/* Fixed component name here */}
      <div className="min-h-screen font-sans">
        <RouterProvider router={router} />
      </div>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;