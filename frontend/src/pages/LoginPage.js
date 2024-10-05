import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './styling/loginsignup.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/notes'); // Navigate to notes page on successful login
    } catch (err) {
      setError('Failed to log in. Please check your email and password.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset your password.');
      return;
    }

    const auth = getAuth();
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent to your email. Please check your inbox.');
      setError('');
    } catch (err) {
      setError('Failed to send password reset email. Please check your email.');
      setMessage('');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page">
        <h2>Login to Notery</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            className="input-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            className="input-field"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}
          <button type="submit" className="auth-button">
            Log In
          </button>
        </form>
        <div className="alternate-action">
          <p>
            <button
              className="forgot-password-button"
              onClick={handleForgotPassword}
              type="button"
            >
              Forgot Password?
            </button>
          </p>
          <p>
            Don't have an account? <a href="/signup">Sign Up</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
