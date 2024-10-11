// Sidebar.js

import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

const Sidebar = React.forwardRef((props, ref) => {
  const {
    folders,
    handleEditFolder,
    handleDeleteFolder,
    handleAddNote,
    openAddFolderModal,
    openNote,
    notes,
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
    isCreatingNote, // Added prop
  } = props;

  // Function to toggle folder dropdown
  const toggleFolderDropdown = (folderId) => {
    if (isFolderDropdownOpen && selectedFolderDropdown === folderId) {
        setIsFolderDropdownOpen(false);
        setSelectedFolderDropdown(null);
    } else {
        setIsFolderDropdownOpen(true);
        setSelectedFolderDropdown(folderId);
    }
};


  // Function to toggle note dropdown
  const toggleNoteDropdown = (noteId) => {
    if (isNoteDropdownOpen && selectedNoteDropdown === noteId) {
      setIsNoteDropdownOpen(false);
      setSelectedNoteDropdown(null);
    } else {
      setIsNoteDropdownOpen(true);
      setSelectedNoteDropdown(noteId);
      // Close folder dropdown if open
      if (isFolderDropdownOpen) {
        setIsFolderDropdownOpen(false);
        setSelectedFolderDropdown(null);
      }
    }
  };

  return (
    <div
      ref={ref}
      className={`collections-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
    >
      <h2>Collections</h2>
      {/* Add Folder Modal Trigger */}
      <button
        className="add-folder-button"
        onClick={openAddFolderModal}
        title="Add Collection"
      >
        Add Collection
      </button>

      <ul className="folders-list">
        {folders.map((folder) => (
          <li key={folder.id} className="folder-item">
            {/* Folder Header Container */}
            <div
              className="folder-header"
              onClick={() =>
                setSelectedFolder(selectedFolder === folder.id ? '' : folder.id)
              }
            >
              {/* Folder Toggle Arrow (at the far left) */}
              <span className="folder-toggle">
                {selectedFolder === folder.id ? '▼' : '▲'}
              </span>

              {/* Folder Name */}
              <span className="folder-name">{folder.name}</span>

              {/* Plus Icon for Adding Note within Collection */}
              <button
                className="add-note-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddNote();
                  setSelectedFolder(folder.id);
                }}
                title="Add Note"
                disabled={isCreatingNote} // Disable if creating a note
              >
                {isCreatingNote ? 'Creating...' : '+'} {/* Show 'Creating...' */}
              </button>

              {/* Wrapper for Dots Button and Dropdown */}
              <div className="dropdown-wrapper">
                {/* Three-Dot Menu Button */}
                <button
                  className="folder-dots"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFolderDropdown(folder.id);
                  }}
                  aria-label="Folder Options"
                  aria-haspopup="true"
                  aria-expanded={isFolderDropdownOpen && selectedFolderDropdown === folder.id}
                >
                  ⋮
                </button>

                {/* Dropdown for Folder Actions */}
                {isFolderDropdownOpen && selectedFolderDropdown === folder.id && (
                  <div className="folder-dropdown-container show-dropdown">
                    <ul>
                      <li
                        onClick={() => {
                          handleEditFolder(folder);
                          setIsFolderDropdownOpen(false);
                        }}
                      >
                        Edit
                      </li>
                      <li
                        onClick={() => {
                          handleDeleteFolder(folder.id);
                          setIsFolderDropdownOpen(false);
                        }}
                      >
                        Delete
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Notes List within Collection */}
            {selectedFolder === folder.id && (
              <Droppable droppableId={folder.id}>
                {(provided) => (
                  <ul
                    className="notes-list"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                  >
                    {notes
                      .filter((note) => note.folderId === folder.id)
                      .map((note, index) => (
                        <Draggable
                          key={note.id || `new-${index}`} // Fixed key
                          draggableId={note.id || `new-${index}`} // Fixed draggableId
                          index={index}
                        >
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
                            >
                              <span
                                className="note-title"
                                onClick={() => openNote(note)}
                              >
                                {note.title || 'Untitled Note'}
                              </span>
                              
                              {/* Wrapper for Note Dots Button and Dropdown */}
                              <div className="dropdown-wrapper">
                                {/* 3-Dot Dropdown for Notes */}
                                <button
                                  className="note-dots"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleNoteDropdown(note.id);
                                  }}
                                  aria-label="Note Options"
                                  aria-haspopup="true"
                                  aria-expanded={isNoteDropdownOpen && selectedNoteDropdown === note.id}
                                >
                                  ⋮
                                </button>

                                {/* Dropdown for Note Actions */}
                                {isNoteDropdownOpen && selectedNoteDropdown === note.id && (
                                  <div className="note-dropdown-container show-dropdown">
                                    <ul>
                                      <li
                                        onClick={() => {
                                          openNote(note);
                                          setIsNoteDropdownOpen(false);
                                        }}
                                      >
                                        Edit
                                      </li>
                                      <li
                                        onClick={() => {
                                          handleDeleteNote(note.id);
                                          setIsNoteDropdownOpen(false);
                                        }}
                                      >
                                        Delete
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
        ))}
      </ul> 
    </div>
  );
});

export default Sidebar;
