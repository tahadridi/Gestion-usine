// useAuthStore.js (updated)
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = process.env.NODE_ENV === "development" ? "http://localhost:5100" : "/";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      authUser: null,
      isSigningUp: false,
      isLoggingIn: false,
      isUpdatingProfile: false,
      isCheckingAuth: true,
      onlineUsers: [],
      socket: null,

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            set({ isCheckingAuth: false });
            return;
          }
          
          const res = await axiosInstance.get("/auth/check");
          set({ authUser: res.data });
          get().connectSocket();
        } catch (error) {
          console.log("Error in checkAuth:", error);
          localStorage.removeItem('authToken');
          set({ authUser: null });
        } finally {
          set({ isCheckingAuth: false });
        }
      },

      signup: async (userData) => {
        set({ isSigningUp: true });
        try {
          const response = await axiosInstance.post("/auth/signup", userData);
          if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
          }
          set({ authUser: response.data, isSigningUp: false });
          return { success: true, data: response.data };
        } catch (error) {
          set({ isSigningUp: false });
          const message =
            error.response?.data?.message || "Signup failed. Please try again.";
          return { success: false, message };
        }
      },

      login: async (credentials) => {
        set({ isLoggingIn: true });
        try {
          console.log('Sending login request with:', credentials);
          const response = await axiosInstance.post("/auth/login", credentials);
          if (response.data.token) {
            localStorage.setItem('authToken', response.data.token);
          }
          set({ authUser: response.data, isLoggingIn: false });
          get().connectSocket();
          return { success: true, user: response.data };
        } catch (error) {
          console.log('Login error:', error.response?.data); 
          set({ isLoggingIn: false });
          const message =
            error.response?.data?.message || "Login failed. Please try again.";
          return { success: false, message };
        }
      },

  logout: async () => {
  try {
    // Get user email before clearing auth state
    const userEmail = get().authUser?.email || "Unknown";
    
    // Pass the email in the request body
    await axiosInstance.post("/auth/logout", { userEmail });
    
    localStorage.removeItem('authToken');
    set({ authUser: null, onlineUsers: [] });
    get().disconnectSocket();
  } catch (error) {
    // Even if the API call fails, clear local storage
    localStorage.removeItem('authToken');
    set({ authUser: null, onlineUsers: [] });
  }
},

      updateProfile: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-profile", data, {
            successMessage: 'Profile updated successfully!'
          });
          set({ authUser: res.data });
        } catch (error) {
          
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      updateCredentials: async (data) => {
        set({ isUpdatingProfile: true });
        try {
          const res = await axiosInstance.put("/auth/update-credentials", data, {
            successMessage: 'Credentials updated successfully!'
          });
          set({ authUser: res.data });
        } catch (error) {
          // Error is shown in browser alert via interceptor
        } finally {
          set({ isUpdatingProfile: false });
        }
      },

      connectSocket: () => {
        const { authUser } = get();
        if (!authUser || get().socket?.connected) return;

        const socket = io(BASE_URL, {
          query: {
            userId: authUser._id,
          },
        });
        socket.connect();

        set({ socket: socket });

        socket.on("getOnlineUsers", (users) => {
          set({ onlineUsers: users });
        });
      },
      
      disconnectSocket: () => {
        if (get().socket?.connected) get().socket.disconnect();
        set({ socket: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ authUser: state.authUser }),
    }
  )
);