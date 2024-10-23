// src/components/Sidebar.js

import { useNavigate } from 'react-router-dom';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import './styling/Sidebar.css';
import {
  FaChevronDown,
  FaChevronUp,
  FaEllipsisV,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaInfoCircle,
  FaClock, // Import FaClock for Recent Notes
} from 'react-icons/fa';
import Modal from 'react-modal';
import debounce from 'lodash.debounce';

// Set the app element for accessibility
Modal.setAppElement('#root');

const Sidebar = React.forwardRef((props, ref) => {
  const {
    folders = [],
    handleEditFolder,
    handleDeleteFolder,
    handleAddNote,
    openAddFolderModal,
    openNote,
    notes = {},
    activeNote,
    selectedFolder,
    setSelectedFolder,
    isFolderDropdownOpen,
    setIsFolderDropdownOpen,
    selectedFolderDropdown,
    setSelectedFolderDropdown,
    isSidebarOpen,
    setIsSidebarOpen,
    selectedNoteDropdown,
    setSelectedNoteDropdown,
    isNoteDropdownOpen,
    setIsNoteDropdownOpen,
    handleDeleteNote,
    isCreatingNote,
    perFolderLoadingNotes,
    perFolderHasMoreNotes,
    loadMoreNotes,
  } = props;

  const sidebarRef = useRef(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  const navigate = useNavigate();

  // State for Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    type: '', // 'note' or 'folder'
    id: '',
    name: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredNotes, setFilteredNotes] = useState({});
  const [isSearching, setIsSearching] = useState(false);

  const checkOverflow = () => {
    const sidebar = sidebarRef.current;
    if (sidebar) {
      setHasOverflow(sidebar.scrollHeight > sidebar.clientHeight);
    }
  };

  useEffect(() => {
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [folders, notes, isSidebarOpen]);

  useEffect(() => {
    checkOverflow();
  }, [folders, notes, isSidebarOpen]);

  // Function to open the confirmation modal
  const openConfirmModal = (type, id, name = '') => {
    setModalContent({ type, id, name });
    setIsConfirmModalOpen(true);
  };

  // Function to close the confirmation modal
  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setModalContent({ type: '', id: '', name: '' });
  };

  // Handle confirmation action
  const handleConfirm = () => {
    const { type, id } = modalContent;
    if (type === 'note') {
      handleDeleteNote(id);
    } else if (type === 'folder') {
      handleDeleteFolder(id);
    }
    closeConfirmModal();
  };

  const toggleFolderDropdown = (folderId) => {
    if (isFolderDropdownOpen && selectedFolderDropdown === folderId) {
      setIsFolderDropdownOpen(false);
      setSelectedFolderDropdown(null);
    } else {
      setIsFolderDropdownOpen(true);
      setSelectedFolderDropdown(folderId);
    }
    // Close note dropdown when folder dropdown is opened
    if (isNoteDropdownOpen) {
      setIsNoteDropdownOpen(false);
      setSelectedNoteDropdown(null);
    }
  };

  const toggleNoteDropdown = (noteId) => {
    if (isNoteDropdownOpen && selectedNoteDropdown === noteId) {
      setIsNoteDropdownOpen(false);
      setSelectedNoteDropdown(null);
    } else {
      setIsNoteDropdownOpen(true);
      setSelectedNoteDropdown(noteId);
    }
    // Close folder dropdown when note dropdown is opened
    if (isFolderDropdownOpen) {
      setIsFolderDropdownOpen(false);
      setSelectedFolderDropdown(null);
    }
  };

  const confirmAndDeleteNote = (noteId) => {
    openConfirmModal('note', noteId);
  };

  const confirmAndDeleteFolder = (folderId, folderName) => {
    openConfirmModal('folder', folderId, folderName);
  };

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((query) => {
      performSearch(query);
    }, 500),
    [notes]
  );

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredNotes({});
      setIsSearching(false);
    } else {
      setIsSearching(true);
      debouncedSearch(searchQuery);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const performSearch = (query) => {
    console.log('Performing search for query:', query);
    let results = {};

    // Priority search on titles
    Object.keys(notes).forEach((folderId) => {
      notes[folderId].forEach((note) => {
        if (note.title && note.title.toLowerCase().includes(query.toLowerCase())) {
          if (!results[folderId]) results[folderId] = [];
          results[folderId].push(note);
        }
      });
    });

    // If no results from title, search in content
    if (Object.keys(results).length === 0) {
      console.log('No title matches found, performing full-text search');
      Object.keys(notes).forEach((folderId) => {
        notes[folderId].forEach((note) => {
          if (
            note.content &&
            note.content.toLowerCase().includes(query.toLowerCase())
          ) {
            if (!results[folderId]) results[folderId] = [];
            results[folderId].push(note);
          }
        });
      });
    }

    setFilteredNotes(results);
  };

  return (
    <div
      ref={(node) => {
        sidebarRef.current = node;
        if (ref) ref.current = node;
      }}
      className={`collections-sidebar ${isSidebarOpen ? 'open' : 'closed'} ${
        hasOverflow ? 'has-overflow' : ''
      }`}
    >
      {/* Confirmation Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onRequestClose={closeConfirmModal}
        contentLabel="Confirmation Modal"
        className="confirmation-modal"
        overlayClassName="confirmation-modal-overlay"
      >
        <h2>Confirm Deletion</h2>
        <p>
          {modalContent.type === 'note'
            ? 'Are you sure you want to delete this note? This action cannot be undone.'
            : `Are you sure you want to delete the folder "${modalContent.name}"? All notes within will also be permanently deleted. This action cannot be undone.`}
        </p>
        <div className="modal-buttons">
          <button onClick={handleConfirm} className="confirm-button">
            Yes, Delete
          </button>
          <button onClick={closeConfirmModal} className="cancel-button">
            Cancel
          </button>
        </div>
      </Modal>

      <div className="sidebar-header">
        <h2>Collections</h2>
        <button
          className="toggle-sidebar-button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
        >
          {isSidebarOpen ? '<' : '>'}
        </button>
      </div>

      {/* Search Input */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search notes..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-input"
          aria-label="Search Notes"
        />
        <FaSearch className="search-icon" />
        {/* Conditionally render info icon with CSS tooltip */}
        {isSearching && (
          <div className="search-info">
            <span
              className="info-icon"
              data-tooltip="Search is limited to note titles using prefix matching and full-text search on loaded notes only."
            >
              <FaInfoCircle />
            </span>
          </div>
        )}
      </div>

      {/* Conditionally render helper text */}
      {isSearching && (
        <p className="search-helper-text">
          Search is limited to note titles with prefix matching and full-text search on loaded notes only.
        </p>
      )}

      {/* Recent Notes Button */}
      <button
        className="recent-notes-button"
        onClick={() => navigate('/notes')}
        title="Recent Notes"
      >
        <FaClock className="recent-notes-icon" /> Recent Notes
      </button>

      {/* Add Collection Button */}
      <button
        className="add-folder-button"
        onClick={openAddFolderModal}
        title="Add Collection"
      >
        <FaPlus className="add-icon" /> Add Collection
      </button>

      {/* Divider */}
      <div className="sidebar-divider"></div>

      <ul className="folders-list">
        {folders.map((folder) => {
          // Use filteredNotes if searching
          const folderNotes = isSearching
            ? filteredNotes[folder.id] || []
            : notes[folder.id] || [];

          // Skip folders with no matching notes during search
          if (isSearching && folderNotes.length === 0) {
            return null;
          }

          return (
            <li key={folder.id} className="folder-item">
              <div
                className="folder-header"
                onClick={() => setSelectedFolder(folder.id)}
              >
                <span className="folder-toggle">
                  {selectedFolder === folder.id ? <FaChevronDown /> : <FaChevronUp />}
                </span>

                <span className="folder-name" title={folder.name}>
                  {folder.name}
                </span>

                <button
                  className="add-note-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNote(folder.id);
                    setSelectedFolder(folder.id);
                  }}
                  title="Add Note"
                  disabled={isCreatingNote}
                >
                  <FaPlus />
                </button>

                <div className="dropdown-wrapper">
                  <button
                    className="folder-dots"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolderDropdown(folder.id);
                    }}
                    aria-label="Folder Options"
                    aria-haspopup="true"
                    aria-expanded={
                      isFolderDropdownOpen && selectedFolderDropdown === folder.id
                    }
                  >
                    <FaEllipsisV />
                  </button>

                  {isFolderDropdownOpen && selectedFolderDropdown === folder.id && (
                    <div className="folder-dropdown-container show-dropdown">
                      <ul>
                        <li
                          onClick={() => {
                            handleEditFolder(folder);
                            setIsFolderDropdownOpen(false);
                          }}
                        >
                          <FaEdit className="dropdown-icon" /> Edit
                        </li>
                        <li
                          onClick={() => {
                            confirmAndDeleteFolder(folder.id, folder.name);
                          }}
                        >
                          <FaTrash className="dropdown-icon" /> Delete
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {selectedFolder === folder.id && (
                <Droppable droppableId={folder.id}>
                  {(provided) => (
                    <ul
                      className="notes-list"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      {folderNotes.map((note, index) => (
                        <Draggable key={note.id} draggableId={note.id} index={index}>
                          {(provided) => (
                            <li
                              className={`note-title-item ${
                                activeNote && activeNote.id === note.id
                                  ? 'active-note'
                                  : ''
                              }`}
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => navigate(`/notes/${folder.id}/${note.id}`)}
                            >
                              <span
                                className="note-title"
                                title={note.title || 'Untitled Note'}
                              >
                                {note.title || 'Untitled Note'}
                              </span>

                              <div className="dropdown-wrapper">
                                <button
                                  className="note-dots"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNoteDropdown(note.id);
                                  }}
                                  aria-label="Note Options"
                                  aria-haspopup="true"
                                  aria-expanded={
                                    isNoteDropdownOpen && selectedNoteDropdown === note.id
                                  }
                                >
                                  <FaEllipsisV />
                                </button>

                                {isNoteDropdownOpen && selectedNoteDropdown === note.id && (
                                  <div className="note-dropdown-container show-dropdown">
                                    <ul>
                                      <li
                                        onClick={() => {
                                          // Navigate to the note's URL
                                          navigate(`/notes/${folder.id}/${note.id}`);
                                          setIsNoteDropdownOpen(false);
                                        }}
                                      >
                                        <FaEdit className="dropdown-icon" /> Edit
                                      </li>
                                      <li
                                        onClick={() => {
                                          confirmAndDeleteNote(note.id);
                                        }}
                                      >
                                        <FaTrash className="dropdown-icon" /> Delete
                                      </li>
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </li>
                          )}
                        </Draggable>
                      ))}

                      {provided.placeholder}
                    </ul>
                  )}
                </Droppable>
              )}
            </li>
          );
        })}

        {/* Show message if no notes are found during search */}
        {isSearching && Object.keys(filteredNotes).length === 0 && (
          <li className="no-notes-found">No notes found.</li>
        )}
      </ul>
    </div>
  );
});

export default Sidebar;
