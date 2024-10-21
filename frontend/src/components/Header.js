// src/components/Header.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signOut } from 'firebase/auth';

// Import the PNG image for AI Notes
import AiNotesIcon from '../assets/ai-notes-icon.png';

const Header = ({
  user,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  handleImageUpload,
  handleCameraCapture,
  handleAINotesClick,
  setIsSidebarOpen,
  activeNote,
  isSaved,
}) => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out:', error.message, error.code, error);
      });
  };

  return (
    <header className={`app-header ${activeNote ? 'note-open' : ''}`}>
      <div className="header-left">
        <h1>Notery</h1>
      </div>

      {/* Header Buttons - Visible Only When a Note is Open */}
      {activeNote && (
        <div className="header-center">
          {/* Upload Image and AI Notes Buttons */}
          <div className="upload-image-container">
            <label htmlFor="imageUploadHeader" className="header-button">
              📷 Insert Photo
            </label>
            <input
              type="file"
              id="imageUploadHeader"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <input
              type="file"
              id="cameraCaptureHeader"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              style={{ display: 'none' }}
            />
          </div>
          <button
            className="header-button ai-notes-button"
            onClick={handleAINotesClick}
            title="AI Notes"
          >
            <img src={AiNotesIcon} alt="AI Notes" className="ai-notes-icon" />
            <span className="ai-notes-text">AI Notes</span>
          </button>
        </div>
      )}

      {/* Profile Section */}
      <div className="profile-section">
        <div
          className="profile-icon"
          onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
        >
          {user && user.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="profile-picture" />
          ) : (
            <div className="profile-placeholder">P</div>
          )}
        </div>
        {isProfileDropdownOpen && (
          <div className="profile-dropdown">
            <ul>
              <li
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  navigate('/profile');
                }}
              >
                Profile Settings
              </li>
              <li
                onClick={() => {
                  setIsProfileDropdownOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Sidebar Toggle Button (Hamburger Icon) */}
      <button
        className="sidebar-toggle-button"
        onClick={() => setIsSidebarOpen((prev) => !prev)}
      >
        ☰
      </button>
    </header>
  );
};

export default Header;
