// src/contexts/userStore.js (updated)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // Basic user data methods
      setUser: (userData) => set({ user: userData, error: null }),
      clearUser: () => set({ user: null, error: null }),
      updateUser: (updateData) => set((state) => ({ user: { ...state.user, ...updateData }, error: null })),
      
      // Profile methods
      updateAvatar: (avatarUrl) => set((state) => ({ 
        user: state.user ? { ...state.user, avatar: avatarUrl } : null 
      })),

      fetchUser: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/profile`,
            { credentials: 'include' }
          );
          if (!response.ok) throw new Error('Failed to fetch user data');
          const userData = await response.json();
          set({ user: userData, isLoading: false });
          return userData;
        } catch (err) {
          console.error('Error fetching user data:', err);
          set({ error: err.message, isLoading: false });
          return null;
        }
      },

      updateProfile: async (profileData) => {
        try {
          set({ isLoading: true, error: null });
          const isFormData = profileData instanceof FormData;
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/profile`,
            {
              method: 'PUT',
              headers: isFormData ? undefined : { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: isFormData ? profileData : JSON.stringify(profileData),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to update profile');
          }
          const updatedUser = await response.json();
          set({ user: updatedUser, isLoading: false });
          return updatedUser;
        } catch (err) {
          console.error('Error updating profile:', err);
          set({ error: err.message, isLoading: false });
          return null;
        }
      },

      // Friend request methods
      sendFriendRequest: async (targetUserId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/friend-request`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ targetUserId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to send friend request');
          }
          
          // Update the local state to reflect the pending request
          set((state) => ({
            user: {
              ...state.user,
              sentFriendRequests: [...(state.user.sentFriendRequests || []), targetUserId]
            },
            isLoading: false,
          }));
          
          return true;
        } catch (err) {
          console.error('Error sending friend request:', err);
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      acceptFriendRequest: async (requesterId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/friend-request/accept`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ requesterId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to accept friend request');
          }
          
          // Update local state: remove from requests, add to friends
          set((state) => {
            // Get current lists, ensuring they're arrays
            const friendRequests = Array.isArray(state.user.friendRequests) 
              ? state.user.friendRequests 
              : [];
            const friends = Array.isArray(state.user.friends) 
              ? state.user.friends 
              : [];
            
            return {
              user: {
                ...state.user,
                friends: [...friends, requesterId],
                friendRequests: friendRequests.filter(id => id !== requesterId),
              },
              isLoading: false,
            };
          });
          
          return true;
        } catch (err) {
          console.error('Error accepting friend request:', err);
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      rejectFriendRequest: async (requesterId) => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/friend-request/reject`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ requesterId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to reject friend request');
          }
          
          // Update local state: remove from requests
          set((state) => ({
            user: {
              ...state.user,
              friendRequests: (state.user.friendRequests || []).filter(id => id !== requesterId),
            },
            isLoading: false,
          }));
          
          return true;
        } catch (err) {
          console.error('Error rejecting friend request:', err);
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      addFriend: async (friendId) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = get();
          if (!user) throw new Error('Authentication required');
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/add-friend`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ userId: user._id, friendId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to add friend');
          }
          
          set((state) => ({
            user: { 
              ...state.user, 
              friends: [...(state.user.friends || []), friendId] 
            },
            isLoading: false,
          }));
          
          return true;
        } catch (err) {
          console.error('Error adding friend:', err);
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      removeFriend: async (friendId) => {
        try {
          set({ isLoading: true, error: null });
          const { user } = get();
          if (!user) throw new Error('Authentication required');
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/remove-friend`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ userId: user._id, friendId }),
            }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to remove friend');
          }
          
          set((state) => ({
            user: {
              ...state.user,
              friends: (state.user.friends || []).filter(id => {
                // Handle both string IDs and object IDs with _id property
                if (typeof id === 'string') {
                  return id !== friendId;
                }
                return id._id !== friendId;
              }),
            },
            isLoading: false,
          }));
          
          return true;
        } catch (err) {
          console.error('Error removing friend:', err);
          set({ error: err.message, isLoading: false });
          return false;
        }
      },

      // Badge methods
      fetchBadges: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await fetch(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/users/get-badge`,
            { credentials: 'include' }
          );
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to fetch badges');
          }
          const badgesData = await response.json();
          set((state) => ({ 
            user: { ...state.user, badges: badgesData }, 
            isLoading: false 
          }));
          return badgesData;
        } catch (err) {
          console.error('Error fetching badges:', err);
          set({ error: err.message, isLoading: false });
          return null;
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

export default useUserStore;