import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { getAuth, updateProfile, updatePassword, signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const ProfilePage = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [currentPassword, setCurrentPassword] = useState(''); // To store the current password for re-authentication

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
      setProfilePictureUrl(user.photoURL || '');
    }
  }, [user]);

  // Handle Profile Update
  const handleUpdateProfile = async () => {
    if (!user) return;

    if (!currentPassword) {
      alert('Please enter your current password to update the profile.');
      return;
    }

    try {
      // Re-authenticate user before proceeding
      await reauthenticateUser(currentPassword);

      const auth = getAuth();

      if (displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }

      if (profilePicture) {
        await handleUploadProfilePicture(); // Upload picture if it exists
      }

      console.log('Profile updated successfully.');
      alert('Profile updated successfully!');
      setCurrentPassword(''); // Clear the password after updating
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  // Re-authenticate User
  const reauthenticateUser = async (password) => {
    const auth = getAuth();
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, password);

    try {
      await reauthenticateWithCredential(user, credential);
      console.log('Re-authentication successful.');
    } catch (error) {
      console.error('Error re-authenticating:', error);
      throw new Error('Re-authentication failed. Please check your password.');
    }
  };

  // Handle Uploading Profile Picture
  const handleUploadProfilePicture = async () => {
    if (!profilePicture) return;

    const storage = getStorage();
    const storageRef = ref(storage, `profilePictures/${user.uid}`); // Store the profile picture under 'profilePictures' folder with user's UID

    try {
      // Upload the file to Firebase Storage
      await uploadBytes(storageRef, profilePicture);

      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update the user's profile with the picture URL
      await updateProfile(user, { photoURL: downloadURL });
      setProfilePictureUrl(downloadURL);
      console.log('Profile picture updated successfully.');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Error uploading profile picture. Please try again.');
    }
  };

  // Handle Change Password
  const handleChangePassword = async () => {
    if (!newPassword) {
      alert('Please enter a new password.');
      return;
    }

    try {
      const auth = getAuth();
      await updatePassword(auth.currentUser, newPassword);
      console.log('Password updated successfully.');
      alert('Password updated successfully!');
      setNewPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      alert('Error updating password. Please try again.');
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('User logged out successfully.');
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
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
      <h1>Profile Page</h1>

      {/* Profile Picture Section */}
      <div className="profile-section">
        <label>Profile Picture</label>
        <div className="profile-picture-container">
          {profilePictureUrl ? (
            <img src={profilePictureUrl} alt="Profile" className="profile-picture" />
          ) : (
            <div className="default-profile-picture">No Profile Picture</div>
          )}
        </div>
        <input type="file" onChange={handleProfilePictureChange} accept="image/*" />
      </div>

      {/* Display Name Section */}
      <div className="profile-section">
        <label>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your display name"
        />
      </div>

      {/* Email Section */}
      <div className="profile-section">
        <label>Email</label>
        <input type="email" value={email} readOnly disabled />
      </div>

      {/* Password Input for Re-authentication */}
      <div className="profile-section">
        <label>Current Password</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="Enter current password"
        />
      </div>

      {/* Password Section */}
      <div className="profile-section">
        <label>New Password</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Enter new password"
        />
      </div>

      {/* Update and Logout Buttons */}
      <div className="profile-section">
        <button onClick={handleUpdateProfile}>Update Profile</button>
      </div>

      <div className="profile-section">
        <button onClick={handleChangePassword}>Change Password</button>
      </div>

      <div className="profile-section">
        <button onClick={handleLogout}>Logout</button>
      </div>
    </div>
  );
};

export default ProfilePage;
