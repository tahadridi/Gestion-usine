// ProtectedRoute.js (new file)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

const ProtectedRoute = ({ children }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  
  if (isCheckingAuth) {
    return <div>Loading...</div>;
  }
  
  return authUser ? children : <Navigate to="/signin" />;
};

export default ProtectedRoute;