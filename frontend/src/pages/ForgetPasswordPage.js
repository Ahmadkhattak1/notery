// frontend/src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';
import './styling/ForgetPasswordPage.css'; // Import the CSS file

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSending, setIsSending] = useState(false); // Added loading state

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email has been sent. Please check your inbox.');
      setError(null);
    } catch (err) {
      console.error('Error sending reset email:', err.message);
      setError('Failed to send reset email. Please try again.');
      setMessage(null);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <h1 className="forgot-password-title">Forgot Password</h1>
        <form onSubmit={handleResetPassword} className="forgot-password-form">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            className="forgot-password-input"
            required
          />
          <button
            type="submit"
            className="forgot-password-button"
            disabled={isSending}
          >
            {isSending ? 'Sending...' : 'Send Reset Link'}
          </button>
          {message && <p className="forgot-password-message success">{message}</p>}
          {error && <p className="forgot-password-message error">{error}</p>}
        </form>
        <div className="forgot-password-links">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
