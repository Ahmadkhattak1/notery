// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Import your pages
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ForgotPasswordPage from './pages/ForgetPasswordPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import NotesPage from './pages/NotesPage';

// Import the PrivateRoute component
import PrivateRoute from './components/PrivateRoute';

// Optionally, import a NotFoundPage for unmatched routes
import NotFoundPage from './pages/NotFoundPage.js';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Private Routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        {/* Notes Routes */}
        <Route
          path="/notes"
          element={
            <PrivateRoute>
              <NotesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notes/:folderId"
          element={
            <PrivateRoute>
              <NotesPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/notes/:folderId/:noteId"
          element={
            <PrivateRoute>
              <NotesPage />
            </PrivateRoute>
          }
        />

        {/* Fallback Route for 404 - Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
}

export default App;
