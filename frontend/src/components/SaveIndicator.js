// src/components/SaveIndicator.js

import React, { useState, useEffect } from 'react';

const SaveIndicator = ({ isSaved }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isSaved) {
      setVisible(true); // Show the "All Saved!" message
      const timer = setTimeout(() => {
        setVisible(false); // Hide after 2 seconds
      }, 2000); // 2000 milliseconds = 2 seconds

      // Cleanup the timer if the component unmounts or if isSaved changes
      return () => clearTimeout(timer);
    } else {
      setVisible(true); // Ensure the "Saving..." message is visible
    }
  }, [isSaved]);

  // If not visible, render nothing
  if (!visible) return null;

  return (
    <div className={`save-indicator ${!isSaved ? 'saving' : ''}`}>
      {isSaved ? 'All Saved!' : 'Saving...'}
    </div>
  );
};

export default SaveIndicator;
