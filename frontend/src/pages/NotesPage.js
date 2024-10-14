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
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthProvider';
import { useEditor, EditorContent } from '@tiptap/react';
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
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useNavigate } from 'react-router-dom';

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Import the image compression library
import imageCompression from 'browser-image-compression';

// Import a loading spinner library or use CSS-based spinner
import { ClipLoader } from 'react-spinners'; // Ensure you have react-spinners installed

Modal.setAppElement('#root');

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

  const [isFolderDropdownOpen, setIsFolderDropdownOpen] = useState(false);
  const [selectedFolderDropdown, setSelectedFolderDropdown] = useState(null);

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

  const [activeNote, setActiveNote] = useState(null);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState([]);

  const sidebarRef = useRef(null);

  const storage = getStorage();

  const [isSaved, setIsSaved] = useState(true);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // States for per-folder pagination and loading
  const [notesData, setNotesData] = useState({}); // { [folderId]: [note1, note2, ...] }
  const [perFolderLoadingNotes, setPerFolderLoadingNotes] = useState({}); // { [folderId]: boolean }
  const [perFolderHasMoreNotes, setPerFolderHasMoreNotes] = useState({}); // { [folderId]: boolean }
  const [lastVisibleNote, setLastVisibleNote] = useState({}); // { [folderId]: lastVisibleDoc }

  // New loading states
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  // Editor setup
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

  // Save note function without automatic deletion
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

    // Remove automatic deletion of empty notes
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
            const folderId = activeNote.folderId;
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

  // Function to close a note and handle empty note deletion
  const closeNote = async () => {
    if (hasUnsavedChanges) {
      const confirmSave = window.confirm(
        'You have unsaved changes. Do you want to save them before closing?'
      );
      if (confirmSave) {
        await handleSaveNote();
      } else {
        // Optionally, discard changes
        setHasUnsavedChanges(false);
      }
    }

    if (activeNote) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editor.getHTML();
      const isContentEmpty = tempDiv.textContent.trim() === '';

      if (isContentEmpty) {
        try {
          await deleteDoc(doc(db, 'notes', activeNote.id));
          console.log('Empty note deleted:', activeNote.id);
          setNotesData((prevNotes) => {
            const folderNotes = prevNotes[activeNote.folderId] || [];
            return {
              ...prevNotes,
              [activeNote.folderId]: folderNotes.filter((note) => note.id !== activeNote.id),
            };
          });
          setActiveNote(null);
          if (editor) {
            editor.commands.setContent('<h1></h1><p></p>');
          }
        } catch (error) {
          console.error('Error deleting empty note:', error);
          alert('Failed to delete the empty note. Please try again.');
        }
      } else {
        setActiveNote(null);
        if (editor) {
          editor.commands.setContent('<h1></h1><p></p>');
        }
      }
    }
  };

  // Open note function
  const openNote = async (note) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes. Do you want to save them before opening another note?'
      );
      if (confirmSwitch) {
        await handleSaveNote();
      } else {
        // Optionally, discard changes
        setHasUnsavedChanges(false);
      }
    }

    try {
      const noteRef = doc(db, 'notes', note.id);
      const noteSnap = await getDoc(noteRef);

      if (noteSnap.exists()) {
        const noteData = noteSnap.data();
        const fullNote = {
          id: noteSnap.id,
          title: noteData.title,
          content: noteData.content,
          folderId: noteData.folderId || null,
          userId: noteData.userId,
          createdAt: noteData.createdAt ? noteData.createdAt.toDate() : new Date(),
          updatedAt: noteData.updatedAt ? noteData.updatedAt.toDate() : null,
        };
        setActiveNote(fullNote);
        if (editor) {
          editor.commands.setContent(fullNote.content || '<h1></h1><p></p>');
          console.log('Opened note:', fullNote.id);
        }

        if (window.innerWidth <= 768) {
          setIsSidebarOpen(false);
        }

        setIsSaved(true);
      } else {
        console.error('Note does not exist:', note.id);
        alert('The selected note does not exist.');
        setActiveNote(null);
        if (editor) {
          editor.commands.setContent('<h1></h1><p></p>');
        }
      }
    } catch (error) {
      console.error('Error fetching note:', error);
      alert('Failed to open the note. Please try again.');
    }
  };

  // Delete note function
  const handleDeleteNote = async (noteId, requireConfirmation = true) => {
    if (requireConfirmation) {
      if (
        !window.confirm('Are you sure you want to delete this note? This action cannot be undone.')
      )
        return;
    }

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
          editor.commands.setContent('<h1></h1><p></p>');
          console.log('Editor content reset after deletion.');
        }
      }
    } catch (error) {
      console.error('Error deleting note:', error.message, error.code, error);
      alert('Failed to delete the note. Please try again.');
    }
  };

  // Fetch folders
  useEffect(() => {
    if (!user) return;

    setIsLoadingFolders(true); // Start loading folders

    // Query only folders belonging to the authenticated user
    const foldersQuery = query(
      collection(db, 'folders'),
      where('userId', '==', user.uid)
    );

    const unsubscribeFolders = onSnapshot(
      foldersQuery,
      (snapshot) => {
        const foldersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFolders(foldersData);
        setIsLoadingFolders(false); // Stop loading folders

        // Fetch notes for each folder
        foldersData.forEach((folder) => {
          if (!notesData[folder.id]) {
            fetchNotes(folder.id);
          }
        });
      },
      (error) => {
        console.error('Error fetching folders:', error);
        alert('Failed to fetch folders. Please try again.');
        setIsLoadingFolders(false);
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribeFolders();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Fetch notes per folder
  const fetchNotes = (folderId) => {
    setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: true }));

    let notesQuery;
    if (folderId) {
      notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        where('folderId', '==', folderId),
        orderBy('createdAt', 'desc'),
        limit(5) // Load five notes initially
      );
    } else {
      // For 'Unassigned' folder (folderId is null)
      notesQuery = query(
        collection(db, 'notes'),
        where('userId', '==', user.uid),
        where('folderId', '==', null),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
    }

    const unsubscribe = onSnapshot(
      notesQuery,
      (snapshot) => {
        const fetchedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().title,
          folderId: doc.data().folderId || null,
          userId: doc.data().userId,
          createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
          updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
          // Exclude 'content' field
        }));

        setNotesData((prevNotes) => ({
          ...prevNotes,
          [folderId]: fetchedNotes,
        }));

        if (snapshot.docs.length === 5) {
          setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: true }));
          setLastVisibleNote((prev) => ({
            ...prev,
            [folderId]: snapshot.docs[snapshot.docs.length - 1],
          }));
        } else {
          setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: false }));
          setLastVisibleNote((prev) => ({ ...prev, [folderId]: null }));
        }

        setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
      },
      (error) => {
        console.error('Error fetching notes:', error);
        alert('Failed to fetch notes. Please try again.');
        setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
      }
    );

    return unsubscribe;
  };

  // Load more notes per folder
  const loadMoreNotes = async (folderId) => {
    if (!lastVisibleNote[folderId] || perFolderLoadingNotes[folderId]) return;

    setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: true }));

    try {
      let moreNotesQuery;
      if (folderId) {
        moreNotesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          where('folderId', '==', folderId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleNote[folderId]),
          limit(5) // Load five more notes
        );
      } else {
        // For 'Unassigned' folder
        moreNotesQuery = query(
          collection(db, 'notes'),
          where('userId', '==', user.uid),
          where('folderId', '==', null),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisibleNote[folderId]),
          limit(5)
        );
      }

      const snapshot = await getDocs(moreNotesQuery);
      const newNotes = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
        folderId: doc.data().folderId || null,
        userId: doc.data().userId,
        createdAt: doc.data().createdAt ? doc.data().createdAt.toDate() : new Date(),
        updatedAt: doc.data().updatedAt ? doc.data().updatedAt.toDate() : null,
        // Exclude 'content' field
      }));

      setNotesData((prevNotes) => ({
        ...prevNotes,
        [folderId]: [...(prevNotes[folderId] || []), ...newNotes],
      }));

      if (snapshot.docs.length === 5) {
        setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: true }));
        setLastVisibleNote((prev) => ({
          ...prev,
          [folderId]: snapshot.docs[snapshot.docs.length - 1],
        }));
      } else {
        setPerFolderHasMoreNotes((prev) => ({ ...prev, [folderId]: false }));
        setLastVisibleNote((prev) => ({ ...prev, [folderId]: null }));
      }

      setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
    } catch (error) {
      console.error('Error loading more notes:', error);
      alert('Failed to load more notes. Please try again.');
      setPerFolderLoadingNotes((prev) => ({ ...prev, [folderId]: false }));
    }
  };

  // Handle note creation
  const handleAddNoteAction = async (folderId) => {
    if (!editor) return;

    setIsCreatingNote(true); // Start creating note

    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        title: 'Untitled Note',
        content: '<h1></h1>',
        folderId: folderId || null,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: null,
      });

      const newNote = {
        id: docRef.id,
        title: 'Untitled Note',
        folderId: folderId || null,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: null,
      };

      setNotesData((prevNotes) => ({
        ...prevNotes,
        [folderId]: [newNote, ...(prevNotes[folderId] || [])],
      }));

      setActiveNote(newNote);
      editor.commands.setContent('<h1></h1><p></p>');
      console.log('New untitled note initialized.');

      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add the note. Please try again.');
    } finally {
      setIsCreatingNote(false); // Stop creating note
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

    setIsCreatingFolder(true); // Start creating folder

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
      setIsCreatingFolder(false); // Stop creating folder
    }
  };

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

  const handleDeleteFolder = async (folderId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this collection? All notes within will be moved to Unassigned.'
      )
    )
      return;

    try {
      const notesRef = collection(db, 'notes');
      const notesSnapshot = await getDocs(query(notesRef, where('folderId', '==', folderId)));

      const batch = writeBatch(db);
      notesSnapshot.forEach((docSnap) => {
        const noteRef = doc(db, 'notes', docSnap.id);
        batch.update(noteRef, { folderId: null });
      });
      await batch.commit();
      console.log('All notes moved to Unassigned.');

      await deleteDoc(doc(db, 'folders', folderId));
      console.log('Folder deleted successfully:', folderId);

      // Remove the folder's notes from the state
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
      await updateDoc(noteRef, { folderId: newFolderId || null });
      console.log(`Note ${noteId} moved to folder ${newFolderId || 'Unassigned'}`);

      // Update local state
      let movedNote;
      setNotesData((prevNotes) => {
        const updatedNotes = { ...prevNotes };
        let sourceFolderId = null;

        // Find and remove the note from its current folder
        for (const fid in updatedNotes) {
          const index = updatedNotes[fid].findIndex((note) => note.id === noteId);
          if (index !== -1) {
            [movedNote] = updatedNotes[fid].splice(index, 1);
            sourceFolderId = fid;
            break;
          }
        }

        // Add the note to the new folder at the top
        if (movedNote) {
          movedNote.folderId = newFolderId || null;
          const targetFolderId = newFolderId || 'null';
          updatedNotes[targetFolderId] = [
            movedNote,
            ...(updatedNotes[targetFolderId] || []),
          ];
        }

        return updatedNotes;
      });
    } catch (error) {
      console.error('Error moving note:', error.message, error.code, error);
      alert('Failed to move the note. Please try again.');
    }
  };

  // Handle image uploads (unchanged)
  const handleImageUpload = async (event) => {
    if (!isOnline) {
      alert('Image upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress the image before uploading
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

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

  const handleCameraCapture = async (event) => {
    if (!isOnline) {
      alert('Image upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      // Compress the image before uploading
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

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

  // Handle online/offline status (unchanged)
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      console.log('Back online.');

      if (offlineQueue.length > 0) {
        const queuedActions = [...offlineQueue];
        setOfflineQueue([]);
        for (const action of queuedActions) {
          try {
            await action();
          } catch (error) {
            console.error('Error processing queued action:', error);
          }
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('Offline.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [offlineQueue]);

  // Handle clicking outside (unchanged)
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
        <Header />

        {/* Offline Alert */}
        {!isOnline && (
          <div className="offline-alert">
            <p>You are offline. Changes will be saved when the connection is restored.</p>
          </div>
        )}

        {/* Save Indicator */}
        <div className="save-indicator">
          {isSaved ? 'All changes saved' : 'Saving...'}
        </div>

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

        {/* Profile Section */}
        <div className="profile-section">
          <div
            className="profile-icon"
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
          >
            {user && user.photoURL ? (
              <img src={user.photoURL} alt="Profile" className="profile-picture" />
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
          ref={sidebarRef}
          folders={folders}
          handleEditFolder={handleEditFolder}
          handleDeleteFolder={handleDeleteFolder}
          handleAddNote={handleAddNoteAction} // Updated to handleAddNoteAction
          openAddFolderModal={openAddFolderModal}
          openNote={openNote}
          notes={notesData} // Object: { [folderId]: [notes] }
          activeNote={activeNote}
          selectedFolder={selectedFolder}
          setSelectedFolder={(folderId) => {
            setSelectedFolder(folderId);
            // Fetch notes for the new folder if not already fetched
            if (!notesData[folderId]) {
              fetchNotes(folderId);
            }
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
          handleDeleteNote={handleDeleteNote}
          isCreatingNote={isCreatingNote} // Pass loading state
          perFolderLoadingNotes={perFolderLoadingNotes} // Pass per-folder loading state
          perFolderHasMoreNotes={perFolderHasMoreNotes} // Pass per-folder hasMore state
          loadMoreNotes={loadMoreNotes} // Pass loadMoreNotes function
        />

        {/* Modal for Adding/Editing Folders */}
        <Modal
  isOpen={isFolderModalOpen}
  onRequestClose={() => setIsFolderModalOpen(false)}
  contentLabel={editingFolder ? 'Edit Folder' : 'Add Folder'}
  className="modal-content" // Align with .modal-content in CSS
  overlayClassName="ReactModal__Overlay" // Align with .ReactModal__Overlay in CSS
>
  <div className="folder-modal-content"> {/* Align with .folder-modal-content in CSS */}
    <h2>{editingFolder ? 'Edit Folder' : 'Add Folder'}</h2>
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (editingFolder) {
          handleRenameFolder();
        } else {
          handleAddFolder();
        }
      }}
    >
      <input
        type="text"
        value={editingFolder ? editFolderName : folderName}
        onChange={(e) =>
          editingFolder ? setEditFolderName(e.target.value) : setFolderName(e.target.value)
        }
        placeholder="Folder Name"
        required
        className="folder-name-input" // Align with .folder-name-input in CSS
        ref={titleInputRef}
      />
      <div className="modal-buttons"> {/* Align with .modal-buttons in CSS */}
        <button type="submit" className="save-button" disabled={isCreatingFolder}>
          {isCreatingFolder ? 'Saving...' : 'Save'}
        </button>
        <button type="button" className="cancel-button" onClick={() => setIsFolderModalOpen(false)}>
          Cancel
        </button>
      </div>
    </form>
  </div>
</Modal>
        {/* Notes Editor Section */}
        {activeNote ? (
          <NoteEditor
            activeNote={activeNote}
            editor={editor}
            textColor={textColor}
            colorOptions={colorOptions}
            handleImageUpload={handleImageUpload}
            handleCameraCapture={handleCameraCapture}
            closeNote={closeNote} // Pass closeNote function
          />
        ) : (
          <div className="no-active-note">
            <p>Please select or create a note to start editing.</p>
          </div>
        )}

        {/* Remove global loading indicators and "Load More" button from NotesPage.js */}
      </div>
    </DragDropContext>
  );
};

export default NotesPage;

// Helper Header Component
const Header = () => (
  <header className="app-header">
    <h1>My Notes</h1>
  </header>
);
