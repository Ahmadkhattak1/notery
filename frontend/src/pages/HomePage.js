// frontend/src/pages/HomePage.js
import React from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.email}!</h1>
          <p>You are logged in.</p>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div>
          <h1>Welcome to Notery</h1>
          <p>Please <a href="/login">login</a> or <a href="/signup">signup</a> to access your notes.</p>
        </div>
      )}
    </div>
  );
};

export default HomePage
