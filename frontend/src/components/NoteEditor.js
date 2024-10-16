// NoteEditor.js

import React from 'react';
import { EditorContent } from '@tiptap/react';
import Toolbar from './Toolbar'; // Import the Toolbar component
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
        <div className="no-note-selected">
          <p>Select a note to view and edit its content.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="note-view-section">
      {/* Toolbar Section */}
      <div className="toolbar-section">
        <Toolbar
          editor={editor}
          handleImageUpload={handleImageUpload}
          handleCameraCapture={handleCameraCapture}
        />
      </div>

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
  );
};

export default NoteEditor;
