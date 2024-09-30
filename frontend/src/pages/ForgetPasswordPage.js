// frontend/src/pages/ForgotPasswordPage.js
import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset email has been sent. Please check your inbox.');
      setError(null);
    } catch (err) {
      console.error('Error sending reset email:', err.message);
      setError(err.message);
      setMessage(null);
    }
  };

  return (
    <div>
      <h1>Forgot Password</h1>
      <form onSubmit={handleResetPassword}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
        />
        <button type="submit">Send Reset Link</button>
        {message && <p style={{ color: 'green' }}>{message}</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
