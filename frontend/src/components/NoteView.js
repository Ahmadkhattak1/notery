// src/components/NoteView.js

import React from 'react';

const NoteView = () => {
  return (
    <div className="note-view-section">
      <div className="no-note-wrapper">
        <div className="no-note-selected">
          <p>Please select or create a note to start editing.</p>
        </div>
      </div>
    </div>
  );
};

export default NoteView;
