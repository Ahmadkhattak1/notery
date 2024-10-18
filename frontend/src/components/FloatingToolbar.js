// src/components/FloatingToolbar.js

import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import './styling/FloatingToolbar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBold,
  faItalic,
  faUnderline,
  faStrikethrough,
  faCode,
  faParagraph,
  faHeading,
  faListUl,
  faListOl,
  faQuoteRight,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faPalette,
  faCheck,
  faChevronDown,
  faHighlighter,
} from '@fortawesome/free-solid-svg-icons';

const FloatingToolbar = ({ editor }) => {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Single state to manage which dropdown is active
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Define the specific color options provided
  const textColorOptions = [
    { name: 'Black', color: '#000000' },
    { name: 'Dark Gray', color: '#4D4D4D' },
    { name: 'Gray', color: '#9B9A97' },
    { name: 'Light Gray', color: '#B3B3B3' },
    { name: 'Red', color: '#E03E3E' },
    { name: 'Orange', color: '#D9730D' },
    { name: 'Yellow', color: '#DFAB01' },
    { name: 'Green', color: '#0F7B6C' },
    { name: 'Blue', color: '#0B6E99' },
    { name: 'Purple', color: '#6940A5' },
    { name: 'Pink', color: '#AD1A72' },
    { name: 'Brown', color: '#64473A' },
  ];

  const bgColorOptions = [
    { name: 'Grey', color: '#F1F1EF' },
    { name: 'Brown', color: '#F4EEEE' },
    { name: 'Orange', color: '#FAEBDD' },
    { name: 'Yellow', color: '#FBF3DB' },
    { name: 'Green', color: '#EDF3EC' },
    { name: 'Blue', color: '#E7F3F8' },
    { name: 'Purple', color: '#F6F3F9' },
    { name: 'Pink', color: '#FAF1F5' },
    { name: 'Red', color: '#FDEBEC' }, // Corrected color code
  ];

  const updateToolbar = () => {
    if (!editor) return;

    const { state, view } = editor;
    const { from, to, empty } = state.selection;

    if (empty) {
      setIsVisible(false);
      return;
    }

    const start = view.coordsAtPos(from);
    const end = view.coordsAtPos(to);

    const selectionRect = {
      top: Math.min(start.top, end.top),
      bottom: Math.max(start.bottom, end.bottom),
      left: Math.min(start.left, end.left),
      right: Math.max(start.right, end.right),
    };

    const toolbarWidth = toolbarRef.current?.offsetWidth || 400;
    const toolbarHeight = toolbarRef.current?.offsetHeight || 40;

    let top = selectionRect.top - toolbarHeight - 10;
    let left = (selectionRect.left + selectionRect.right) / 2 - toolbarWidth / 2;

    // Adjust position to keep toolbar within viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (top < 8) { // Added padding from top
      top = selectionRect.bottom + 10;
    }
    if (left < 8) {
      left = 8;
    } else if (left + toolbarWidth > viewportWidth - 8) {
      left = viewportWidth - toolbarWidth - 8;
    }

    // Ensure toolbar doesn't go off-screen vertically
    if (top + toolbarHeight > viewportHeight - 8) {
      top = viewportHeight - toolbarHeight - 8;
    }

    setPosition({ top, left });
    setIsVisible(true);
  };

  useEffect(() => {
    if (!editor) return;

    editor.on('selectionUpdate', updateToolbar);

    return () => {
      editor.off('selectionUpdate', updateToolbar);
    };
  }, [editor]);

  useEffect(() => {
    // Close active dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!isVisible) return null;

  const applyStyle = (command) => {
    command();
    setHasUnsavedChanges(true);
  };

  return (
    <div
      ref={toolbarRef}
      className="floating-toolbar"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {/* Formatting Buttons */}
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleBold().run())}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold"
      >
        <FontAwesomeIcon icon={faBold} />
      </button>
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleItalic().run())}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic"
      >
        <FontAwesomeIcon icon={faItalic} />
      </button>
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleUnderline().run())}
        className={editor.isActive('underline') ? 'is-active' : ''}
        title="Underline"
      >
        <FontAwesomeIcon icon={faUnderline} />
      </button>
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleStrike().run())}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="Strikethrough"
      >
        <FontAwesomeIcon icon={faStrikethrough} />
      </button>
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleCode().run())}
        className={editor.isActive('code') ? 'is-active' : ''}
        title="Inline Code"
      >
        <FontAwesomeIcon icon={faCode} />
      </button>

      {/* H1 and H2 */}
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title="Heading 1"
      >
        <span className="heading-label">H1</span>
      </button>
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        title="Heading 2"
      >
        <span className="heading-label">H2</span>
      </button>

      {/* Unordered List */}
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleBulletList().run())}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="Bullet List"
      >
        <FontAwesomeIcon icon={faListUl} />
      </button>

      {/* Ordered List */}
      <button
        onClick={() => applyStyle(() => editor.chain().focus().toggleOrderedList().run())}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="Numbered List"
      >
        <FontAwesomeIcon icon={faListOl} />
      </button>

      {/* Paragraph Dropdown */}
      <div className="paragraph-dropdown-container">
        <button
          onClick={() =>
            setActiveDropdown((prev) => (prev === 'paragraph' ? null : 'paragraph'))
          }
          className={
            editor.isActive('paragraph') ||
            editor.isActive('codeBlock') ||
            editor.isActive('blockquote')
              ? 'is-active'
              : ''
          }
          title="Paragraph Styles"
        >
          <FontAwesomeIcon icon={faParagraph} />
          <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
        </button>
        <div
          className={`paragraph-dropdown-popup ${
            activeDropdown === 'paragraph' ? 'active' : ''
          }`}
        >
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().setParagraph().run());
              setActiveDropdown(null);
            }}
            className={editor.isActive('paragraph') ? 'is-active' : ''}
            title="Normal Paragraph"
          >
            <FontAwesomeIcon icon={faParagraph} />
            <span>Normal</span>
          </button>
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().toggleCodeBlock().run());
              setActiveDropdown(null);
            }}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            title="Code Block"
          >
            <FontAwesomeIcon icon={faCode} />
            <span>Code Block</span>
          </button>
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().toggleBlockquote().run());
              setActiveDropdown(null);
            }}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Blockquote"
          >
            <FontAwesomeIcon icon={faQuoteRight} />
            <span>Blockquote</span>
          </button>
        </div>
      </div>

      {/* Alignment Dropdown */}
      <div className="align-dropdown-container">
        <button
          onClick={() =>
            setActiveDropdown((prev) => (prev === 'align' ? null : 'align'))
          }
          className={
            editor.isActive({ textAlign: 'left' }) ||
            editor.isActive({ textAlign: 'center' }) ||
            editor.isActive({ textAlign: 'right' })
              ? 'is-active'
              : ''
          }
          title="Text Alignment"
        >
          <FontAwesomeIcon icon={faAlignLeft} />
          <FontAwesomeIcon icon={faChevronDown} className="dropdown-icon" />
        </button>
        <div
          className={`align-dropdown-popup ${
            activeDropdown === 'align' ? 'active' : ''
          }`}
        >
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().setTextAlign('left').run());
              setActiveDropdown(null);
            }}
            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
            title="Align Left"
          >
            <FontAwesomeIcon icon={faAlignLeft} />
            <span>Left</span>
          </button>
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().setTextAlign('center').run());
              setActiveDropdown(null);
            }}
            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
            title="Align Center"
          >
            <FontAwesomeIcon icon={faAlignCenter} />
            <span>Center</span>
          </button>
          <button
            onClick={() => {
              applyStyle(() => editor.chain().focus().setTextAlign('right').run());
              setActiveDropdown(null);
            }}
            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
            title="Align Right"
          >
            <FontAwesomeIcon icon={faAlignRight} />
            <span>Right</span>
          </button>
        </div>
      </div>

      {/* Text Color Picker */}
      <div className="color-picker-container">
        <button
          onClick={() =>
            setActiveDropdown((prev) => (prev === 'textColor' ? null : 'textColor'))
          }
          className={editor.isActive('textStyle', { color: true }) ? 'is-active' : ''}
          title="Text Color"
        >
          <FontAwesomeIcon icon={faPalette} />
        </button>
        <div
          className={`color-picker-popup ${
            activeDropdown === 'textColor' ? 'active' : ''
          }`}
        >
          {textColorOptions.map(({ name, color }) => (
            <button
              key={color}
              className="color-button"
              style={{ backgroundColor: color }}
              onClick={() => {
                applyStyle(() => editor.chain().focus().setColor(color).run());
                setActiveDropdown(null);
              }}
              title={name}
            >
              {editor.isActive('textStyle', { color })
                ? <FontAwesomeIcon icon={faCheck} className="color-check-icon" />
                : null}
            </button>
          ))}
        </div>
      </div>

      {/* Background Color Picker */}
      <div className="bg-color-picker-container">
        <button
          onClick={() =>
            setActiveDropdown((prev) => (prev === 'bgColor' ? null : 'bgColor'))
          }
          className={editor.isActive('highlight', { color: true }) ? 'is-active' : ''}
          title="Background Color"
        >
          <FontAwesomeIcon icon={faHighlighter} />
        </button>
        <div
          className={`bg-color-picker-popup ${
            activeDropdown === 'bgColor' ? 'active' : ''
          }`}
        >
          {bgColorOptions.map(({ name, color }) => (
            <button
              key={color}
              className="bg-color-button"
              style={{ backgroundColor: color }}
              onClick={() => {
                applyStyle(() => editor.chain().focus().setHighlight({ color }).run());
                setActiveDropdown(null);
              }}
              title={name}
            >
              {editor.isActive('highlight', { color })
                ? <FontAwesomeIcon icon={faCheck} className="bg-color-check-icon" />
                : null}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

FloatingToolbar.propTypes = {
  editor: PropTypes.object.isRequired,
};

export default FloatingToolbar;
