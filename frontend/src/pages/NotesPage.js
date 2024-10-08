// NotesPage.js

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
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
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
import NoteEditor from '../components/NoteEditor.js';
import Sidebar from '../components/Sidebar.js';

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
import { DragDropContext } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';

Modal.setAppElement('#root');

const NotesPage = () => {
  const [textColor, setTextColor] = useState('');
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderName, setFolderName] = useState('');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [editFolderName, setEditFolderName] = useState('');
  const titleInputRef = useRef(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const auth = getAuth();
  const navigate = useNavigate();

  // Dropdown state for folders
  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [selectedFolderDropdown, setSelectedFolderDropdown] = useState(null);

  // Dropdown state for notes
  const [isNoteDropdownOpen, setIsNoteDropdownOpen] = useState(false);
  const [selectedNoteDropdown, setSelectedNoteDropdown] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  // State to track the active note
  const [activeNote, setActiveNote] = useState(null);

  // Handler to edit a folder
  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsFolderModalOpen(true);
    setIsFolderDropdownOpen(false);
  };

  // Function to open the Add Folder Modal
  const openAddFolderModal = () => {
    setIsFolderModalOpen(true);
    setEditingFolder(null);
    setEditFolderName('');
    setFolderName('');
  };

  // Function to handle adding a new note
  const handleAddNote = () => {
    if (!editor) return;

    // Generate a new note object
    const newNote = {
      id: null, // Will be set after saving to Firestore
      title: '',
      content: '',
      folderId: selectedFolder || null,
      userId: user.uid,
      createdAt: null,
      updatedAt: null,
    };

    setActiveNote(newNote);
    editor.commands.setContent('<h1></h1><p></p>'); // Initialize with empty title and paragraph
    console.log('New note initialized.');
  };

  // Function to handle adding a new folder
  const handleAddFolder = async () => {
    if (!folderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'folders'), {
        name: folderName,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      console.log('New folder added:', folderName, 'with ID:', docRef.id);
      setFolderName('');
      setIsFolderModalOpen(false);
    } catch (error) {
      console.error('Error adding folder:', error.message, error.code, error);
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
      console.log('Folder renamed successfully:', editFolderName);
      setEditingFolder(null);
      setEditFolderName('');
      setIsFolderModalOpen(false);
    } catch (error) {
      console.error('Error renaming folder:', error.message, error.code, error);
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
      console.log('All notes moved to Unassigned.');

      // Delete the folder
      await deleteDoc(doc(db, 'folders', folderId));
      console.log('Folder deleted successfully:', folderId);
    } catch (error) {
      console.error('Error deleting folder:', error.message, error.code, error);
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
      console.error('Error moving note:', error.message, error.code, error);
      alert('Failed to move the note. Please try again.');
    }
  };

  // TipTap editor setup with advanced features
  const editor = useEditor({
    extensions: [
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
    content: '<h1></h1><p></p>',
    editorProps: {
      attributes: {
        class: 'editor-content',
        'data-placeholder': 'Start typing here...',
      },
      onUpdate: ({ editor }) => {
        const editorElement = editor.view.dom;

        const headings = editorElement.querySelectorAll('h1, h2');
        headings.forEach((heading) => {
          if (heading.textContent.trim() === '') {
            heading.classList.add('is-empty');
          } else {
            heading.classList.remove('is-empty');
          }
        });

        const paragraphs = editorElement.querySelectorAll('p');
        paragraphs.forEach((p) => {
          if (p.textContent.trim() === '') {
            p.classList.add('is-empty');
          } else {
            p.classList.remove('is-empty');
          }
        });
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Tab') {
          event.preventDefault();

          if (editor.isActive('listItem')) {
            // If inside a list item, indent or outdent
            if (event.shiftKey) {
              // If Shift+Tab, outdent
              editor.commands.liftListItem('listItem');
            } else {
              // If Tab, indent
              editor.commands.sinkListItem('listItem');
            }
          } else {
            // For regular paragraphs, insert a tab character
            editor.commands.command(({ tr, state }) => {
              const { selection } = state;
              tr.insertText('\t', selection.from, selection.to);
              return true;
            });
          }
          return true;
        }
        return false;
      },

      handlePaste: (view, event) => {
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

      editor.on('selectionUpdate', updateTextColor);
      editor.on('transaction', updateTextColor);

      // Auto-save handler with debouncing
      const saveTimeout = { current: null };

      const handleAutoSave = () => {
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
        saveTimeout.current = setTimeout(() => {
          handleSaveNote();
        }, 1000); // Debounce interval: 1 second
      };

      editor.on('update', handleAutoSave);

      return () => {
        editor.off('selectionUpdate', updateTextColor);
        editor.off('transaction', updateTextColor);
        editor.off('update', handleAutoSave);
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
      };
    }
  }, [editor, activeNote]); // Added activeNote to dependencies

  // Enhanced error logging and authentication check
  const handleSaveNote = async () => {
    if (!editor) {
      console.warn('Editor instance is not available.');
      return;
    }

    if (!user || !user.uid) {
      console.error('User is not authenticated.');
      return;
    }

    const htmlContent = editor.getHTML();
    console.log('Autosave triggered. Current content:', htmlContent);

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

    console.log('Determined title:', title);

    // Check if content is empty
    if (!htmlContent.trim()) {
      // If content is empty and it's a new note, do not save
      if (!activeNote || !activeNote.id) {
        console.log('Active note is new and empty. Not saving.');
        return;
      }
      // If content is empty and it's an existing note, delete it without confirmation
      console.log('Active note exists but content is empty. Deleting note:', activeNote.id);
      await handleDeleteNote(activeNote.id, false);
      return;
    }

    try {
      if (activeNote && activeNote.id) {
        // Editing an existing note
        const noteRef = doc(db, 'notes', activeNote.id);
        await updateDoc(noteRef, {
          title: title,
          content: htmlContent,
          updatedAt: serverTimestamp(),
        });
        console.log('Existing note updated:', activeNote.id);

        // Update the activeNote state
        const updatedNote = {
          ...activeNote,
          title,
          content: htmlContent,
          updatedAt: new Date(), // Approximate client-side timestamp
        };
        setActiveNote(updatedNote);
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
        console.log('New note added with ID:', docRef.id);

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
      }
    } catch (error) {
      console.error('Error saving note:', error.message, error.code, error);
      alert('Failed to save the note. Please try again.');
    }
  };

  // Function to open a note for viewing/editing
  const openNote = (note) => {
    setActiveNote(note);
    if (editor) {
      editor.commands.setContent(note.content);
      console.log('Opened note:', note.id);
    }
  };

  // Function to handle deleting a note
  const handleDeleteNote = async (noteId, requireConfirmation = true) => {
    if (requireConfirmation) {
      if (!window.confirm('Are you sure you want to delete this note?')) return;
    }

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      console.log('Note deleted successfully:', noteId);
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(null);
        if (editor) {
          editor.commands.setContent('<h1></h1><p></p>'); // Reset to empty title and paragraph
          console.log('Editor content reset after deletion.');
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error.message, error.code, error);
      alert('Failed to delete the note. Please try again.');
    }
  };

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

  // Image upload handlers
  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      editor
        .chain()
        .focus()
        .setImage({ src: url, width: 'auto', height: 'auto', 'data-resizable-image': '' })
        .run();
      console.log('Image uploaded:', url);
    };
    reader.onerror = () => {
      console.error('Error reading file for upload.');
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
      editor
        .chain()
        .focus()
        .setImage({ src: url, width: 'auto', height: 'auto', 'data-resizable-image': '' })
        .run();
      console.log('Camera image captured:', url);
    };
    reader.onerror = () => {
      console.error('Error reading file from camera capture.');
      alert('Failed to capture the image. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        // Navigate to login page if needed
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out:', error.message, error.code, error);
      });
  };

  // Drag and Drop Handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    try {
      await handleMoveNote(draggableId, destination.droppableId);
    } catch (error) {
      console.error('Error moving note:', error.message, error.code, error);
      alert('Failed to move the note. Please try again.');
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="notes-container">
        {/* Hamburger Icon for Sidebar Toggle */}
        <button
          className="sidebar-toggle-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
          aria-expanded={isSidebarOpen}
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
                    setIsProfileDropdownOpen(false);
                    navigate('/profile');
                  }}
                >
                  Profile Settings
                </li>
                <li
                  onClick={() => {
                    setIsProfileDropdownOpen(false);
                    handleLogout();
                  }}
                >
                  Logout
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar Component */}
        <Sidebar
          folders={folders}
          handleEditFolder={handleEditFolder}
          handleDeleteFolder={handleDeleteFolder}
          handleAddNote={handleAddNote}
          openAddFolderModal={openAddFolderModal}
          openNote={openNote}
          notes={notes}
          activeNote={activeNote}
          selectedFolder={selectedFolder}
          setSelectedFolder={setSelectedFolder}
          isFolderDropdownOpen={isFolderDropdownOpen}
          setIsFolderDropdownOpen={setIsFolderDropdownOpen}
          selectedFolderDropdown={selectedFolderDropdown}
          setSelectedFolderDropdown={setSelectedFolderDropdown}
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          selectedNoteDropdown={selectedNoteDropdown}
          setSelectedNoteDropdown={setSelectedNoteDropdown}
          isNoteDropdownOpen={isNoteDropdownOpen}
          setIsNoteDropdownOpen={setIsNoteDropdownOpen}
          handleDeleteNote={handleDeleteNote}
        />

        {/* NoteEditor Component */}
        <NoteEditor
          activeNote={activeNote}
          editor={editor}
          textColor={textColor}
          colorOptions={colorOptions}
          handleImageUpload={handleImageUpload}
          handleCameraCapture={handleCameraCapture}
        />

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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  editingFolder ? handleRenameFolder() : handleAddFolder();
                }
              }}
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
