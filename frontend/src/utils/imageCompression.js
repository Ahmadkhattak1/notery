// src/utils/imageCompression.js

import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file to the specified maximum size.
 *
 * @param {File} file - The image file to compress.
 * @param {number} maxSizeMB - The maximum size of the compressed image in MB.
 * @param {number} maxWidthOrHeight - The maximum width or height of the compressed image.
 * @returns {Promise<File>} - The compressed image file.
 */
export const compressImage = async (file, maxSizeMB, maxWidthOrHeight) => {
  try {
    const options = {
      maxSizeMB: maxSizeMB,
      maxWidthOrHeight: maxWidthOrHeight,
      useWebWorker: true,
    };

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};
