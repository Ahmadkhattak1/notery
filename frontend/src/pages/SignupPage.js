import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebaseConfig'; // Assuming Firestore is already set up and imported
import { doc, setDoc } from 'firebase/firestore';
import './styling/loginsignup.css';


const Signup = () => {
  const [name, setName] = useState(''); // New state for name
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Add user details to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: name,
        email: email,
      });

      navigate('/notes'); // Navigate to notes page on successful signup
    } catch (err) {
      setError('Failed to sign up. Please try again.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-page">
        <h2>Create an Account</h2>
        <form onSubmit={handleSignup}>
          <input
            type="text"
            className="input-field"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
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
          <button type="submit" className="auth-button">
            Sign Up
          </button>
        </form>
        <div className="alternate-action">
          Already have an account? <a href="/login">Log In</a>
        </div>
      </div>
    </div>
  );
};

export default Signup;
