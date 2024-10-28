// src/components/NoteEditor.js

import React from 'react';
import { EditorContent } from '@tiptap/react';
import './styling/NoteEditor.css'; // Ensure the correct path

const NoteEditor = ({ activeNote, editor }) => {
  if (!activeNote) {
    return (
      <div className="note-editor-wrapper">
        <div className="note-editor-container">
          <div className="no-note-selected">
            <p>Select a note to view and edit its content.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor-wrapper">
      <div className="note-editor-container">
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
