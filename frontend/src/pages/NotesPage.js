// src/pages/NotesPage.js

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
  getDoc,
  orderBy,
  limit,
  startAfter,
  setDoc,
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthProvider';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Highlight from '@tiptap/extension-highlight';
import BulletList from '@tiptap/extension-bullet-list';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import Gapcursor from '@tiptap/extension-gapcursor';
import ResizableImage from '../extensions/ResizableImage';
import Placeholder from '@tiptap/extension-placeholder';
import './styling/NotesPage.css';
import NoteEditor from '../components/NoteEditor.js';
import Sidebar from '../components/Sidebar.js';
import FloatingToolbar from '../components/FloatingToolbar.js';
import CustomHeading from '../extensions/CustomHeading';
import CustomParagraph from '../extensions/CustomParagraph';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Blockquote from '@tiptap/extension-blockquote';
import HorizontalRule from '@tiptap/extension-horizontal-rule';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { getAuth, signOut, updateProfile } from 'firebase/auth';
import { DragDropContext } from 'react-beautiful-dnd';
import { useNavigate, useParams } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ClipLoader } from 'react-spinners';
import Header from '../components/Header';
import OfflineAlert from '../components/OfflineAlert';
import SaveIndicator from '../components/SaveIndicator';
import FolderModal from '../components/FolderModal';
import NoteView from '../components/NoteView';
import PasteHandler from '../extensions/PasteHandler';
import useOnlineStatus from '../hooks/useOnlineStatus';
import Breadcrumbs from '../components/Breadcrumbs.js';

// Import the compressImage utility
import { compressImage } from '../utils/imageCompression';

// Import the CustomCodeBlock extension
import CustomCodeBlock from '../extensions/CustomCodeBlock';

Modal.setAppElement('#root'); // Important for accessibility

