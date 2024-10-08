// NoteEditor.js

import React from 'react';
import { EditorContent } from '@tiptap/react';
import '../pages/styling/NotesPage.css';

const NoteEditor = ({
  activeNote,
  editor,
  textColor,
  colorOptions,
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
      <div className="note-content">
        {/* TipTap Toolbar */}
        <div className="toolbar">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor}
            title="Bold"
            className={editor && editor.isActive('bold') ? 'active' : ''}
          >
            Bold
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor}
            title="Italic"
            className={editor && editor.isActive('italic') ? 'active' : ''}
          >
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor}
            title="Underline"
            className={editor && editor.isActive('underline') ? 'active' : ''}
          >
            Underline
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor}
            title="Strike"
            className={editor && editor.isActive('strike') ? 'active' : ''}
          >
            Strike
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={!editor}
            title="Heading 1"
            className={editor && editor.isActive('heading', { level: 1 }) ? 'active' : ''}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor}
            title="Heading 2"
            className={editor && editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          >
            H2
          </button>
          <button
            onClick={() => editor.chain().focus().setParagraph().run()}
            disabled={!editor}
            title="Paragraph"
            className={editor && editor.isActive('paragraph') ? 'active' : ''}
          >
            Paragraph
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            disabled={!editor}
            title="Code Block"
            className={editor && editor.isActive('codeBlock') ? 'active' : ''}
          >
            Code Block
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={!editor}
            title="Horizontal Line"
            className={editor && editor.isActive('horizontalRule') ? 'active' : ''}
          >
            Horizontal Line
          </button>
          <button
            onClick={() => {
              const date = new Date().toLocaleDateString();
              editor.chain().focus().insertContent(`<p>${date}</p>`).run();
              console.log('Date stamp inserted:', date);
            }}
            disabled={!editor}
            title="Insert Date Stamp"
          >
            Date Stamp
          </button>
          <select
            onChange={(e) => {
              const color = e.target.value;
              if (color) {
                editor.chain().focus().setColor(color).run();
                console.log('Text color set to:', color);
              } else {
                editor.chain().focus().unsetColor().run();
                console.log('Text color unset.');
              }
            }}
            disabled={!editor}
            value={textColor}
            title="Text Color"
            className="text-color-select"
          >
            {colorOptions.map((option, index) => (
              <option key={index} value={option.color || ''}>
                {option.name}
              </option>
            ))}
          </select>

          {/* Ordered List */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
            title="Ordered List"
            className={editor && editor.isActive('orderedList') ? 'active' : ''}
          >
            OL
          </button>
          {/* Bullet List */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={!editor}
            title="Bullet List"
            className={editor && editor.isActive('bulletList') ? 'active' : ''}
          >
            UL
          </button>
          {/* Image Upload Options */}
          <div className="image-upload-options">
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              id="imageUploadEditor"
            />
            <label htmlFor="imageUploadEditor" title="Upload Image" className="image-upload-label">
              Upload Image
            </label>
            <input
              type="file"
              onChange={handleCameraCapture}
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              id="cameraCaptureEditor"
            />
            <label htmlFor="cameraCaptureEditor" title="Take Photo" className="image-upload-label">
              Take Photo
            </label>
          </div>
        </div>

        {/* Editor Container */}
        <div
          className="editor-container"
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor;
