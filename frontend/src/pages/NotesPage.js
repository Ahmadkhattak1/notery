import React, { useState, useEffect, useRef } from 'react';
import Modal from 'react-modal';
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthProvider';
import { useEditor, EditorContent } from '@tiptap/react';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Highlight from '@tiptap/extension-highlight';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlock from '@tiptap/extension-code-block';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Gapcursor from '@tiptap/extension-gapcursor';
import ResizableImage from '../extensions/ResizableImage';
import './styling/NotesPage.css';

import truncate from 'html-truncate';
import DOMPurify from 'dompurify';
import CustomHeading from '../extensions/CustomHeading';
import CustomParagraph from '../extensions/CustomParagraph';
import Document from '@tiptap/extension-document';
import Text from '@tiptap/extension-text';
import History from '@tiptap/extension-history';
import HardBreak from '@tiptap/extension-hard-break';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import TextStyle from '@tiptap/extension-text-style';
import { getAuth, signOut } from 'firebase/auth';

Modal.setAppElement('#root'); // Accessibility requirement for the modal

const NotesPage = () => {
  const [textColor, setTextColor] = useState('');
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderName, setFolderName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const titleInputRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const auth = getAuth();
  // Add these definitions near the other useState calls
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [selectedFolderDropdown, setSelectedFolderDropdown] = useState(null);
  const colorOptions = [
    { name: 'Color', color: null },
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

  const [scrollIndex, setScrollIndex] = useState(0);
  const foldersPerRow = 4;
  const [maxScrollIndex, setMaxScrollIndex] = useState(0);

  useEffect(() => {
    setMaxScrollIndex(Math.max(0, Math.ceil(folders.length / foldersPerRow) - 1));
  }, [folders]);

  const handleScrollLeft = () => {
    setScrollIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleScrollRight = () => {
    setScrollIndex((prev) => Math.min(prev + 1, maxScrollIndex));
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsFolderModalOpen(true);
    setIsFolderDropdownOpen(false); // Close dropdown after selecting action
  };

  // Function to replace images with placeholders in the preview content
  const getPreviewContent = (htmlContent) => {
    const maxLength = 500;

    // Sanitize the HTML content to prevent XSS attacks
    const sanitizedContent = DOMPurify.sanitize(htmlContent);

    // Create a temporary DOM element to parse the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = sanitizedContent;

    // Replace images with placeholders
    const images = tempDiv.getElementsByTagName('img');
    for (let img of images) {
      const placeholderSpan = document.createElement('span');
      placeholderSpan.className = 'minimized-image-placeholder';
      placeholderSpan.textContent = '[Image Minimized]';

      // Replace the image with the placeholder
      img.parentNode.replaceChild(placeholderSpan, img);
    }

    // Get the inner HTML with formatting preserved
    let contentHTML = tempDiv.innerHTML;

    // Safely truncate the content to maxLength characters without breaking HTML tags
    contentHTML = truncate(contentHTML, maxLength, { ellipsis: '...' });

    // Return the content as a React element
    return <div dangerouslySetInnerHTML={{ __html: contentHTML }} />;
  };

  // TipTap editor setup with advanced features
  const editor = useEditor({
    extensions: [
      // Core extensions
      Document,
      Text,
      History,
      Gapcursor,
      HardBreak,

      // Custom nodes
      CustomParagraph,
      CustomHeading.configure({
        levels: [1, 2], // Heading levels H1 and H2
      }),

      // Marks
      Bold,
      Italic,
      Highlight,

      // Include TextStyle and Color after custom nodes
      TextStyle, // Required for the Color extension
      Color,

      // Lists
      ListItem,
      BulletList,
      OrderedList,

      // Other extensions
      Color,

      // Additional nodes
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      ResizableImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),

      // Additional extensions if needed
      Blockquote,
      HorizontalRule,
      Strike,
      Underline,
      Code,
    ],
    content: '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-content',
        'data-placeholder': 'Start typing here...',
      },
      onUpdate: ({ editor }) => {
        const isEmpty = editor.isEmpty;
        const editorElement = editor.view.dom;

        if (isEmpty) {
          editorElement.classList.add('is-empty');
        } else {
          editorElement.classList.remove('is-empty');
        }
      },
      handleKeyDown(view, event) {
        const editorInstance = this;

        if (event.key === 'Tab') {
          event.preventDefault();
          editorInstance.chain().focus().insertContent('    ').run(); // Insert 4 spaces
          return true;
        }

        if (event.key === 'Backspace' || event.key === 'Delete') {
          // Prevent deleting images with Backspace or Delete keys
          const { state } = view;
          const { $from, empty } = state.selection;

          if (empty) {
            const nodeBefore = $from.nodeBefore;
            const nodeAfter = $from.nodeAfter;

            if (
              (nodeBefore && nodeBefore.type.name === 'image') ||
              (nodeAfter && nodeAfter.type.name === 'image')
            ) {
              // Prevent deletion
              event.preventDefault();
              return true;
            }
          } else {
            const { from, to } = state.selection;
            let hasImage = false;
            state.doc.nodesBetween(from, to, (node) => {
              if (node.type.name === 'image') {
                hasImage = true;
              }
            });
            if (hasImage) {
              // Prevent deletion
              event.preventDefault();
              return true;
            }
          }

          // Existing Backspace logic for deleting indentation spaces
          if (event.key === 'Backspace') {
            const { from } = state.selection;
            if (from < 4) return false; // Prevent removing beyond start

            const text = state.doc.textBetween(from - 4, from, '\n', '\0');
            if (text === '    ') {
              event.preventDefault();
              editorInstance.chain().focus().deleteRange({ from: from - 4, to: from }).run();
              return true;
            }
          }
        }

        if (event.key === ' ' && !event.shiftKey) {
          const { $from } = view.state.selection;
          const before = view.state.doc.textBetween($from.before(), $from.pos, '\n', '\0');
          if (before.endsWith('  ')) {
            // Double space
            event.preventDefault();
            editorInstance.chain().focus().insertContent('    ').run(); // Indent by 4 spaces
            return true;
          }
        }

        return false;
      },

      handlePaste(view, event) {
        // Prevent pasting over images
        const { state } = view;
        const { selection } = state;
        const { $from, $to } = selection;

        let hasImage = false;
        state.doc.nodesBetween($from.pos, $to.pos, (node) => {
          if (node.type.name === 'image') {
            hasImage = true;
          }
        });

        if (hasImage) {
          event.preventDefault();
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (editor) {
      const updateTextColor = () => {
        const color = editor.getAttributes('textStyle').color || '';
        setTextColor(color);
      };

      // Update text color when selection changes
      editor.on('selectionUpdate', updateTextColor);

      // Update text color when the content changes
      editor.on('transaction', updateTextColor);

      // Cleanup on unmount
      return () => {
        editor.off('selectionUpdate', updateTextColor);
        editor.off('transaction', updateTextColor);
      };
    }
  }, [editor]);

  const openModal = () => {
    setIsModalOpen(true);
    // Focus the title input after the modal opens
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to the editor
      editor?.commands.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isFolderDropdownOpen && !event.target.closest('.folder-dropdown-container')) {
        setIsFolderDropdownOpen(false);
        setSelectedFolderDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFolderDropdownOpen]);

  // Fetch folders and notes from Firestore
  useEffect(() => {
    if (!user) return;

    // Fetch folders
    const unsubscribeFolders = onSnapshot(collection(db, 'folders'), (snapshot) => {
      const foldersData = snapshot.docs
        .filter((doc) => doc.data().userId === user.uid)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setFolders(foldersData);
    });

    // Fetch notes
    const unsubscribeNotes = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const notesData = snapshot.docs
        .filter((doc) => doc.data().userId === user.uid)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    });

    return () => {
      unsubscribeFolders();
      unsubscribeNotes();
    };
  }, [user]);

  // Function to handle adding a new note
  const handleAddNote = async () => {
    if (!editor) return;

    // Trim the editTitle to check if it's empty or only whitespace
    let title = editTitle.trim();

    if (!title) {
      // Generate title from content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editor.getHTML();

      // Remove images and other non-text elements
      const images = tempDiv.getElementsByTagName('img');
      while (images.length > 0) {
        images[0].parentNode.removeChild(images[0]);
      }

      // Get the text content
      let textContent = tempDiv.textContent || tempDiv.innerText || '';
      textContent = textContent.trim();

      // Remove extra spaces and get the first 30 non-space characters
      if (textContent.length > 0) {
        // Remove consecutive spaces
        textContent = textContent.replace(/\s+/g, ' ');
        // Get the first 40 characters
        title = textContent.substring(0, 40);
      } else {
        // If content is empty, set a default title
        title = 'Untitled Note';
      }
    }

    // Check if content is empty
    if (!editor.getHTML().trim()) {
      alert("Content can't be empty");
      return;
    }

    try {
      await addDoc(collection(db, 'notes'), {
        title: title,
        content: editor.getHTML(),
        folderId: selectedFolder || null,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: null,
      });
      setEditTitle('');
      editor.commands.setContent(''); // Clear editor content
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add the note. Please try again.');
    }
  };

  // Function to handle editing an existing note
  const handleEditNote = async () => {
    if (!editor) return;

    // Trim the editTitle to check if it's empty or only whitespace
    let title = editTitle.trim();

    if (!title) {
      // Generate title from content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editor.getHTML();

      // Remove images and other non-text elements
      const images = tempDiv.getElementsByTagName('img');
      while (images.length > 0) {
        images[0].parentNode.removeChild(images[0]);
      }

      // Get the text content
      let textContent = tempDiv.textContent || tempDiv.innerText || '';
      textContent = textContent.trim();

      // Remove extra spaces and get the first 30 non-space characters
      if (textContent.length > 0) {
        // Remove consecutive spaces
        textContent = textContent.replace(/\s+/g, ' ');
        // Get the first 30 characters
        title = textContent.substring(0, 30);
      } else {
        // If content is empty, set a default title
        title = 'Untitled Note';
      }
    }

    // Check if content is empty
    if (!editor.getHTML().trim()) {
      alert("Content can't be empty");
      return;
    }

    if (initialContent === editor.getHTML()) {
      // No changes were made, just close the modal
      setIsModalOpen(false);
      return;
    }

    try {
      const noteRef = doc(db, 'notes', editingNoteId);
      await updateDoc(noteRef, {
        title: title,
        content: editor.getHTML(),
        updatedAt: serverTimestamp(),
      });
      setEditingNoteId(null);
      setEditTitle('');
      editor.commands.setContent(''); // Clear editor content
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error editing note:', error);
      alert('Failed to edit the note. Please try again.');
    }
  };

  // Function to open the modal for editing a note
  const openEditModal = (note) => {
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setInitialContent(note.content); // Set the initial content for change detection

    // Ensure the editor instance is ready
    if (editor) {
      editor.commands.setContent(note.content);
    } else {
      // If the editor is not yet initialized, wait for it to be ready
      const interval = setInterval(() => {
        if (editor) {
          editor.commands.setContent(note.content);
          clearInterval(interval);
        }
      }, 100);
    }

    setIsModalOpen(true);
  };

  // Function to handle deleting a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      console.log('Note deleted successfully');
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Failed to delete the note. Please try again.');
    }
  };

  // Function to handle creating a new folder
  const handleAddFolder = async () => {
    if (!folderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    try {
      await addDoc(collection(db, 'folders'), {
        name: folderName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      setFolderName('');
      setIsFolderModalOpen(false);
    } catch (error) {
      console.error('Error adding folder:', error);
      alert('Failed to add the folder. Please try again.');
    }
  };

  // Function to handle renaming a folder
  const handleRenameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    try {
      const folderRef = doc(db, 'folders', editingFolder.id);
      await updateDoc(folderRef, {
        name: editFolderName,
        updatedAt: serverTimestamp(),
      });
      setEditingFolder(null);
      setEditFolderName('');
      setIsFolderModalOpen(false);
      console.log('Folder renamed successfully');
    } catch (error) {
      console.error('Error renaming folder:', error);
      alert('Failed to rename the folder. Please try again.');
    }
  };

  // Function to handle deleting a folder
  const handleDeleteFolder = async (folderId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this folder? This will move all its notes to Home.'
      )
    )
      return;

    try {
      // Move all notes from this folder to Home (folderId = null)
      const notesRef = collection(db, 'notes');
      const notesSnapshot = await getDocs(query(notesRef, where('folderId', '==', folderId)));

      const batch = writeBatch(db);
      notesSnapshot.forEach((docSnap) => {
        const noteRef = doc(db, 'notes', docSnap.id);
        batch.update(noteRef, { folderId: null });
      });
      await batch.commit();

      // Delete the folder
      await deleteDoc(doc(db, 'folders', folderId));
      console.log('Folder deleted and notes moved to Home successfully');
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete the folder. Please try again.');
    }
  };

  // Function to handle moving a note to a different folder
  const handleMoveNote = async (noteId, newFolderId) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { folderId: newFolderId || null });
      console.log(`Note ${noteId} moved to folder ${newFolderId || 'Home'}`);
    } catch (error) {
      console.error('Error moving note:', error);
      alert('Failed to move the note. Please try again.');
    }
  };

  // Image upload handlers
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      editor.chain().focus().setImage({ src: url, 'data-resizable-image': '' }).run();
    };
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Failed to upload the image. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      editor.chain().focus().setImage({ src: url, 'data-resizable-image': '' }).run();
    };
    reader.onerror = () => {
      console.error('Error reading file');
      alert('Failed to capture the image. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        // You can navigate the user to the login page if needed
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  // New State for Managing Expanded Collections in Sidebar
  const [expandedCollections, setExpandedCollections] = useState({});

  // Function to toggle collection collapse/expand
  const toggleCollection = (folderId) => {
    setExpandedCollections((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  return (
    <div className="notes-container">
      {/* Sidebar Implementation */}
      <div className="sidebar">
        <h2>Collections</h2>
        <button
          className="add-folder-button"
          onClick={() => {
            setIsFolderModalOpen(true);
            setEditingFolder(null);
            setEditFolderName('');
          }}
        >
          Add Collection
        </button>

        <ul className="collections-list">
          {/* Home Collection */}
          <li
            key="home"
            onClick={() => setSelectedFolder('')}
            className={!selectedFolder ? 'selected collection' : 'collection'}
          >
            <span className="collection-icon">🏠</span> {/* Home collection icon */}
            <span className="collection-name">Home</span>
            <ul className="notes-list-in-collection">
              {notes
                .filter((note) => !note.folderId)
                .map((note) => (
                  <li
                    key={note.id}
                    className={`note-title-item ${
                      editingNoteId === note.id ? 'active-note' : ''
                    }`}
                    onClick={() => openEditModal(note)}
                  >
                    {note.title}
                  </li>
                ))}
            </ul>
          </li>

          {/* Collections */}
          {folders.map((folder) => (
            <li key={folder.id} className="collection">
              <div
                className={`collection-header ${
                  selectedFolder === folder.id ? 'selected' : ''
                }`}
                onClick={() => {
                  setSelectedFolder(folder.id);
                  toggleCollection(folder.id);
                }}
              >
                <span className="collection-icon">📁</span>
                <span className="collection-name">{folder.name}</span>
                <span className="toggle-icon">
                  {expandedCollections[folder.id] ? '▲' : '▼'}
                </span>
                <button
                  className="collection-dots"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFolderDropdown(folder.id);
                    setIsFolderDropdownOpen((prev) =>
                      selectedFolderDropdown !== folder.id ? true : !prev
                    );
                  }}
                >
                  ⋮
                </button>
              </div>

              {/* Dropdown for Collection Actions */}
              {isFolderDropdownOpen && selectedFolderDropdown === folder.id && (
                <div className="collection-dropdown-container collection-management-dropdown show-dropdown">
                  <ul>
                    <li onClick={() => handleEditFolder(folder)}>Edit</li>
                    <li onClick={() => handleDeleteFolder(folder.id)}>Delete</li>
                  </ul>
                </div>
              )}

              {/* Notes in the Collection */}
              {expandedCollections[folder.id] && (
                <ul className="notes-list-in-collection">
                  {notes
                    .filter((note) => note.folderId === folder.id)
                    .map((note) => (
                      <li
                        key={note.id}
                        className={`note-title-item ${
                          editingNoteId === note.id ? 'active-note' : ''
                        }`}
                        onClick={() => openEditModal(note)}
                      >
                        {note.title}
                      </li>
                    ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Main Content Area */}
      <div className="main-content">
        {/* Profile Section */}
        <div className="profile-section">
          <div
            className="profile-icon"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            {user && user.photoURL ? (
              <img
                src={user.photoURL}
                alt="Profile"
                className="profile-picture"
              />
            ) : (
              <div className="profile-placeholder">P</div>
            )}
          </div>
          {isProfileDropdownOpen && (
            <div className="profile-dropdown">
              <ul>
                <li onClick={() => console.log('Profile settings clicked')}>
                  Profile Settings
                </li>
                <li onClick={handleLogout}>Logout</li>
              </ul>
            </div>
          )}
        </div>

        {/* Header */}
        <h1>My Notes</h1>

        {/* Add Note Button */}
        <button
          onClick={() => {
            openModal();
            setEditingNoteId(null);
            setEditTitle('');
            editor.commands.setContent('<p></p>'); // Clear editor content
          }}
        >
          Add Note
        </button>

        {/* Modal for Adding and Editing Folders */}
        <Modal
          isOpen={isFolderModalOpen}
          onRequestClose={() => {
            setIsFolderModalOpen(false);
            setEditingFolder(null);
            setEditFolderName('');
          }}
          contentLabel="Add/Edit Folder"
          className="modal-content"
          overlayClassName="ReactModal__Overlay"
        >
          <h2>{editingFolder ? 'Edit Collection' : 'Add a New Collection'}</h2>
          <input
            type="text"
            value={editingFolder ? editFolderName : folderName}
            onChange={(e) =>
              editingFolder ? setEditFolderName(e.target.value) : setFolderName(e.target.value)
            }
            placeholder="Collection Name"
            className="folder-input"
          />
          <div className="modal-buttons">
            <button
              className="save-button"
              onClick={editingFolder ? handleRenameFolder : handleAddFolder}
            >
              {editingFolder ? 'Save Changes' : 'Add Collection'}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setIsFolderModalOpen(false);
                setEditingFolder(null);
                setEditFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>

        {/* Modal for Adding and Editing Notes */}
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Add/Edit Note"
          className="modal-content"
          overlayClassName="ReactModal__Overlay"
        >
          <h2>{editingNoteId ? 'Edit Note' : 'Add a New Note'}</h2>
          <input
            type="text"
            ref={titleInputRef}
            value={editTitle}
            onChange={(e) => {
              if (e.target.value.length <= 40) {
                setEditTitle(e.target.value);
              }
            }}
            placeholder="Note Title"
            onKeyDown={handleTitleKeyDown}
            className="note-title-input"
          />
          {editTitle.length === 40 && <span>...</span>}

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
                } else {
                  editor.chain().focus().unsetColor().run();
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
                id="imageUpload"
              />
              <label htmlFor="imageUpload" title="Upload Image" className="image-upload-label">
                Upload Image
              </label>
              <input
                type="file"
                onChange={handleCameraCapture}
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                id="cameraCapture"
              />
              <label htmlFor="cameraCapture" title="Take Photo" className="image-upload-label">
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

          {/* Save and Cancel Buttons */}
          <div className="modal-buttons">
            <button
              className="save-button"
              onClick={editingNoteId ? handleEditNote : handleAddNote}
            >
              {editingNoteId ? 'Save Changes' : 'Save Note'}
            </button>
            <button
              className="cancel-button"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>

        {/* Notes List Section */}
        <div className="notes-section">
          <h2>
            {selectedFolder
              ? `Collection: ${folders.find((f) => f.id === selectedFolder)?.name || ''}`
              : 'Home'}
          </h2>
          {notes.filter((note) => selectedFolder === '' || note.folderId === selectedFolder).length === 0 ? (
            <p>No notes in this {selectedFolder ? 'collection' : 'home'}.</p>
          ) : (
            <ul className="notes-list">
              {notes
                .filter((note) => selectedFolder === '' || note.folderId === selectedFolder)
                .map((note) => (
                  <li className="note-card" key={note.id}>
                    <h4 className="note-title">{note.title}</h4>
                    <div className="note-preview">
                      {getPreviewContent(note.content)}
                    </div>
                    <p>
                      <small>
                        Created:{' '}
                        {note.createdAt?.toDate().toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </small>
                    </p>
                    {note.updatedAt && (
                      <p>
                        <small>
                          Updated:{' '}
                          {note.updatedAt.toDate().toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                      </p>
                    )}
                    <button
                      className="edit-button"
                      onClick={() => openEditModal(note)}
                    >
                      Edit
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => handleDeleteNote(note.id)}
                    >
                      Delete
                    </button>
                    <div className="move-note-section">
                      <label htmlFor={`move-note-${note.id}`}>Move to:</label>
                      <select
                        id={`move-note-${note.id}`}
                        value={note.folderId || ''}
                        onChange={(e) => handleMoveNote(note.id, e.target.value)}
                        className="move-note-select"
                      >
                        <option value="">Home</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesPage;