const NotesPage = () => {
  const [textColor, setTextColor] = useState('');
  const { user } = useAuth();
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
  const { folderId, noteId } = useParams(); // Get folderId and noteId from URL

  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [selectedFolderDropdown, setSelectedFolderDropdown] = useState(null);

  const [isNoteDropdownOpen, setIsNoteDropdownOpen] = useState(false);
  const [selectedNoteDropdown, setSelectedNoteDropdown] = useState(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [activeNote, setActiveNote] = useState(null);

  // Integrate the useOnlineStatus hook
  const { isOnline, setOfflineQueue } = useOnlineStatus();

  const sidebarRef = useRef(null);

  const storage = getStorage();

  const [isSaved, setIsSaved] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // States for per-folder pagination and loading
  const [notesData, setNotesData] = useState({});
  const [perFolderLoadingNotes, setPerFolderLoadingNotes] = useState({});
  const [perFolderHasMoreNotes, setPerFolderHasMoreNotes] = useState({});
  const [lastVisibleNote, setLastVisibleNote] = useState({});

  // New loading states
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Pagination Limits
  const initialLimit = 10;
  const loadMoreLimit = 10;

  // Editor setup with PasteHandler and Placeholder integration
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2],
        },
        codeBlock: false, // Disable default code block to use custom configuration
      }),
      // Use the imported CustomCodeBlock extension
      CustomCodeBlock,
      Gapcursor,
      Bold,
      Italic,
      Underline,
      Strike,
      BulletList,
      OrderedList,
      ListItem,
      ResizableImage,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'customCodeBlock', 'blockquote'],
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
      Blockquote,
      HorizontalRule,
      CustomHeading,
      CustomParagraph,
      PasteHandler, // Ensure this extension doesn't interfere
      // Add Placeholder extension
      Placeholder.configure({
        placeholder: ({ node, editor }) => {
          // Show placeholder on empty paragraphs, headings, and custom code blocks
          if (
            node.type.name === 'paragraph' ||
            node.type.name === 'heading' ||
            node.type.name === 'customCodeBlock'
          ) {
            return 'Start typing here...';
          }
          return '';
        },
        showOnlyWhenEditable: true,
      }),
    ],
      content: '<h1></h1>',
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
            if (event.shiftKey) {
              editor.commands.liftListItem('listItem');
            } else {
              editor.commands.sinkListItem('listItem');
            }
          } else {
            editor.commands.command(({ tr, state }) => {
              const { selection } = state;
              tr.insertText('\u00A0\u00A0\u00A0\u00A0', selection.from, selection.to);
              return true;
            });
          }
          return true;
        }
        return false;
      },
    },
  });

  // Debounce function implementation
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Define handleSaveNote before it's used
  const handleSaveNote = async () => {
    if (!editor) {
      console.warn('Editor instance is not available.');
      return;
    }

    if (!user || !user.uid) {
      console.error('User is not authenticated.');
      return;
    }

    if (!activeNote) {
      console.warn('No active note to save.');
      return;
    }

    const htmlContent = editor.getHTML();
    console.log('Autosave triggered. Current content:', htmlContent);

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlContent;

    const heading = tempDiv.querySelector('h1, h2');
    let title = heading ? heading.textContent.trim() : '';

    if (!title) {
      const textContent = tempDiv.textContent.replace(/\n/g, ' ').trim();
      if (textContent.length > 0) {
        title = textContent.substring(0, 40);
      } else {
        title = 'Untitled Note';
      }
    }

    console.log('Determined title:', title);

    const isContentEmpty = tempDiv.textContent.trim() === '';

    if (isContentEmpty) {
      // Optionally, prompt the user or handle it elsewhere
      return;
    }

    const saveNoteToFirestore = async () => {
      try {
        if (activeNote && activeNote.id) {
          const noteRef = doc(db, 'notes', activeNote.id);
          await updateDoc(noteRef, {
            title: title,
            content: htmlContent,
            updatedAt: serverTimestamp(),
          });
          console.log('Note updated:', activeNote.id);

          setIsSaved(true);
          setHasUnsavedChanges(false);

          // Update the note in the state
          setNotesData((prevNotes) => {
            const folderId = activeNote.folderId || 'unassigned';
            const folderNotes = prevNotes[folderId] || [];
            const updatedNotes = folderNotes.map((note) =>
              note.id === activeNote.id ? { ...note, title, updatedAt: new Date() } : note
            );
            return {
              ...prevNotes,
              [folderId]: updatedNotes,
            };
          });
        } else {
          console.warn('Active note does not have an ID.');
        }
      } catch (error) {
        console.error('Error saving note:', error);
        alert('Failed to save the note. Please try again.');
      }
    };

    if (isOnline) {
      await saveNoteToFirestore();
    } else {
      setOfflineQueue((prevQueue) => [...prevQueue, saveNoteToFirestore]);
      console.log('Save action queued due to offline status.');
      setIsSaved(true);
    }
  };

  // Handle editor updates with debounce to prevent rapid multiple saves
  useEffect(() => {
    if (editor) {
      const updateTextColor = () => {
        const color = editor.getAttributes('textStyle').color || '';
        setTextColor(color);
      };

      editor.on('selectionUpdate', updateTextColor);
      editor.on('transaction', updateTextColor);

      // Debounced autosave to prevent multiple rapid saves
      const handleAutoSave = debounce(() => {
        if (activeNote) {
          handleSaveNote();
          setIsSaved(false);
          setHasUnsavedChanges(true);
        }
      }, 1000); // 1-second delay

      editor.on('update', handleAutoSave);

      return () => {
        editor.off('selectionUpdate', updateTextColor);
        editor.off('transaction', updateTextColor);
        editor.off('update', handleAutoSave);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, activeNote]);

  // State for Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: '', // 'closeNote', 'switchNote', 'deleteNote', 'deleteFolder'
    action: null,
    message: '',
  });

  // Function to open the confirmation modal
  const openConfirmModal = (type, action, message) => {
    setModalContent({ type, action, message });
    setIsConfirmModalOpen(true);
  };

  // Function to close the confirmation modal
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setModalContent({ type: '', action: null, message: '' });
  };

  // Handle confirmation action
  const handleConfirm = () => {
    if (modalContent.action) {
      modalContent.action();
    }
    closeConfirmModal();
  };

  // **Define handleDeleteNote before it's used**
  const handleDeleteNote = async (noteId) => {
    console.log('handleDeleteNote called for note:', noteId);

    if (isOnline) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
        console.log('Note deleted successfully:', noteId);
        setNotesData((prevNotes) => {
          // Find the folder containing this note
          const folderId = Object.keys(prevNotes).find((fid) =>
            prevNotes[fid].some((note) => note.id === noteId)
          );
          if (folderId) {
            const updatedNotes = prevNotes[folderId].filter((note) => note.id !== noteId);
            return {
              ...prevNotes,
              [folderId]: updatedNotes,
            };
          }
          return prevNotes;
        });
        if (activeNote && activeNote.id === noteId) {
          setActiveNote(null);
          if (editor) {
            editor.commands.setContent('<h1></h1>');
            console.log('Editor content reset after deletion.');
          }
        }
      } catch (error) {
        console.error('Error deleting note:', error.message, error.code, error);
        alert('Failed to delete the note. Please try again.');
      }
    } else {
      setOfflineQueue((prevQueue) => [
        ...prevQueue,
        () => deleteDoc(doc(db, 'notes', noteId)),
      ]);
      alert('Delete action queued due to offline status.');
    }
  };

  // Function to close a note and handle empty note deletion
  const closeNote = async () => {
    if (hasUnsavedChanges) {
      // Keep the confirmation modal for unsaved changes
      openConfirmModal(
        'closeNote',
        async () => {
          await handleSaveNote();
          setHasUnsavedChanges(false);
          proceedToCloseNote();
        },
        'You have unsaved changes. Do you want to save them before closing?'
      );
    } else {
      proceedToCloseNote();
    }
  };

  const proceedToCloseNote = async () => {
    if (activeNote) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editor.getHTML();
      const isContentEmpty = tempDiv.textContent.trim() === '';

      if (isContentEmpty) {
        try {
          await deleteDoc(doc(db, 'notes', activeNote.id));
          console.log('Empty note deleted:', activeNote.id);
          setNotesData((prevNotes) => {
            const folderId = activeNote.folderId || 'unassigned';
            const updatedNotes = prevNotes[folderId].filter(
              (note) => note.id !== activeNote.id
            );
            return {
              ...prevNotes,
              [folderId]: updatedNotes,
            };
          });
          setActiveNote(null);
          if (editor) {
            editor.commands.setContent('<h1></h1>');
          }
        } catch (error) {
          console.error('Error deleting empty note:', error);
          alert('Failed to delete the empty note. Please try again.');
        }
      } else {
        setActiveNote(null);
        if (editor) {
          editor.commands.setContent('<h1></h1>');
        }
      }
    }
  };

  // Open note function with navigation to URL
  const openNote = async (note) => {
    if (hasUnsavedChanges) {
      openConfirmModal(
        'switchNote',
        async () => {
          await handleSaveNote();
          setHasUnsavedChanges(false);
          proceedToOpenNote(note);
        },
        'You have unsaved changes. Do you want to save them before opening another note?'
      );
    } else {
      proceedToOpenNote(note);
    }
  };

  // **Function to navigate to the note's URL**
  const proceedToOpenNote = async (note) => {
    try {
      // Navigate to the note's URL with folderId and noteId
      navigate(`/notes/${note.folderId || 'unassigned'}/${note.id}`);
    } catch (error) {
      console.error('Error navigating to note:', error);
    }
  };

  // **Fetch note data when URL parameters change**
  useEffect(() => {
    if (noteId) {
      fetchNoteById(noteId, folderId);
    } else {
      // If no noteId, reset activeNote and editor content
      setActiveNote(null);
      if (editor) {
        editor.commands.setContent('<h1></h1>');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId, folderId]);

  // **Function to fetch note by ID and verify folder association**
  const fetchNoteById = async (noteId, folderId) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      const noteSnap = await getDoc(noteRef);

      if (noteSnap.exists()) {
        const noteData = noteSnap.data();

        // Check if the note belongs to the specified folder
        if ((noteData.folderId || 'unassigned') !== folderId) {
          console.error("Folder ID does not match note's folder ID.");
          alert('This note does not belong to the specified folder.');
          navigate('/notes');
          return;
        }

        const fullNote = {
          id: noteSnap.id,
          title: noteData.title,
          content: noteData.content,
          folderId: noteData.folderId || 'unassigned',
          userId: noteData.userId,
          createdAt: noteData.createdAt ? noteData.createdAt.toDate() : new Date(),
          updatedAt: noteData.updatedAt ? noteData.updatedAt.toDate() : null,
        };
        setActiveNote(fullNote);
        if (editor) {
          editor.commands.setContent(fullNote.content || '<h1></h1>');
          console.log('Opened note:', fullNote.id);
        }

        if (window.innerWidth <= 768) {
          setIsSidebarOpen(false);
        }

        setIsSaved(true);
        setSelectedFolder(fullNote.folderId); // Set the selectedFolder based on URL
      } else {
        console.error('Note does not exist:', noteId);
        alert('The selected note does not exist.');
        setActiveNote(null);
        if (editor) {
          editor.commands.setContent('<h1></h1>');
        }
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      alert('Failed to open the note. Please try again.');
    }
  };

  // Fetch folders
  useEffect(() => {
    if (!user) return;

    const fetchAndEnsureUnassignedFolder = async () => {
      try {
        // Query folders belonging to the authenticated user
        const foldersQuery = query(collection(db, 'folders'), where('userId', '==', user.uid));

        const unsubscribeFolders = onSnapshot(
          foldersQuery,
          async (snapshot) => {
            let foldersData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            setFolders(foldersData);
            console.log('Folders fetched:', foldersData.length);

            // Ensure 'Unassigned' folder is always present
            if (!foldersData.some((folder) => folder.id === 'unassigned')) {
              console.warn("'Unassigned' folder is missing. Creating it.");
              await setDoc(doc(db, 'folders', 'unassigned'), {
                name: 'Unassigned',
                userId: user.uid,
                createdAt: serverTimestamp(),
              });
              console.log("'Unassigned' folder created.");
            }
          },
          (error) => {
            console.error('Error fetching folders:', error);
            alert('Failed to fetch folders. Please try again.');
          }
        );

        // Cleanup on unmount
        return () => {
          unsubscribeFolders();
        };
      } catch (error) {
        console.error('Error ensuring Unassigned folder:', error);
        alert('Failed to ensure the Unassigned folder exists.');
      }
    };

    fetchAndEnsureUnassignedFolder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch notes when selectedFolder changes or when folderId from URL changes
  useEffect(() => {
    if (!selectedFolder) return;

    // Fetch notes for the selected folder
    fetchNotesForFolder(selectedFolder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFolder, folders]);

  // **Function to fetch notes for a folder**
  const fetchNotesForFolder = async (folderId) => {
    // If notes for the selected folder are already fetched, do not fetch again
    if (notesData[folderId]) {
      console.log(`Notes for folder ${folderId} already fetched.`);
      return;
    }

    // Fetch notes for the selected folder
    const fetchNotesForFolderInternal = async () => {
      console.log(`Fetching notes for folder: ${folderId}`);
      setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: true }));

      try {
        let notesQuery;
        if (folderId !== 'unassigned') {
          notesQuery = query(
            collection(db, 'notes'),
            where('userId', '==', user.uid),
            where('folderId', '==', folderId),
            orderBy('createdAt', 'desc'),
            limit(initialLimit)
          );
        } else {
          // For 'Unassigned' folder
          notesQuery = query(
            collection(db, 'notes'),
            where('userId', '==', user.uid),
            where('folderId', '==', 'unassigned'),
            orderBy('createdAt', 'desc'),
            limit(initialLimit)
          );
        }

        const snapshot = await getDocs(notesQuery);
        const fetchedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          folderId: doc.data().folderId || 'unassigned',
          userId: doc.data().userId,
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
        }));

        setNotesData((prevNotes) => ({
          ...prevNotes,
          [folderId]: fetchedNotes,
        }));

        if (snapshot.docs.length === initialLimit) {
          setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: true }));
          setLastVisibleNote((prev) => ({
            ...prev,
            [folderId]: snapshot.docs[snapshot.docs.length - 1],
          }));
        } else {
          setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: false }));
          setLastVisibleNote((prev) => ({ ...prev, [folderId]: null }));
        }

        console.log(`Fetched ${fetchedNotes.length} notes for folder: ${folderId}`);
      } catch (error) {
        console.error('Error fetching notes:', error);
        alert('Failed to fetch notes. Please try again.');
      } finally {
        setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
      }
    };

    fetchNotesForFolderInternal();
  };

  // Load more notes per folder
  const loadMoreNotes = async (folderId) => {
    if (!lastVisibleNote[folderId] || perFolderLoadingNotes[folderId]) return;

    console.log(`Loading more notes for folder: ${folderId}`);
    setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: true }));

    try {
      let moreNotesQuery;
      if (folderId !== 'unassigned') {
        moreNotesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          where('folderId', '==', folderId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleNote[folderId]),
          limit(loadMoreLimit)
        );
      } else {
        // For 'Unassigned' folder
        moreNotesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          where('folderId', '==', 'unassigned'),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleNote[folderId]),
          limit(loadMoreLimit)
        );
      }

      const snapshot = await getDocs(moreNotesQuery);
      const newNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        folderId: doc.data().folderId || 'unassigned',
        userId: doc.data().userId,
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
      }));

      setNotesData((prevNotes) => ({
        ...prevNotes,
        [folderId]: [...(prevNotes[folderId] || []), ...newNotes],
      }));

      if (snapshot.docs.length === loadMoreLimit) {
        setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: true }));
        setLastVisibleNote((prev) => ({
          ...prev,
          [folderId]: snapshot.docs[snapshot.docs.length - 1],
        }));
      } else {
        setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: false }));
        setLastVisibleNote((prev) => ({ ...prev, [folderId]: null }));
      }

      console.log(`Loaded ${newNotes.length} more notes for folder: ${folderId}`);
    } catch (error) {
      console.error('Error loading more notes:', error);
      alert('Failed to load more notes. Please try again.');
    } finally {
      setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  // Handle note creation
  const handleAddNoteAction = async (folderId) => {
    if (!editor || isCreatingNote) return; // Prevent multiple clicks

    setIsCreatingNote(true);

    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        title: 'Untitled Note',
        content: '<h1></h1>',
        folderId: folderId || 'unassigned',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(), // Set updatedAt to serverTimestamp()
      });

      const newNote = {
        id: docRef.id,
        title: 'Untitled Note',
        folderId: folderId || 'unassigned',
        userId: user.uid,
        createdAt: new Date(), // This will be updated when Firestore syncs
        updatedAt: new Date(), // This will be updated when Firestore syncs
      };

      setNotesData((prevNotes) => ({
        ...prevNotes,
        [folderId || 'unassigned']: [newNote, ...(prevNotes[folderId || 'unassigned'] || [])],
      }));

      setActiveNote(newNote);
      editor.commands.setContent('<h1></h1>');
      console.log('New untitled note initialized.');

      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }

      // Navigate to the new note's URL
      navigate(`/notes/${folderId || 'unassigned'}/${docRef.id}`);
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add the note. Please try again.');
    } finally {
      setIsCreatingNote(false);
    }
  };

  // Handle folder editing
  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setEditFolderName(folder.name);
    setIsFolderModalOpen(true);
    setIsFolderDropdownOpen(false);
  };

  const openAddFolderModal = () => {
    setIsFolderModalOpen(true);
    setEditingFolder(null);
    setEditFolderName('');
    setFolderName('');
  };

  const handleAddFolder = async () => {
    if (!folderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    setIsCreatingFolder(true);

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
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder || !editFolderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    // Prevent renaming the 'Unassigned' folder
    if (editingFolder.id === 'unassigned') {
      alert("Cannot rename the 'Unassigned' folder.");
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

  // Function to delete all notes in a folder (with batching)
  const deleteNotesInFolder = async (folderId) => {
    const batchSize = 500;

    const deleteQueryBatch = async () => {
      const notesRef = collection(db, 'notes');
      const notesQuery = query(notesRef, where('folderId', '==', folderId), limit(batchSize));
      const querySnapshot = await getDocs(notesQuery);

      if (querySnapshot.size === 0) {
        // All notes have been deleted
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });

      await batch.commit();

      console.log(`Deleted batch of ${querySnapshot.size} notes from folder ${folderId}`);

      // Recurse if there are more notes to delete
      if (querySnapshot.size === batchSize) {
        // There might be more notes, call the function again
        await deleteQueryBatch();
      }
    };

    await deleteQueryBatch();
  };

  // Delete folder function with protection for 'Unassigned' folder
  const handleDeleteFolder = async (folderId) => {
    if (folderId === 'unassigned') {
      alert("Cannot delete the 'Unassigned' folder.");
      return;
    }

    try {
      // Delete all notes within the folder
      await deleteNotesInFolder(folderId);
      console.log('All notes within the folder have been deleted.');

      // Delete the folder itself
      await deleteDoc(doc(db, 'folders', folderId));
      console.log('Folder deleted successfully:', folderId);

      // Update state
      setNotesData((prevNotes) => {
        const updatedNotes = { ...prevNotes };
        delete updatedNotes[folderId];
        return updatedNotes;
      });

      // Reset pagination states for the deleted folder
      setLastVisibleNote((prevLast) => {
        const updatedLast = { ...prevLast };
        delete updatedLast[folderId];
        return updatedLast;
      });

      setPerFolderHasMoreNotes((prevHasMore) => {
        const updatedHasMore = { ...prevHasMore };
        delete updatedHasMore[folderId];
        return updatedHasMore;
      });

      // Remove the folder from the folders state
      setFolders((prevFolders) => prevFolders.filter((folder) => folder.id !== folderId));

      // If the deleted folder was selected, reset selectedFolder
      if (selectedFolder === folderId) {
        setSelectedFolder('unassigned');
        navigate('/notes/unassigned'); // Navigate to 'Unassigned' folder
      }
    } catch (error) {
      console.error('Error deleting folder:', error.message, error.code, error);
      alert('Failed to delete the folder. Please try again.');
    }
  };

  // Drag and Drop handler
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If no destination, do nothing
    if (!destination) {
      return;
    }

    // If the item is dropped in the same place, do nothing
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move the note to the new folder
    await handleMoveNote(draggableId, destination.droppableId);
  };

  // Function to move note between folders
  const handleMoveNote = async (noteId, newFolderId) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, { folderId: newFolderId || 'unassigned' });
      console.log(`Note ${noteId} moved to folder ${newFolderId || 'Unassigned'}`);

      // Find the current folder and the note
      let sourceFolderId = null;
      let movedNote = null;

      setNotesData((prevNotes) => {
        const updatedNotes = { ...prevNotes };

        // Find and remove the note from its current folder
        for (const fid in updatedNotes) {
          const index = updatedNotes[fid].findIndex((note) => note.id === noteId);
          if (index !== -1) {
            movedNote = { ...updatedNotes[fid][index], folderId: newFolderId || 'unassigned' };
            updatedNotes[fid].splice(index, 1);
            sourceFolderId = fid;
            break;
          }
        }

        if (movedNote) {
          // Add the note to the new folder at the top
          const targetFolderId = newFolderId || 'unassigned';
          updatedNotes[targetFolderId] = [movedNote, ...(updatedNotes[targetFolderId] || [])];
        }

        return updatedNotes;
      });
    } catch (error) {
      console.error('Error moving note:', error.message, error.code, error);
      alert('Failed to move the note. Please try again.');
    }
  };

  // Handle image uploads in the editor
  const handleImageUpload = async (event) => {
    if (!isOnline) {
      alert('Image upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress the image before uploading using the compressImage utility
      const compressedFile = await compressImage(file, 1, 1920); // 1MB max size, 1920px max dimension

      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${compressedFile.name}`);

      await uploadBytes(storageRef, compressedFile);

      const url = await getDownloadURL(storageRef);

      editor
        .chain()
        .focus()
        .setImage({ src: url, width: '250px', height: 'auto', 'data-resizable-image': '' })
        .run();

      console.log('Image uploaded and inserted:', url);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload the image. Please try again.');
    }
  };

  // Handle camera capture in the editor
  const handleCameraCapture = async (event) => {
    if (!isOnline) {
      alert('Image upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress the image before uploading using the compressImage utility
      const compressedFile = await compressImage(file, 1, 1920); // 1MB max size, 1920px max dimension

      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${compressedFile.name}`);

      await uploadBytes(storageRef, compressedFile);

      const url = await getDownloadURL(storageRef);

      editor
        .chain()
        .focus()
        .setImage({ src: url, width: '250px', height: 'auto', 'data-resizable-image': '' })
        .run();

      console.log('Camera image captured and inserted:', url);
    } catch (error) {
      console.error('Error uploading camera image:', error);
      alert('Failed to upload the image. Please try again.');
    }
  };

  // Handle profile picture upload with compression
  const handleProfilePictureUpload = async (event) => {
    if (!isOnline) {
      alert('Profile picture upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress the image before uploading using the compressImage utility
      const compressedFile = await compressImage(file, 0.5, 1024); // 0.5MB max size, 1024px max dimension

      const storageRef = ref(
        storage,
        `profilePictures/${user.uid}/${Date.now()}_${compressedFile.name}`
      );

      await uploadBytes(storageRef, compressedFile);

      const url = await getDownloadURL(storageRef);

      // Update user's profile picture URL in Firebase Authentication
      await updateProfile(user, {
        photoURL: url,
      });

      // Optionally update Firestore user document if you store additional user data there
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        photoURL: url,
      });

      console.log('Profile picture uploaded and updated:', url);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload the profile picture. Please try again.');
    }
  };

  // Handle AI Notes click
  const handleAINotesClick = () => {
    // Implement AI Notes functionality here
    alert('AI Notes feature is not yet implemented.');
  };

  // Handle logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        console.log('User logged out');
        navigate('/login');
      })
      .catch((error) => {
        console.error('Error logging out:', error.message, error.code, error);
      });
  };

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isFolderDropdownOpen &&
        !event.target.closest('.folder-dropdown-container') &&
        !event.target.closest('.folder-item')
      ) {
        setIsFolderDropdownOpen(false);
        setSelectedFolderDropdown(null);
      }

      if (
        isNoteDropdownOpen &&
        !event.target.closest('.note-dropdown-container') &&
        !event.target.closest('.note-item')
      ) {
        setIsNoteDropdownOpen(false);
        setSelectedNoteDropdown(null);
      }

      if (
        isProfileDropdownOpen &&
        !event.target.closest('.profile-dropdown') &&
        !event.target.closest('.profile-icon')
      ) {
        setIsProfileDropdownOpen(false);
      }

      if (
        isSidebarOpen &&
        window.innerWidth <= 768 &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.sidebar-toggle-button')
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    isFolderDropdownOpen,
    isNoteDropdownOpen,
    isProfileDropdownOpen,
    isSidebarOpen,
    sidebarRef,
  ]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="notes-container">
        <Header
          user={user}
          isProfileDropdownOpen={isProfileDropdownOpen}
          setIsProfileDropdownOpen={setIsProfileDropdownOpen}
          handleImageUpload={handleImageUpload}
          handleCameraCapture={handleCameraCapture}
          handleProfilePictureUpload={handleProfilePictureUpload} // Pass the new function to Header
          handleAINotesClick={handleAINotesClick}
          setIsSidebarOpen={setIsSidebarOpen}
          activeNote={activeNote}
          isSaved={isSaved}
        />

        {/* Offline Alert */}
        {!isOnline && <OfflineAlert />}

        {/* Save Indicator */}
        <SaveIndicator isSaved={isSaved} />

        {/* Sidebar Toggle Button */}
        <button
          className="sidebar-toggle-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
          aria-expanded={isSidebarOpen}
        >
          ☰
        </button>

        {/* Sidebar Component */}
        <Sidebar
          ref={sidebarRef}
          folders={folders}
          handleEditFolder={handleEditFolder}
          handleDeleteFolder={handleDeleteFolder} // Now handles deletion with protection
          handleAddNote={handleAddNoteAction}
          openAddFolderModal={openAddFolderModal}
          openNote={openNote} // Use the updated openNote function
          notes={notesData}
          activeNote={activeNote}
          selectedFolder={selectedFolder}
          setSelectedFolder={(folderId) => {
            setSelectedFolder(folderId);
            navigate(`/notes/${folderId}`); // Navigate to the folder's URL
          }}
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
          handleDeleteNote={handleDeleteNote} // Now handles deletion without confirmation
          isCreatingNote={isCreatingNote}
          perFolderLoadingNotes={perFolderLoadingNotes}
          perFolderHasMoreNotes={perFolderHasMoreNotes}
          loadMoreNotes={loadMoreNotes}
        />

        <Breadcrumbs />

        {/* Modal for Adding/Editing Folders */}
        <FolderModal
          isFolderModalOpen={isFolderModalOpen}
          setIsFolderModalOpen={setIsFolderModalOpen}
          folderName={folderName}
          setFolderName={setFolderName}
          editingFolder={editingFolder}
          editFolderName={editFolderName}
          setEditFolderName={setEditFolderName}
          handleAddFolder={handleAddFolder}
          handleRenameFolder={handleRenameFolder}
          isCreatingFolder={isCreatingFolder}
        />

        {/* Confirmation Modal */}
        <Modal
          isOpen={isConfirmModalOpen}
          onRequestClose={closeConfirmModal}
          contentLabel="Confirmation Modal"
          className="confirmation-modal"
          overlayClassName="confirmation-modal-overlay"
        >
          <h2>Confirm Action</h2>
          <p>{modalContent.message}</p>
          <div className="modal-buttons">
            <button onClick={handleConfirm} className="confirm-button">
              Yes
            </button>
            <button onClick={closeConfirmModal} className="cancel-button">
              Cancel
            </button>
          </div>
        </Modal>

        {/* Notes Editor Section */}
        {activeNote ? (
          <>
            <NoteEditor
              activeNote={activeNote}
              editor={editor}
              textColor={textColor}
              handleImageUpload={handleImageUpload}
              handleCameraCapture={handleCameraCapture}
              closeNote={closeNote}
            />
            {editor && (
              <FloatingToolbar
                editor={editor}
                setHasUnsavedChanges={setHasUnsavedChanges}
              />
            )}
          </>
        ) : (
          <NoteView
            openNote={openNote}
            handleAddNoteAction={handleAddNoteAction}
            contentClassName="note-view-content" // Pass the new class name
          />
        )}
      </div>
    </DragDropContext>
  );
};

export default NotesPage;
