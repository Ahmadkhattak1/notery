// frontend/src/components/PrivateRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthProvider';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();

  // If user is undefined, we are still determining the authentication state
  if (user === undefined) {
    return <div>Loading...</div>;  // You can replace this with a loading spinner if you prefer
  }

  // If user is null, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Otherwise, allow access to the route
  return children;
};

export default PrivateRoute;
