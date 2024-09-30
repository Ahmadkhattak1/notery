import React, { useState } from 'react';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate(); // Hook to navigate to other routes

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Logged in successfully');
      navigate('/'); // Redirect to home page after successful login
    } catch (err) {
      console.error('Error logging in:', err.message);
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Login Page</h1>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">Log In</button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </form>
      <Link to="/forgot-password">Forgot Password?</Link>
    </div>
  );
};

export default LoginPage;
