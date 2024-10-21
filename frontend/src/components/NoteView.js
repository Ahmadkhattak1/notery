// src/components/NoteView.js

import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthProvider';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './styling/NoteView.css';

const NoteView = ({ openNote }) => {
  const { user } = useAuth();
  const [recentNotes, setRecentNotes] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  useEffect(() => {
    const fetchRecentNotes = async () => {
      if (!user) return;

      setLoading(true); // Start loading indicator

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
      } finally {
        setLoading(false); // Stop loading indicator
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

  /**
   * Assigns a consistent color from the predefined palette based on the note's unique ID.
   * @param {string} id - The unique identifier of the note.
   * @returns {string} - A hex color code from the predefined palette.
   */
  const getAssignedColor = (id) => {
    const colors = ['#f1ffc4', '#a7bed3', '#91D2D9', '#70d6ff', '#a0c4ff']; // Updated color palette
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  return (
    <div className="note-view-section">
      <div className="noteview-container">
        <div className="welcome-section">
          <h2>Your Recent Notes</h2>
        </div>

        {loading ? ( // Show loading indicator when fetching
          <div className="loading-indicator">
            <div className="dot-spinner">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        ) : recentNotes.length > 0 ? ( // Show recent notes if found
          <div className="recent-notes-section">
            <div className="recent-notes-grid">
              {recentNotes.map((note) => {
                const backgroundColor = getAssignedColor(note.id); // Get assigned color
                return (
                  <div
                    key={note.id}
                    className="note-card"
                    onClick={() => handleOpenNote(note)}
                    style={{ backgroundColor }} // Apply assigned color
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
                );
              })}
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
