// frontend/src/pages/Login.js

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
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
      setMessage('');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page">
        <h2>Login to Notery</h2>
        <form onSubmit={handleLogin} className="auth-form">
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
            {/* Use Link for navigation */}
            <Link to="/forgot-password" className="forgot-password-button">
              Forgot Password?
            </Link>
          </p>
          <p>
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
