// src/components/NoteView.js

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './styling/NoteView.css';

const NoteView = ({ openNote }) => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const fetchRecentNotes = async () => {
      if (!user) return;

      try {
        const notesRef = collection(db, 'notes');
        const q = query(
          notesRef,
          where('userId', '==', user.uid),
          orderBy('updatedAt', 'desc'),
          limit(10)
        );

        const querySnapshot = await getDocs(q);
        const notes = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRecentNotes(notes);
        console.log('Fetched recent notes:', notes);
      } catch (error) {
        console.error('Error fetching recent notes:', error);
      }
    };

    fetchRecentNotes();
  }, [user]);

  const handleOpenNote = async (note) => {
    if (openNote) {
      await openNote(note);
    } else {
      console.warn('openNote function is not provided');
    }
  };

  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  return (
    <div className="note-view-section">
      <div className="noteview-container">
        <div className="welcome-section">
          <h2>Your Recent Notes</h2>
          <p>Click on a note to start editing.</p>
        </div>

        {recentNotes.length > 0 ? (
          <div className="recent-notes-section">
            <div className="recent-notes-grid">
              {recentNotes.map((note) => (
                <div
                  key={note.id}
                  className="note-card"
                  onClick={() => handleOpenNote(note)}
                >
                  <h4>{note.title || 'Untitled Note'}</h4>
                  <p>
                    {note.content
                      ? stripHtml(note.content).substring(0, 100) + '...'
                      : 'No content available.'}
                  </p>
                  <span className="note-date">
                    {note.updatedAt
                      ? new Date(note.updatedAt.toDate()).toLocaleDateString()
                      : 'No date'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-recent-notes">
            <p>You have no recent notes. Start by creating a new one!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteView;
