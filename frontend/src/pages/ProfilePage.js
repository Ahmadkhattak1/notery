// src/pages/ProfilePage.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import {
  getAuth,
  updateProfile,
  updatePassword,
  signOut,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import './styling/ProfilePage.css';

// Import the compressImage utility
import { compressImage } from '../utils/imageCompression';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setProfilePictureUrl(user.photoURL || '');
    }
  }, [user]);

  // Handle Update Profile
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!currentPassword) {
      setFeedbackMessage('Please enter your current password to update the profile.');
      return;
    }

    try {
      await reauthenticateUser(currentPassword);
      const auth = getAuth();

      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }

      if (profilePicture) {
        await handleUploadProfilePicture();
      }

      if (newPassword) {
        await updatePassword(auth.currentUser, newPassword);
      }

      setFeedbackMessage('Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setFeedbackMessage('Error updating profile. Please try again.');
    }
  };

  // Re-authenticate User
  const reauthenticateUser = async (password) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      throw new Error('Re-authentication failed. Please check your password.');
    }
  };

  // Handle Upload Profile Picture with Compression
  const handleUploadProfilePicture = async () => {
    if (!profilePicture) return;

    const storage = getStorage();
    const storageRef = ref(
      storage,
      `profilePictures/${user.uid}/${Date.now()}_${profilePicture.name}`
    );

    try {
      // Compress the image before uploading
      const compressedFile = await compressImage(profilePicture, 0.5, 1024); // 0.5MB max size, 1024px max dimension

      await uploadBytes(storageRef, compressedFile);
      const downloadURL = await getDownloadURL(storageRef);

      const auth = getAuth();
      await updateProfile(auth.currentUser, { photoURL: downloadURL });
      setProfilePictureUrl(downloadURL);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setFeedbackMessage('Error uploading profile picture. Please try again.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('User logged out successfully.');
      navigate('/login'); // Navigate to login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      setFeedbackMessage('Error logging out. Please try again.');
    }
  };

  // Handle Profile Picture Change
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const fileReader = new FileReader();
      fileReader.onloadend = () => {
        setProfilePictureUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  return (
    <div className="profile-page">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate('/notes')}>
        ← Back to Notes
      </button>

      <h1 className="profile-title">My Profile</h1>
      <div className="profile-container">
        {/* Feedback Section */}
        {feedbackMessage && <div className="feedback-message">{feedbackMessage}</div>}

        {/* Profile Picture Section */}
        <div className="profile-picture-section">
          <div className="profile-picture-container">
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt="Profile" className="profile-picture" />
            ) : (
              <div className="default-profile-picture">No Profile Picture</div>
            )}
          </div>
          <input
            type="file"
            onChange={handleProfilePictureChange}
            accept="image/*"
            className="profile-picture-input"
          />
        </div>

        {/* User Information Section */}
        <div className="user-info-section">
          <label className="input-label">Display Name</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field"
          />

          <label className="input-label">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            disabled
            className="input-field disabled"
          />

          <label className="input-label">Current Password</label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="input-field"
            placeholder="Enter current password"
          />

          <label className="input-label">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="input-field"
            placeholder="Enter new password"
          />
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="save-button" onClick={handleUpdateProfile}>
            Update Profile
          </button>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
