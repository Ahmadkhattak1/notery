// src/pages/NotesPage.js

import React, { useState, useEffect } from 'react';
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
import ResizableImage from '../extensions/ResizableImage'; // Adjust the path as necessary
import FontSize from '../extensions/FontSize'; // Adjust the path as necessary
import '../App.css';
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

  // Define color options
  const colorOptions = [
    { name: 'Default', color: null },
    { name: 'Black', color: '#000000' },
    { name: 'Dark Gray', color: '#4D4D4D' },
    { name: 'Gray', color: '#808080' },
    { name: 'Light Gray', color: '#B3B3B3' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Red', color: '#FF0000' },
    { name: 'Orange', color: '#FFA500' },
    { name: 'Yellow', color: '#FFFF00' },
    { name: 'Green', color: '#008000' },
    { name: 'Blue', color: '#0000FF' },
    { name: 'Purple', color: '#800080' },
    { name: 'Pink', color: '#FFC0CB' },
    { name: 'Brown', color: '#A52A2A' },
  ];

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
  
      FontSize,
  
      // Lists
      ListItem,
      BulletList,
      OrderedList,

      //other extensions
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
    content: '',
    editorProps: {
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
        // Get the first 30 characters
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

  return (
    <div>
      <h1>My Notes</h1>

      {/* Folder Management Section */}
      <div>
        <h2>Folders</h2>
        <button
          onClick={() => {
            setIsFolderModalOpen(true);
            setEditingFolder(null);
            setEditFolderName('');
          }}
        >
          Add Folder
        </button>
        <ul>
          <li
            key="home"
            onClick={() => setSelectedFolder('')}
            style={{ cursor: 'pointer', fontWeight: !selectedFolder ? 'bold' : 'normal' }}
          >
            Home
          </li>
          {folders.map((folder) => (
            <li
              key={folder.id}
              onClick={() => setSelectedFolder(folder.id)}
              style={{
                cursor: 'pointer',
                fontWeight: selectedFolder === folder.id ? 'bold' : 'normal',
              }}
            >
              {folder.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingFolder(folder);
                  setEditFolderName(folder.name);
                  setIsFolderModalOpen(true);
                }}
                title="Rename Folder"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteFolder(folder.id);
                }}
                title="Delete Folder"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add Note Button */}
      <button
        onClick={() => {
          setIsModalOpen(true);
          setEditingNoteId(null);
          setEditTitle('');
          editor.commands.setContent('');
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
      >
        <h2>{editingFolder ? 'Edit Folder' : 'Add a New Folder'}</h2>
        <input
          type="text"
          value={editingFolder ? editFolderName : folderName}
          onChange={(e) =>
            editingFolder ? setEditFolderName(e.target.value) : setFolderName(e.target.value)
          }
          placeholder="Folder Name"
        />
        <button onClick={editingFolder ? handleRenameFolder : handleAddFolder}>
          {editingFolder ? 'Save Changes' : 'Add Folder'}
        </button>
        <button
          onClick={() => {
            setIsFolderModalOpen(false);
            setEditingFolder(null);
            setEditFolderName('');
          }}
        >
          Cancel
        </button>
      </Modal>

      {/* Modal for Adding and Editing Notes */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        contentLabel="Add/Edit Note"
      >
        <h2>{editingNoteId ? 'Edit Note' : 'Add a New Note'}</h2>
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          placeholder="Note Title"
        />
        {/* TipTap Toolbar */}
        <div>

          <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor} title="Bold">
            Bold
          </button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor} title="Italic">
            Italic
          </button>
          <button
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            disabled={!editor}
            title="Remove Formatting"
          >
            Remove Formatting
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={!editor}
            title="Heading 1"
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor}
            title="Heading 2"
          >
            H2
          </button>
          <button onClick={() => editor.chain().focus().setParagraph().run()} disabled={!editor} title="Paragraph">
            Paragraph
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={!editor}
            title="Horizontal Line"
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

          {/* Font Size Dropdown */}
          <select
            onChange={(e) => {
              const fontSize = e.target.value;
              if (fontSize !== '') {
                editor.chain().focus().setFontSize(fontSize).run();
              }
            }}
            disabled={!editor}
            title="Change Font Size"
            defaultValue=""
          >
            <option value="" disabled>
              Font Size
            </option>
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="22px">22px</option>
            <option value="24px">24px</option>
          </select>

          {/* Heading Colors */}
          
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
  >
    {colorOptions.map((option, index) => (
      <option key={index} value={option.color || ''}>
        {option.name}
      </option>
    ))}
  </select>
          {/* Image Upload Options */}
          <div>
            <input
              type="file"
              onChange={handleImageUpload}
              accept="image/*"
              style={{ display: 'none' }}
              id="imageUpload"
            />
            <label htmlFor="imageUpload" title="Upload Image">
              Upload Image
            </label>
            <input
              type="file"
              onChange={handleCameraCapture}
              accept="image/*"
              capture="environment" // Prompts camera on mobile devices
              style={{ display: 'none' }}
              id="cameraCapture"
            />
            <label htmlFor="cameraCapture" title="Take Photo">
              Take Photo
            </label>
          </div>
        </div>
        {/* TipTap Editor */}
        <EditorContent editor={editor} />
        {/* Save and Cancel Buttons */}
        <button onClick={editingNoteId ? handleEditNote : handleAddNote}>
          {editingNoteId ? 'Save Changes' : 'Save Note'}
        </button>
        <button onClick={() => setIsModalOpen(false)}>Cancel</button>
      </Modal>

      {/* Notes List */}
      <div>
        <h2>
          {selectedFolder
            ? `Folder: ${folders.find((f) => f.id === selectedFolder)?.name || ''}`
            : 'Home'}
        </h2>
        {notes.filter((note) => selectedFolder === '' || note.folderId === selectedFolder).length === 0 ? (
          <p>No notes in this {selectedFolder ? 'folder' : 'home'}.</p>
        ) : (
          <ul>
            {notes
              .filter((note) => selectedFolder === '' || note.folderId === selectedFolder)
              .map((note) => (
                <li key={note.id}>
                  <h4>{note.title}</h4>
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
                  <button onClick={() => openEditModal(note)}>Edit</button>
                  <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
                  <div>
                    <label htmlFor={`move-note-${note.id}`}>Move to:</label>
                    <select
                      id={`move-note-${note.id}`}
                      value={note.folderId || ''}
                      onChange={(e) => handleMoveNote(note.id, e.target.value)}
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
  );
};

export default NotesPage;
