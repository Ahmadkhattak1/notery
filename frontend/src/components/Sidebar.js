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
  } = props;

  return (
    <div
      ref={ref}
      className={`collections-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}
    >
      <h2>Collections</h2>
      {/* Add Folder Modal Trigger */}
      <button
        className="add-folder-button"
        onClick={() => {
          openAddFolderModal();
        }}
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
              >
                +
              </button>

              {/* Three-Dot Menu Button */}
              <button
                className="folder-dots"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolderDropdown(
                    selectedFolderDropdown === folder.id ? null : folder.id
                  );
                  setIsFolderDropdownOpen(selectedFolderDropdown !== folder.id);
                }}
                aria-label="Folder Options"
              >
                ⋮
              </button>
            </div>

            {/* Dropdown for Folder Actions */}
            {isFolderDropdownOpen && selectedFolderDropdown === folder.id && (
              <div className="folder-dropdown-container folder-management-dropdown show-dropdown">
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
                          key={note.id || `new-${index}`}
                          draggableId={note.id || `new-${index}`}
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
                              {/* 3-Dot Dropdown for Notes */}
                              <button
                                className="note-dots"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNoteDropdown(
                                    selectedNoteDropdown === note.id ? null : note.id
                                  );
                                  setIsNoteDropdownOpen(
                                    selectedNoteDropdown !== note.id
                                  );
                                }}
                                aria-label="Note Options"
                              >
                                ⋮
                              </button>

                              {/* Dropdown for Note Actions */}
                              {isNoteDropdownOpen &&
                                selectedNoteDropdown === note.id && (
                                  <div className="note-dropdown-container note-management-dropdown show-dropdown">
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
