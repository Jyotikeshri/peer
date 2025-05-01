// src/App.jsx
import { useEffect, useState } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { CircularProgress, Box } from '@mui/material';
import theme from './theme';
import useAuthStore from './contexts/authStore';

// Import layouts and components
import MainLayout from './components/layout/MainLayout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ErrorBoundary from './components/errors/ErrorBoundary';
import Dashboard from './pages/Dashboard/Dashboard';
import Profile from './pages/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import PeerMatchingPage from './pages/PeerMatching/PeerMatchingPage';

// import { SocketProvider } from './contexts/SocketContext';
// import MessagesPage from './pages/Messages/MessagesPage';

function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const { checkAuth, isAuthenticated } = useAuthStore();
  
  useEffect(() => {
    // Check authentication on app load
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
  
  // Show loading indicator while initializing auth
  if (isInitializing) {
    return (
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  // Define routes after auth is initialized
  const router = createBrowserRouter([
    {
      path: '/',
      element: <MainLayout />,
      errorElement: <ErrorBoundary />,
      children: [
        {
          index: true,
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <HomePage />
        },
        {
          path: 'login',
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />
        },
        {
          path: 'signup',
          element: isAuthenticated ? <Navigate to="/dashboard" /> : <SignupPage />
        },
      ],
    },
    
    // Protected routes wrapped with SocketProvider for real-time messaging
    {
      element: isAuthenticated ? 
       
          <ProtectedRoute />
       
        : 
        <Navigate to="/login" />,
      children: [
        {
          path: 'dashboard',
          element: <Dashboard />
        },
        {
          path: 'profile',
          element: <Profile />
        },
        {
          path: 'matching',
          element: <PeerMatchingPage />
        },
       
      ]
    },
    
    // Catch-all route
    {
      path: '*',
      element: <ErrorBoundary />,
    }
  ]);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen font-sans">
        <RouterProvider router={router} />
      </div>
    </ThemeProvider>
  );
}

export default App;