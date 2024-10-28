// src/components/Breadcrumbs.js

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import './styling/Breadcrumbs.css'; // Ensure you create appropriate styles

const Breadcrumbs = () => {
  const { folderId, noteId } = useParams();
  const [folderName, setFolderName] = useState('');
  const [noteTitle, setNoteTitle] = useState('');

  useEffect(() => {
    const fetchFolderName = async () => {
      if (folderId && folderId !== 'unassigned') {
        try {
          const folderRef = doc(db, 'folders', folderId);
          const folderSnap = await getDoc(folderRef);
          if (folderSnap.exists()) {
            setFolderName(folderSnap.data().name);
          } else {
            setFolderName('Unknown Folder');
          }
        } catch (error) {
          console.error('Error fetching folder name:', error);
          setFolderName('Error Folder');
        }
      } else {
        setFolderName('Unassigned');
      }
    };

    const fetchNoteTitle = async () => {
      if (noteId) {
        try {
          const noteRef = doc(db, 'notes', noteId);
          const noteSnap = await getDoc(noteRef);
          if (noteSnap.exists()) {
            setNoteTitle(noteSnap.data().title || 'Untitled Note');
          } else {
            setNoteTitle('Unknown Note');
          }
        } catch (error) {
          console.error('Error fetching note title:', error);
          setNoteTitle('Error Note');
        }
      } else {
        setNoteTitle('');
      }
    };

    fetchFolderName();
    fetchNoteTitle();
  }, [folderId, noteId]);

  return (
    <nav className="breadcrumbs">
      <ul>
        <li>
          <Link to="/notes">All Notes</Link>
        </li>
        {folderId && (
          <li>
            <Link to={`/notes/${folderId}`}>{folderName}</Link>
          </li>
        )}
        {noteId && (
          <li>
            <span>{noteTitle}</span>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Breadcrumbs;
