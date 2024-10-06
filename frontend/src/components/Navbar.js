// src/components/NavBar.js

import React from 'react';
import { Link } from 'react-router-dom';
import './styling/NavBar.css';

const NavBar = () => {
  return (
    <nav className="nav-bar">
      <div className="nav-container">
        <Link to="/home" className="nav-link">Home</Link>
        <Link to="/notes" className="nav-link">Notes</Link>
      </div>
    </nav>
  );
};

export default NavBar;
