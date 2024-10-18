// src/components/FolderModal.js

import React, { useRef } from 'react';
import Modal from 'react-modal';

const FolderModal = ({
  isFolderModalOpen,
  setIsFolderModalOpen,
  folderName,
  setFolderName,
  editingFolder,
  editFolderName,
  setEditFolderName,
  handleAddFolder,
  handleRenameFolder,
  isCreatingFolder,
}) => {
  const titleInputRef = useRef(null);

  return (
    <Modal
      isOpen={isFolderModalOpen}
      onRequestClose={() => setIsFolderModalOpen(false)}
      contentLabel={editingFolder ? 'Edit Folder' : 'Add Folder'}
      className="modal-content"
      overlayClassName="ReactModal__Overlay"
    >
      <div className="folder-modal-content">
        <h2>{editingFolder ? 'Edit Folder' : 'Add Folder'}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (editingFolder) {
              handleRenameFolder();
            } else {
              handleAddFolder();
            }
          }}
        >
          <input
            type="text"
            value={editingFolder ? editFolderName : folderName}
            onChange={(e) =>
              editingFolder
                ? setEditFolderName(e.target.value)
                : setFolderName(e.target.value)
            }
            placeholder="Folder Name"
            required
            className="folder-name-input"
            ref={titleInputRef}
            autoFocus
          />
          <div className="modal-buttons">
            <button type="submit" className="save-button" disabled={isCreatingFolder}>
              {isCreatingFolder ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              className="cancel-button"
              onClick={() => setIsFolderModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default FolderModal;
