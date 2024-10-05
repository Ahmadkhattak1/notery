import React from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import './styling/HomePage.css';
const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Handle Logout
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      console.log('User logged out successfully.');
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Error logging out. Please try again.');
    }
  };

  const handleNavigate = (route) => {
    navigate(route);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Welcome to Notery</h1>
        <p>Your one-stop solution for taking organized, automatic, and beautiful notes, made especially for students!</p>
        {user ? (
          <div className="cta-buttons">
            <button className="cta-button" onClick={() => handleNavigate('/notes')}>
              Go to Notes
            </button>
            <button className="cta-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="cta-buttons">
            <button className="cta-button" onClick={() => handleNavigate('/signup')}>
              Sign Up
            </button>
            <button className="cta-button" onClick={() => handleNavigate('/login')}>
              Login
            </button>
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Features You'll Love</h2>
        <div className="features-list">
          <div className="feature">
            <div className="feature-icon">📝</div>
            <h3>Beautiful Notes</h3>
            <p>Create and organize notes with a rich text editor, perfect for all your study needs.</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📂</div>
            <h3>Organized Folders</h3>
            <p>Keep your classes and notes organized in neat folders. No more chaos!</p>
          </div>
          <div className="feature">
            <div className="feature-icon">🔊</div>
            <h3>Voice and Automatic Notes</h3>
            <p>Record voice memos or create automatic notes from lectures to never miss an important detail.</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="cta-section">
        <h2>Ready to Make Your Notes Awesome?</h2>
        <p>Join Notery today and start your journey towards organized and stress-free note-taking.</p>
        <button className="cta-button" onClick={() => handleNavigate('/signup')}>
          Get Started
        </button>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>
          Made with <span className="love">❤️</span> by <strong>Ahmad Khattak</strong>
        </p>
        <p>
          <a href="#features">Features</a> | <a href="#signup">Sign Up</a> | <a href="#login">Login</a>
        </p>
      </footer>
    </div>
  );
};

export default HomePage;
