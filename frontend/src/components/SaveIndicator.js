// src/components/SaveIndicator.js

import React from 'react';

const SaveIndicator = ({ isSaved }) => {
  return (
    <div className={`save-indicator ${!isSaved ? 'saving' : ''}`}>
      {isSaved ? 'All Saved!' : 'Saving...'}
    </div>
  );
};

export default SaveIndicator;
