// NoteEditor.js

import React from 'react';
import { EditorContent } from '@tiptap/react';
import './styling/NoteEditor.css'; // Corrected CSS import path

const NoteEditor = ({
  activeNote,
  editor,
  handleImageUpload,
  handleCameraCapture,
}) => {
  if (!activeNote) {
    return (
      <div className="note-view-section">
        <div className="note-content-container">
          <div className="no-note-selected">
            <p>Select a note to view and edit its content.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-view-section">
      <div className="note-content-container">
        {/* Note Content */}
        <div className="note-content">
          <div
            className="editor-container"
            onClick={() => editor && editor.commands.focus()}
          >
            <EditorContent editor={editor} className="editor-content" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
