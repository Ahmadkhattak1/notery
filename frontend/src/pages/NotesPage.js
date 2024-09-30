import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthProvider';

const NotesPage = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    if (!user) return;

    // Fetch the user's notes from Firestore
    const q = collection(db, 'notes');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs
        .filter(doc => doc.data().userId === user.uid)
        .map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      alert("Note content can't be empty");
      return;
    }

    try {
      await addDoc(collection(db, 'notes'), {
        content: noteContent,
        userId: user.uid,
        createdAt: new Date(),
      });
      setNoteContent(''); // Clear input after adding note
    } catch (error) {
      console.error('Error adding note:', error);
    }
  };

  const handleEditNote = async (noteId) => {
    if (!editContent.trim()) {
      alert("Edited note content can't be empty");
      return;
    }

    try {
      const noteRef = doc(db, 'notes', noteId);
      await updateDoc(noteRef, {
        content: editContent,
      });
      setEditingNoteId(null); // Exit editing mode
      setEditContent(''); // Clear edit input
    } catch (error) {
      console.error('Error updating note:', error);
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      const noteRef = doc(db, 'notes', noteId);
      await deleteDoc(noteRef);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  return (
    <div>
      <h1>My Notes</h1>
      <div>
        <input
          type="text"
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
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
            {notes.map((note) => (
              <li key={note.id}>
                {editingNoteId === note.id ? (
                  <div>
                    <input
                      type="text"
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      placeholder="Edit your note"
                    />
                    <button onClick={() => handleEditNote(note.id)}>Save</button>
                    <button onClick={() => setEditingNoteId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <span>{note.content}</span>
                    <button onClick={() => { setEditingNoteId(note.id); setEditContent(note.content); }}>Edit</button>
                    <button onClick={() => handleDeleteNote(note.id)}>Delete</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotesPage;
