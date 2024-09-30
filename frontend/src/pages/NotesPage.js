import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthProvider';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderName, setFolderName] = useState('');
  const [noteContent, setNoteContent] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch folders
    const unsubscribeFolders = onSnapshot(collection(db, 'folders'), (snapshot) => {
      const foldersData = snapshot.docs
        .filter(doc => doc.data().userId === user.uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setFolders(foldersData);
    });

    // Fetch notes
    const unsubscribeNotes = onSnapshot(collection(db, 'notes'), (snapshot) => {
      const notesData = snapshot.docs
        .filter(doc => doc.data().userId === user.uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    });

    return () => {
      unsubscribeFolders();
      unsubscribeNotes();
    };
  }, [user]);

  const handleAddFolder = async () => {
    if (!folderName.trim()) {
      alert("Folder name can't be empty");
      return;
    }

    try {
      await addDoc(collection(db, 'folders'), {
        name: folderName,
        userId: user.uid,
        createdAt: new Date(),
      });
      setFolderName('');
    } catch (error) {
      console.error('Error adding folder:', error);
    }
  };

  const handleAddNote = async () => {
    if (!noteContent.trim() || !selectedFolder) {
      alert("Note content can't be empty and folder must be selected");
      return;
    }

    try {
      await addDoc(collection(db, 'notes'), {
        content: noteContent,
        folderId: selectedFolder,
        userId: user.uid,
        createdAt: new Date(),
      });
      setNoteContent('');
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  return (
    <div>
      <h1>My Notes</h1>

      <div>
        <h3>Create a Folder</h3>
        <input
          type="text"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="New folder name"
        />
        <button onClick={handleAddFolder}>Add Folder</button>
      </div>

      <div>
        <h3>Select Folder</h3>
        <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}>
          <option value="">Select a folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <ReactQuill
          theme="snow"
          value={noteContent}
          onChange={setNoteContent}
          placeholder="Write a new note"
        />
        <button onClick={handleAddNote}>Add Note</button>
      </div>

      <div>
        <h2>Your Notes</h2>
        {notes.length === 0 ? (
          <p>No notes yet.</p>
        ) : (
          <ul>
            {notes
              .filter(note => note.folderId === selectedFolder)
              .map((note) => (
                <li key={note.id}>
                  <div dangerouslySetInnerHTML={{ __html: note.content }}></div>
                  <p><small>Created: {new Date(note.createdAt.seconds * 1000).toLocaleString()}</small></p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
