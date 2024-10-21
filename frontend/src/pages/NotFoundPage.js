// src/pages/NotFoundPage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import './styling/NotFoundPage.css'; // We'll create this CSS file next
import notebookMan from '../assets/images/notebook-man.png'; // Import your PNG

const NotFoundPage = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/'); // Redirects to HomePage
  };

  return (
    <div className="not-found-page">
      <div className="image-container">
        <img
          src={notebookMan}
          alt="Notebook Man"
          className="notebook-man"
        />
      </div>
      <h1 className="error-title">404</h1>
      <h2 className="error-subtitle">Page Not Found</h2>
      <p className="error-message">
        Oops! The page you're looking for doesn't exist.
      </p>
      <button className="cta-button" onClick={handleGoHome}>
        Go to Home
      </button>
    </div>
  );
};

export default NotFoundPage;
