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
import StarterKit from '@tiptap/starter-kit'; // Use StarterKit for essential functionalities
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
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import Code from '@tiptap/extension-code';
import TextStyle from '@tiptap/extension-text-style';
import { getAuth, signOut } from 'firebase/auth';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom

Modal.setAppElement('#root'); // Accessibility requirement for the modal

const NotesPage = () => {
  const [textColor, setTextColor] = useState('');
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderName, setFolderName] = useState('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false); // For Folder Modal
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [initialContent, setInitialContent] = useState('');
  
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const titleInputRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate(); // Initialize navigate

  // Dropdown state for folders
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [selectedFolderDropdown, setSelectedFolderDropdown] = useState(null);

  // Dropdown state for notes
  const [isNoteDropdownOpen, setIsNoteDropdownOpen] = useState(false);
  const [selectedNoteDropdown, setSelectedNoteDropdown] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // For Sidebar Toggle

  const colorOptions = [
    { name: 'Color', color: '' },
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

  // Handler to edit a folder
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
      // StarterKit includes essential extensions like Paragraph, Heading, etc.
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
      }),
      Gapcursor,
      Highlight,
      Color,
      TextStyle,
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      CodeBlock.configure({
        HTMLAttributes: {
          class: 'code-block',
        },
      }),
      ResizableImage,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Blockquote,
      HorizontalRule,
      Code,
      CustomHeading,
      CustomParagraph,
    ],
    content: '',
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

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // Move focus to the editor
      editor?.commands.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close folder dropdown if clicking outside
      if (isFolderDropdownOpen && !event.target.closest('.folder-dropdown-container')) {
        setIsFolderDropdownOpen(false);
        setSelectedFolderDropdown(null);
      }

      // Close note dropdown if clicking outside
      if (isNoteDropdownOpen && !event.target.closest('.note-dropdown-container')) {
        setIsNoteDropdownOpen(false);
        setSelectedNoteDropdown(null);
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Clean up the event listener
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isFolderDropdownOpen, isNoteDropdownOpen]);

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

  // State to track the active note
  const [activeNote, setActiveNote] = useState(null);

  // Function to handle adding a new note
  const handleAddNote = async () => {
    if (!editor) return;

    // Generate a new note object
    const newNote = {
      id: null, // Will be set after Firestore
      title: '',
      content: '',
      folderId: selectedFolder || null,
      userId: user.uid,
      createdAt: null,
      updatedAt: null,
    };

    setActiveNote(newNote);
    setEditingNoteId(null);
    setEditTitle('');
    if (editor) {
      editor.commands.setContent('<h1></h1>'); // Initialize with an empty heading
    }
  };

  // Function to handle saving a new or edited note
  const handleSaveNote = async () => {
    if (!editor) return;

    const htmlContent = editor.getHTML();

    // Extract the first heading as the title
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const heading = tempDiv.querySelector('h1, h2');
    let title = heading ? heading.textContent.trim() : '';

    if (!title) {
      // Generate title from content by replacing line breaks with spaces
      const textContent = tempDiv.textContent.replace(/\n/g, ' ').trim();
      if (textContent.length > 0) {
        title = textContent.substring(0, 40);
      } else {
        title = 'Untitled Note';
      }
    }

    // Check if content is empty
    if (!htmlContent.trim()) {
      alert("Content can't be empty");
      return;
    }

    try {
      if (activeNote.id) {
        // Editing an existing note
        const noteRef = doc(db, 'notes', activeNote.id);
        await updateDoc(noteRef, {
          title: title,
          content: htmlContent,
          updatedAt: serverTimestamp(),
        });

        // Update the activeNote state
        const updatedNote = {
          ...activeNote,
          title,
          content: htmlContent,
          updatedAt: new Date(), // Approximate client-side timestamp
        };
        setActiveNote(updatedNote);
        setEditingNoteId(null);
        setEditTitle('');
      } else {
        // Adding a new note
        const docRef = await addDoc(collection(db, 'notes'), {
          title: title,
          content: htmlContent,
          folderId: selectedFolder || null,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: null,
        });

        // Create a new note object
        const createdNote = {
          id: docRef.id,
          title,
          content: htmlContent,
          folderId: selectedFolder || null,
          userId: user.uid,
          createdAt: new Date(), // Approximate client-side timestamp
          updatedAt: null,
        };

        // Set the new note as active
        setActiveNote(createdNote);
        setEditingNoteId(docRef.id);
        setEditTitle('');
      }
    } catch (error) {
      console.error('Error saving note:', error);
      alert('Failed to save the note. Please try again.');
    }
  };

  // Function to open a note for viewing/editing
  const openNote = (note) => {
    setActiveNote(note);
    setEditingNoteId(note.id);
    setEditTitle(note.title);
    setInitialContent(note.content);
    if (editor) {
      editor.commands.setContent(note.content);
    }
  };

  // Function to handle deleting a note
  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(null);
        setEditingNoteId(null);
        setEditTitle('');
        if (editor) {
          editor.commands.setContent('');
        }
      }
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
        'Are you sure you want to delete this folder? This will move all its notes to Unassigned.'
      )
    )
      return;

    try {
      // Move all notes from this folder to Unassigned (folderId = null)
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
      console.log('Folder deleted and notes moved successfully');
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
      console.log(`Note ${noteId} moved to folder ${newFolderId || 'Unassigned'}`);
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

  // Drag and Drop Handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) {
      return;
    }

    // If dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move the note
    try {
      await handleMoveNote(draggableId, destination.droppableId);
    } catch (error) {
      console.error('Error moving note:', error);
      alert('Failed to move the note. Please try again.');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className={`notes-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Hamburger Icon for Sidebar Toggle */}
        <button
          className="sidebar-toggle-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
        >
          ☰
        </button>

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
        <li
          onClick={() => {
            setIsProfileDropdownOpen(false); // Close dropdown
            navigate('/profile'); // Navigate to the profile page
          }}
        >
          Profile Settings
        </li>
        <li
          onClick={() => {
            setIsProfileDropdownOpen(false); // Close dropdown
            handleLogout(); // Call the logout function
          }}
        >
          Logout
        </li>
      </ul>
    </div>
  )}
</div>

        {/* Collections Sidebar */}
        <div className={`collections-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
          <h2>Collections</h2>
          {/* Add Folder Modal Trigger */}
          <button
            className="add-folder-button"
            onClick={() => {
              setIsFolderModalOpen(true);
              setEditingFolder(null);
              setEditFolderName('');
              setFolderName('');
            }}
            title="Add Collection"
          >
            Add Collection
          </button>

          <ul className="folders-list">
  {folders.map((folder) => (
    <li key={folder.id} className="folder-item">
      {/* Folder Header Container */}
      <div
        className="folder-header"
        onClick={() => setSelectedFolder(selectedFolder === folder.id ? '' : folder.id)}
      >
        {/* Folder Toggle Arrow (at the far left) */}
        <span className="folder-toggle">
          {selectedFolder === folder.id ? '▼' : '▲'}
        </span>

        {/* Folder Name */}
        <span className="folder-name">{folder.name}</span>

        {/* Plus Icon for Adding Note within Collection */}
        <button
          className="add-note-icon"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering folder toggle when clicking this button
            handleAddNote(); // Open the editor for a new note
            setSelectedFolder(folder.id);
          }}
          title="Add Note"
        >
          +
        </button>

        {/* Three-Dot Menu Button */}
        <button
          className="folder-dots"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering folder toggle when clicking this button
            setSelectedFolderDropdown(
              selectedFolderDropdown === folder.id ? null : folder.id
            );
            setIsFolderDropdownOpen(selectedFolderDropdown !== folder.id);
          }}
          aria-label="Folder Options"
        >
          ⋮
        </button>
      </div>

      {/* Dropdown for Folder Actions */}
      {isFolderDropdownOpen && selectedFolderDropdown === folder.id && (
        <div className="folder-dropdown-container folder-management-dropdown show-dropdown">
          <ul>
            <li onClick={() => handleEditFolder(folder)}>Edit</li>
            <li onClick={() => handleDeleteFolder(folder.id)}>Delete</li>
          </ul>
        </div>
                )}

                {/* Notes List within Collection */}
                {selectedFolder === folder.id && (
                  <Droppable droppableId={folder.id}>
                    {(provided) => (
                      <ul
                        className="notes-list"
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {notes
                          .filter((note) => note.folderId === folder.id)
                          .map((note, index) => (
                            <Draggable
                              key={note.id}
                              draggableId={note.id}
                              index={index}
                            >
                              {(provided) => (
                                <li
                                  className={`note-title-item ${activeNote && activeNote.id === note.id ? 'active-note' : ''}`}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <span
                                    className="note-title"
                                    onClick={() => openNote(note)}
                                  >
                                    {note.title}
                                  </span>
                                  {/* 3-Dot Dropdown for Notes */}
                                  <button
                                    className="note-dots"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedNoteDropdown(
                                        selectedNoteDropdown === note.id
                                          ? null
                                          : note.id
                                      );
                                      setIsNoteDropdownOpen(
                                        selectedNoteDropdown !== note.id
                                      );
                                    }}
                                    aria-label="Note Options"
                                  >
                                    ⋮
                                  </button>

                                  {/* Dropdown for Note Actions */}
                                  {isNoteDropdownOpen &&
                                    selectedNoteDropdown === note.id && (
                                      <div className="note-dropdown-container note-management-dropdown show-dropdown">
                                        <ul>
                                          <li onClick={() => openNote(note)}>
                                            Edit
                                          </li>
                                          <li onClick={() => handleDeleteNote(note.id)}>
                                            Delete
                                          </li>
                                        </ul>
                                      </div>
                                    )}
                                </li>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </ul>
                    )}
                  </Droppable>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Note Viewing and Editing Section */}
        <div className="note-view-section">
          {activeNote ? (
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

              {/* Save and Cancel Buttons */}
              <div className="editor-buttons">
                <button
                  className="save-button"
                  onClick={handleSaveNote}
                >
                  {activeNote.id ? 'Save Changes' : 'Save Note'}
                </button>
                <button
                  className="cancel-button"
                  onClick={() => {
                    setActiveNote(null);
                    setEditingNoteId(null);
                    setEditTitle('');
                    if (editor) {
                      editor.commands.setContent('');
                    }
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="no-note-selected">
              <p>Select a note to view and edit its content.</p>
            </div>
          )}
        </div>

        {/* Add/Edit Folder Modal */}
        <Modal
          isOpen={isFolderModalOpen}
          onRequestClose={() => {
            setIsFolderModalOpen(false);
            setEditingFolder(null);
            setEditFolderName('');
            setFolderName('');
          }}
          contentLabel="Add/Edit Folder"
          className="modal-content"
          overlayClassName="ReactModal__Overlay"
        >
          <h2>{editingFolder ? 'Edit Collection' : 'Add Collection'}</h2>
          <div className="folder-modal-content">
            <input
              type="text"
              placeholder="Folder Name"
              value={editingFolder ? editFolderName : folderName}
              onChange={(e) => {
                if (editingFolder) {
                  setEditFolderName(e.target.value);
                } else {
                  setFolderName(e.target.value);
                }
              }}
              onKeyDown={handleTitleKeyDown}
              ref={titleInputRef}
              className="folder-name-input"
            />
          </div>
          <div className="modal-buttons">
            <button
              className="save-button"
              onClick={editingFolder ? handleRenameFolder : handleAddFolder}
            >
              {editingFolder ? 'Save Changes' : 'Add Folder'}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setIsFolderModalOpen(false);
                setEditingFolder(null);
                setEditFolderName('');
                setFolderName('');
              }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      </div>
    </DragDropContext>
  );
};

export default NotesPage;
