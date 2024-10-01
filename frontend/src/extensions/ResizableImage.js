// src/extensions/ResizableImage.js

import { Node, mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '250px',
        rendered: false,
        parseHTML: element => element.getAttribute('data-width') || '250px',
        renderHTML: attributes => {
          return {
            ...attributes,
            'data-width': attributes.width,
            style: `width: ${attributes.width}; height: auto;`,
          };
        },
      },
    };
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';

      const img = document.createElement('img');
      img.src = node.attrs.src;
      img.style.width = node.attrs.width || '250px';
      img.style.height = 'auto';

      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.right = '0';
      resizeHandle.style.width = '15px';
      resizeHandle.style.height = '15px';
      resizeHandle.style.background = 'rgba(0, 0, 0, 0.5)';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.borderRadius = '50%';

      wrapper.appendChild(img);
      wrapper.appendChild(resizeHandle);

      const onMouseDown = (event) => {
        event.preventDefault();
        isDragging = true;
        startX = event.clientX;
        startWidth = img.offsetWidth;

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      };

      const onMouseMove = (event) => {
        if (!isDragging) return;

        const deltaX = event.clientX - startX;
        const newWidth = startWidth + deltaX;

        if (newWidth > 50) { // Minimum width
          img.style.width = `${newWidth}px`;
        }
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        // Update the node's attributes with the new width
        editor.chain().focus().command(({ tr }) => {
          tr.setNodeMarkup(getPos(), undefined, {
            ...node.attrs,
            width: img.style.width,
          });
          return true;
        }).run();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      resizeHandle.addEventListener('mousedown', onMouseDown);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'image') {
            return false;
          }
          img.src = updatedNode.attrs.src;
          img.style.width = updatedNode.attrs.width || '300px';
          return true;
        },
        destroy() {
          resizeHandle.removeEventListener('mousedown', onMouseDown);
        },
      };
    };
  },
});

export default ResizableImage;
