// src/components/FloatingToolbar.js

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './styling/FloatingToolbar.css'; // Ensure to create appropriate styles

const FloatingToolbar = ({ editor }) => {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updateToolbar = () => {
    const { from, to } = editor.state.selection;
    if (from === to) {
      setIsVisible(false);
      return;
    }

    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const toolbarWidth = 200; // Adjust as needed
    const toolbarHeight = 40; // Adjust as needed

    const top = Math.min(start.top, end.top) - toolbarHeight - 8;
    const left = Math.min(start.left, end.left) + (end.left - start.left) / 2 - toolbarWidth / 2;

    setPosition({ top: top < 0 ? start.bottom + 8 : top, left: left < 0 ? 8 : left });
    setIsVisible(true);
  };

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', updateToolbar);
    editor.on('transaction', updateToolbar);

    return () => {
      editor.off('selectionUpdate', updateToolbar);
      editor.off('transaction', updateToolbar);
    };
  }, [editor]);

  if (!isVisible) return null;

  const applyStyle = (command) => {
    command();
    setIsVisible(false);
  };

  const handleImageUpload = () => {
    document.getElementById('image-upload-input').click();
  };

  const handleAINotes = () => {
    // Implement AI Notes functionality
    alert('AI Notes feature is not implemented yet.');
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className="floating-toolbar"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        <div className="toolbar-group">
          <button onClick={() => applyStyle(() => editor.chain().focus().toggleBold().run())} title="Bold">
            <strong>B</strong>
          </button>
          <button onClick={() => applyStyle(() => editor.chain().focus().toggleItalic().run())} title="Italic">
            <em>I</em>
          </button>
          <button onClick={() => applyStyle(() => editor.chain().focus().toggleUnderline().run())} title="Underline">
            <u>U</u>
          </button>
          <button onClick={() => applyStyle(() => editor.chain().focus().toggleStrike().run())} title="Strikethrough">
            <s>S</s>
          </button>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const level = parseInt(e.target.value, 10);
              if (level === 0) {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level }).run();
              }
            }}
            value={editor.isActive('heading', { level: 1 })
              ? 1
              : editor.isActive('heading', { level: 2 })
              ? 2
              : 0}
          >
            <option value={0}>Styles</option>
            <option value={1}>Heading 1</option>
            <option value={2}>Heading 2</option>
            <option value={0}>Paragraph</option>
          </select>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const listType = e.target.value;
              if (listType === 'bullet') {
                editor.chain().focus().toggleBulletList().run();
              } else if (listType === 'ordered') {
                editor.chain().focus().toggleOrderedList().run();
              }
            }}
            value={
              editor.isActive('bulletList')
                ? 'bullet'
                : editor.isActive('orderedList')
                ? 'ordered'
                : ''
            }
          >
            <option value="">Lists</option>
            <option value="bullet">Bullet List</option>
            <option value="ordered">Numbered List</option>
          </select>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const alignment = e.target.value;
              editor.chain().focus().setTextAlign(alignment).run();
            }}
            value={
              editor.isActive({ textAlign: 'left' })
                ? 'left'
                : editor.isActive({ textAlign: 'center' })
                ? 'center'
                : editor.isActive({ textAlign: 'right' })
                ? 'right'
                : editor.isActive({ textAlign: 'justify' })
                ? 'justify'
                : 'left'
            }
          >
            <option value="left">Align</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>

        <div className="toolbar-group">
          <select
            onChange={(e) => {
              const color = e.target.value;
              editor.chain().focus().setColor(color).run();
            }}
            value={editor.getAttributes('textStyle').color || ''}
          >
            <option value="">Text Color</option>
            <option value="#000000">Black</option>
            <option value="#4D4D4D">Dark Gray</option>
            <option value="#9B9A97">Gray</option>
            <option value="#B3B3B3">Light Gray</option>
            <option value="#E03E3E">Red</option>
            <option value="#D9730D">Orange</option>
            <option value="#DFAB01">Yellow</option>
            <option value="#0F7B6C">Green</option>
            <option value="#0B6E99">Blue</option>
            <option value="#6940A5">Purple</option>
            <option value="#AD1A72">Pink</option>
            <option value="#64473A">Brown</option>
          </select>
        </div>

        <div className="toolbar-group">
          <button onClick={handleImageUpload} title="Upload/Take Photo">
            📷
          </button>
          <input
            type="file"
            id="image-upload-input"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = () => {
                  editor.chain().focus().setImage({ src: reader.result }).run();
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          <button onClick={handleAINotes} title="AI Notes">
            🤖
          </button>
        </div>
      </div>
    </>
  );
};

FloatingToolbar.propTypes = {
  editor: PropTypes.object.isRequired,
};

export default FloatingToolbar;
