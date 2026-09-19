// ProtectedRoute.js (new file)
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore.js';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { authUser, isCheckingAuth } = useAuthStore();
  
  if (isCheckingAuth) {
    return (
      <div className="d-flex vh-100 justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  if (!authUser) {
    return <Navigate to="/signin" />;
  }

  if (allowedRoles && !allowedRoles.includes(authUser.role)) {
    // Redirect to their default home if they try to access an unauthorized route
    const homePaths = {
      admin: '/Home',
      manager: '/stockmanagement',
      operator: '/fabrication',
      technician: '/fabrication',
      supervisor: '/fabrication'
    };
    return <Navigate to={homePaths[authUser.role] || '/fabrication'} />;
  }
  
  return children;
};

export default ProtectedRoute;