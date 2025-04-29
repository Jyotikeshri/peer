// src/contexts/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import useUserStore from './userStore';

// Define the auth store with persistence
const useAuthStore = create(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      token: null, // <-- Added token field
      isLoading: false,
      error: null,

      // Set authentication status manually
      setAuthenticated: (status) => set({ isAuthenticated: status }),

      // Login user
      login: async (email, password) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await fetch('http://localhost:8000/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookie-based auth
            body: JSON.stringify({ email, password }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Login failed');
          }

          // Store user and token
          if (data.user) {
            useUserStore.getState().setUser(data.user);
          }

          set({ 
            isAuthenticated: true,
            token: data.token, // <-- Save token here
            isLoading: false,
            error: null
          });

          return true;
        } catch (error) {
          console.error('Login error:', error);
          set({ error: error.message, isLoading: false, isAuthenticated: false });
          return false;
        }
      },

      // Register user
      register: async (userData) => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('http://localhost:8000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(userData),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // Store user and token
          if (data.user) {
            useUserStore.getState().setUser(data.user);
          }

          set({
            isAuthenticated: true,
            token: data.token, // <-- Save token here too
            isLoading: false,
            error: null
          });

          return true;
        } catch (error) {
          console.error('Registration error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Logout user
      logout: async () => {
        try {
          set({ isLoading: true });

          await fetch('http://localhost:8000/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          });

          useUserStore.getState().clearUser();

          set({
            isAuthenticated: false,
            token: null, // <-- Clear token on logout
            isLoading: false,
            error: null
          });

          return true;
        } catch (error) {
          console.error('Logout error:', error);
          set({ error: error.message, isLoading: false });
          return false;
        }
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          set({ isLoading: true });

          const response = await fetch('http://localhost:8000/api/users/profile', {
            credentials: 'include',
          });

          if (!response.ok) {
            set({ isAuthenticated: false, isLoading: false, token: null });
            useUserStore.getState().clearUser();
            return false;
          }

          const userData = await response.json();
          useUserStore.getState().setUser(userData);

          set({ isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          console.error('Authentication check error:', error);
          set({ isAuthenticated: false, isLoading: false, token: null });
          useUserStore.getState().clearUser();
          return false;
        }
      },

      // Set token manually (optional if needed)
      setToken: (token) => set({ token })
    }),
    {
      name: 'auth-storage', // unique name for localStorage
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token, // <-- Persist token too
      }),
    }
  )
);

export default useAuthStore;
