// src/components/FloatingToolbar.js

import React, { useEffect, useState, useRef } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for portals
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

/**
 * Dropdown Component using React Portal
 */
const Dropdown = ({ type, position, children }) => {
  if (!position) return null;

  return ReactDOM.createPortal(
    <div
      className={`${type}-dropdown-popup active`}
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {children}
    </div>,
    document.body
  );
};

Dropdown.propTypes = {
  type: PropTypes.string.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
  }),
  children: PropTypes.node.isRequired,
};

const FloatingToolbar = ({ editor }) => {
  const toolbarRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // State to manage which dropdown is active and its position
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState(null);

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

  /**
   * Updates the toolbar's visibility and position based on the current selection
   */
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
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target) &&
        !event.target.closest('.paragraph-dropdown-popup') &&
        !event.target.closest('.align-dropdown-popup') &&
        !event.target.closest('.color-picker-popup') &&
        !event.target.closest('.bg-color-picker-popup')
      ) {
        setActiveDropdown(null);
        setDropdownPosition(null);
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

  /**
   * Handles dropdown button clicks, toggling the active dropdown and setting its position
   */
  const handleDropdownClick = (dropdownType, event) => {
    if (activeDropdown === dropdownType) {
      setActiveDropdown(null);
      setDropdownPosition(null);
      return;
    }

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const dropdownWidth = 200; // Approximate width of the dropdown
    const dropdownHeight = 150; // Approximate height of the dropdown

    let top = buttonRect.bottom + window.scrollY;
    let left = buttonRect.left + window.scrollX;

    // Adjust if dropdown goes beyond viewport width
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - 10; // 10px padding from edge
    }

    // Adjust if dropdown goes beyond viewport height
    if (top + dropdownHeight > window.innerHeight + window.scrollY) {
      top = buttonRect.top + window.scrollY - dropdownHeight;
    }

    setActiveDropdown(dropdownType);
    setDropdownPosition({ top, left });
  };

  return (
    <>
      <div
        ref={toolbarRef}
        className="floating-toolbar"
        style={{ top: `${position.top}px`, left: `${position.left}px` }}
      >
        {/* Formatting Buttons */}
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleBold().run());
          }}
          className={editor.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <FontAwesomeIcon icon={faBold} />
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleItalic().run());
          }}
          className={editor.isActive('italic') ? 'is-active' : ''}
          title="Italic"
        >
          <FontAwesomeIcon icon={faItalic} />
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleUnderline().run());
          }}
          className={editor.isActive('underline') ? 'is-active' : ''}
          title="Underline"
        >
          <FontAwesomeIcon icon={faUnderline} />
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleStrike().run());
          }}
          className={editor.isActive('strike') ? 'is-active' : ''}
          title="Strikethrough"
        >
          <FontAwesomeIcon icon={faStrikethrough} />
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleCodeBlock().run());
          }}
          className={editor.isActive('codeBlock') ? 'is-active' : ''}
          title="Code Block"
        >
          <FontAwesomeIcon icon={faCode} />
        </button>

        {/* H1 and H2 */}
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleHeading({ level: 1 }).run());
          }}
          className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          title="Heading 1"
        >
          <span className="heading-label">H1</span>
        </button>
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleHeading({ level: 2 }).run());
          }}
          className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          title="Heading 2"
        >
          <span className="heading-label">H2</span>
        </button>

        {/* Unordered List */}
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleBulletList().run());
          }}
          className={editor.isActive('bulletList') ? 'is-active' : ''}
          title="Bullet List"
        >
          <FontAwesomeIcon icon={faListUl} />
        </button>

        {/* Ordered List */}
        <button
          onMouseDown={(event) => {
            event.preventDefault();
            applyStyle(() => editor.chain().focus().toggleOrderedList().run());
          }}
          className={editor.isActive('orderedList') ? 'is-active' : ''}
          title="Numbered List"
        >
          <FontAwesomeIcon icon={faListOl} />
        </button>

        {/* Paragraph Dropdown */}
        <div className="paragraph-dropdown-container">
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              handleDropdownClick('paragraph', event);
            }}
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
        </div>

        {/* Alignment Dropdown */}
        <div className="align-dropdown-container">
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              handleDropdownClick('align', event);
            }}
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
        </div>

        {/* Text Color Picker */}
        <div className="color-picker-container">
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              handleDropdownClick('color-picker', event);
            }}
            className={editor.isActive('textStyle', { color: true }) ? 'is-active' : ''}
            title="Text Color"
          >
            <FontAwesomeIcon icon={faPalette} />
          </button>
        </div>

        {/* Background Color Picker */}
        <div className="bg-color-picker-container">
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              handleDropdownClick('bg-color-picker', event);
            }}
            className={editor.isActive('highlight', { color: true }) ? 'is-active' : ''}
            title="Background Color"
          >
            <FontAwesomeIcon icon={faHighlighter} />
          </button>
        </div>
      </div>

      {/* Render Dropdowns Using Portals */}
      {activeDropdown === 'paragraph' && (
        <Dropdown type="paragraph" position={dropdownPosition}>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().setParagraph().run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive('paragraph') ? 'is-active' : ''}
            title="Normal Paragraph"
          >
            <FontAwesomeIcon icon={faParagraph} />
            <span>Normal</span>
          </button>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().toggleCodeBlock().run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            title="Code Block"
          >
            <FontAwesomeIcon icon={faCode} />
            <span>Code Block</span>
          </button>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().toggleBlockquote().run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="Blockquote"
          >
            <FontAwesomeIcon icon={faQuoteRight} />
            <span>Blockquote</span>
          </button>
        </Dropdown>
      )}

      {activeDropdown === 'align' && (
        <Dropdown type="align" position={dropdownPosition}>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().setTextAlign('left').run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive({ textAlign: 'left' }) ? 'is-active' : ''}
            title="Align Left"
          >
            <FontAwesomeIcon icon={faAlignLeft} />
            <span>Left</span>
          </button>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().setTextAlign('center').run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive({ textAlign: 'center' }) ? 'is-active' : ''}
            title="Align Center"
          >
            <FontAwesomeIcon icon={faAlignCenter} />
            <span>Center</span>
          </button>
          <button
            onMouseDown={(event) => {
              event.preventDefault();
              applyStyle(() => editor.chain().focus().setTextAlign('right').run());
              setActiveDropdown(null);
              setDropdownPosition(null);
            }}
            className={editor.isActive({ textAlign: 'right' }) ? 'is-active' : ''}
            title="Align Right"
          >
            <FontAwesomeIcon icon={faAlignRight} />
            <span>Right</span>
          </button>
        </Dropdown>
      )}

      {activeDropdown === 'color-picker' && (
        <Dropdown type="color-picker" position={dropdownPosition}>
          {textColorOptions.map(({ name, color }) => (
            <button
              key={color}
              className="color-button"
              style={{ backgroundColor: color }}
              onMouseDown={(event) => {
                event.preventDefault();
                applyStyle(() => editor.chain().focus().setColor(color).run());
                setActiveDropdown(null);
                setDropdownPosition(null);
              }}
              title={name}
            >
              {editor.isActive('textStyle', { color }) && (
                <FontAwesomeIcon icon={faCheck} className="color-check-icon" />
              )}
            </button>
          ))}
        </Dropdown>
      )}

      {activeDropdown === 'bg-color-picker' && (
        <Dropdown type="bg-color-picker" position={dropdownPosition}>
          {bgColorOptions.map(({ name, color }) => (
            <button
              key={color}
              className="bg-color-button"
              style={{ backgroundColor: color }}
              onMouseDown={(event) => {
                event.preventDefault();
                applyStyle(() => editor.chain().focus().setHighlight({ color }).run());
                setActiveDropdown(null);
                setDropdownPosition(null);
              }}
              title={name}
            >
              {editor.isActive('highlight', { color }) && (
                <FontAwesomeIcon icon={faCheck} className="bg-color-check-icon" />
              )}
            </button>
          ))}
        </Dropdown>
      )}
    </>
  );
};

FloatingToolbar.propTypes = {
  editor: PropTypes.object.isRequired,
};

export default FloatingToolbar;
