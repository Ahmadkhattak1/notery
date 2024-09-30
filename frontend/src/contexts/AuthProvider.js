// frontend/src/contexts/AuthProvider.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(undefined);  // Initially undefined to indicate loading

  useEffect(() => {
    if (!auth) {
      console.error("Firebase auth is not initialized properly");
      return;
    }

    console.log("Initializing onAuthStateChanged...");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth state changed. Current user:", currentUser);
      setUser(currentUser || null);  // Update the user state when authentication changes
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("User logged out.");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
