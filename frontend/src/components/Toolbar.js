// src/components/Toolbar.js

import React, { useState, useRef } from 'react';
import './styling/Toolbar.css'; // Ensure you create appropriate styles

const Toolbar = ({ handleImageUpload, handleCameraCapture }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsDropdownOpen(false);
    }
  };

  React.useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="toolbar">
      <div className="upload-image-container" ref={dropdownRef}>
        <button
          className="upload-image-button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Upload Image"
        >
          📷 Upload Image
        </button>
        {isDropdownOpen && (
          <div className="dropdown-menu">
            <label htmlFor="imageUpload" className="dropdown-item">
              Upload from Device
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            <label htmlFor="cameraCapture" className="dropdown-item">
              Take Photo
              <input
                type="file"
                id="cameraCapture"
                accept="image/*"
                capture="environment"
                onChange={handleCameraCapture}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
