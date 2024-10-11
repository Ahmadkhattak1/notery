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

import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

  const handleAddNote = async () => {
    if (!editor) return;

    try {
      const docRef = await addDoc(collection(db, 'notes'), {
        title: 'Untitled Note',
        content: '<h1></h1>',
        folderId: selectedFolder || null,
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: null,
      });

      const newNote = {
        id: docRef.id,
        title: 'Untitled Note',
        content: '<h1></h1><p></p>',
        folderId: selectedFolder || null,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: null,
      };

      setActiveNote(newNote);

      editor.commands.setContent('<h1></h1><p></p>');
      console.log('New untitled note initialized.');

      if (window.innerWidth <= 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      alert('Failed to add the note. Please try again.');
    }
  };

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
    } catch (error) {
      console.error('Error deleting folder:', error.message, error.code, error);
      alert('Failed to delete the folder. Please try again.');
    }
  };

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

  useEffect(() => {
    if (editor) {
      const updateTextColor = () => {
        const color = editor.getAttributes('textStyle').color || '';
        setTextColor(color);
      };

      editor.on('selectionUpdate', updateTextColor);
      editor.on('transaction', updateTextColor);

      const saveTimeout = { current: null };

      const handleAutoSave = () => {
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
        saveTimeout.current = setTimeout(() => {
          handleSaveNote();
        }, 1000);
      };

      editor.on('update', () => {
        if (activeNote) {
          handleAutoSave();
          setIsSaved(false);
          setHasUnsavedChanges(true);
        }
      });

      return () => {
        editor.off('selectionUpdate', updateTextColor);
        editor.off('transaction', updateTextColor);
        editor.off('update', handleAutoSave);
        if (saveTimeout.current) {
          clearTimeout(saveTimeout.current);
        }
      };
    }
  }, [editor, activeNote]);

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
      try {
        await deleteDoc(doc(db, 'notes', activeNote.id));
        console.log('Empty note deleted:', activeNote.id);
        setActiveNote(null);
        editor.commands.setContent('<h1></h1><p></p>');
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error('Error deleting empty note:', error);
        alert('Failed to delete the empty note. Please try again.');
      }
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

  const openNote = (note) => {
    if (hasUnsavedChanges) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes. Do you want to save them before opening another note?'
      );
      if (confirmSwitch) {
        handleSaveNote();
      }
      setHasUnsavedChanges(false);
    }

    setActiveNote(note);
    if (editor) {
      editor.commands.setContent(note.content);
      console.log('Opened note:', note.id);
    }

    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }

    setIsSaved(true);
  };

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

  useEffect(() => {
    if (!user) return;

    const unsubscribeFolders = onSnapshot(collection(db, 'folders'), (snapshot) => {
      const foldersData = snapshot.docs
        .filter((doc) => doc.data().userId === user.uid)
        .map((doc) => ({ id: doc.id, ...doc.data() }));
      setFolders(foldersData);
    });

    const notesRef = collection(db, 'notes');
    const notesQuery = query(notesRef, where('userId', '==', user.uid));

    const unsubscribeNotes = onSnapshot(notesQuery, (snapshot) => {
      const notesData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);

      if (activeNote) {
        const updatedActiveNote = notesData.find((note) => note.id === activeNote.id);
        if (updatedActiveNote) {
          setActiveNote(updatedActiveNote);
        } else {
          // Note was deleted
          setActiveNote(null);
          editor.commands.setContent('<h1></h1><p></p>');
        }
      }
    });

    return () => {
      unsubscribeFolders();
      unsubscribeNotes();
    };
  }, [user]);

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

  const handleImageUpload = async (event) => {
    if (!isOnline) {
      alert('Image upload requires an internet connection.');
      return;
    }

    const file = event.target.files[0];
    if (!file) return;

    try {
      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${file.name}`);

      await uploadBytes(storageRef, file);

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
      const storageRef = ref(storage, `images/${user.uid}/${Date.now()}_${file.name}`);

      await uploadBytes(storageRef, file);

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

  const Header = () => (
    <header className="app-header">
      <h1>My Notes</h1>
    </header>
  );

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="notes-container">
        <Header />

        {!isOnline && (
          <div className="offline-alert">
            <p>You are offline. Changes will be saved when the connection is restored.</p>
          </div>
        )}

        {isSaved ? (
          <div className="save-indicator">All changes saved</div>
        ) : (
          <div className="save-indicator">Saving...</div>
        )}

        <button
          className="sidebar-toggle-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          title="Toggle Sidebar"
          aria-label="Toggle Sidebar"
          aria-expanded={isSidebarOpen}
        >
          ☰
        </button>

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

        <Sidebar
          ref={sidebarRef}
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

        {activeNote ? (
          <NoteEditor
            activeNote={activeNote}
            editor={editor}
            textColor={textColor}
            colorOptions={colorOptions}
            handleImageUpload={handleImageUpload}
            handleCameraCapture={handleCameraCapture}
          />
        ) : (
          <div className="no-active-note">
            <p>Please select or create a note to start editing.</p>
          </div>
        )}

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
