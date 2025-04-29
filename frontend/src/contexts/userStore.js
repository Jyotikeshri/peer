// src/contexts/userStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the user store with persistence
const useUserStore = create(
  persist(
    (set, get) => ({
      // User state
      user: null,
      isLoading: false,
      error: null,

      // Set user data
      setUser: (userData) => set({ user: userData, error: null }),

      // Clear user data (for logout)
      clearUser: () => set({ user: null, error: null }),

      // Update specific user fields
      updateUser: (updateData) => set((state) => ({
        user: { ...state.user, ...updateData },
        error: null
      })),

      // Update avatar specifically (commonly used)
      updateAvatar: (avatarUrl) => set((state) => ({
        user: state.user ? { ...state.user, avatar: avatarUrl } : null
      })),

      // Fetch user data from API
      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });

          const response = await fetch('http://localhost:8000/api/users/profile', {
            credentials: 'include', // Important for cookie-based auth
          });

          if (!response.ok) {
            throw new Error('Failed to fetch user data');
          }

          const userData = await response.json();
          set({ user: userData, isLoading: false });
          return userData;
        } catch (error) {
          console.error('Error fetching user data:', error);
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      // Update user profile
      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true, error: null });
      
          // Check if profileData is FormData (for file uploads) or regular object
          const isFormData = profileData instanceof FormData;
          
          console.log('Updating profile with', isFormData ? 'FormData (file upload)' : 'JSON data');
          
          const response = await fetch('http://localhost:8000/api/users/profile', {
            method: 'PUT',
            // Don't set Content-Type header when using FormData
            headers: isFormData ? undefined : {
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Important for cookie-based auth
            body: isFormData ? profileData : JSON.stringify(profileData)
          });
      
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update profile');
          }
      
          const updatedUser = await response.json();
          set({ user: updatedUser, isLoading: false });
          return updatedUser;
        } catch (error) {
          console.error('Error updating profile:', error);
          set({ error: error.message, isLoading: false });
          return null;
        }
      },

      // Add a friend
      // In your userStore.js
// In your userStore.js
addFriend: async (friendId) => {
  try {
    set({ isLoading: false, error: null });
    const { user } = get();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const response = await fetch('http://localhost:8000/api/users/add-friend', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: user._id,
        friendId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to add friend');
    }

    // Instead of refetching the whole user, just update the friends array
    // This prevents a full reload
    set((state) => ({
      user: {
        ...state.user,
        friends: [...state.user.friends, friendId]
      },
      isLoading: false
    }));
    
    return true;
  } catch (error) {
    console.error('Error adding friend:', error);
    set({ error: error.message, isLoading: false });
    return false;
  }
},

removeFriend: async (friendId) => {
  try {
    set({ isLoading: true, error: null });
    const { user } = get();
    
    if (!user) {
      throw new Error('Authentication required');
    }

    const response = await fetch('http://localhost:8000/api/users/remove-friend', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        userId: user._id,
        friendId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to remove friend');
    }

    // Instead of refetching, just update the friends array directly
    set((state) => ({
      user: {
        ...state.user,
        friends: state.user.friends.filter(id => 
          id !== friendId && 
          (typeof id === 'object' ? id._id !== friendId : true)
        )
      },
      isLoading: false
    }));
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    set({ error: error.message, isLoading: false });
    return false;
  }
},

      // Get user badges
      fetchBadges: async () => {
        try {
          set({ isLoading: true, error: null });
          const { user } = get();
          
          if (!user) {
            throw new Error('Authentication required');
          }

          const response = await fetch('http://localhost:8000/api/users/get-badge', {
            credentials: 'include', // Important for cookie-based auth
          });

          if (!response.ok) {
            throw new Error('Failed to fetch badges');
          }

          const badgesData = await response.json();
          
          // Update user with new badges
          set((state) => ({
            user: { ...state.user, badges: badgesData },
            isLoading: false
          }));
          
          return badgesData;
        } catch (error) {
          console.error('Error fetching badges:', error);
          set({ error: error.message, isLoading: false });
          return null;
        }
      }
    }),
    {
      name: 'user-storage', // unique name for localStorage
      partialize: (state) => ({ user: state.user }), // only persist user data
    }
  )
);

export default useUserStore;