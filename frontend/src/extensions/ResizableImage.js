// src/extensions/ResizableImage.js

import { Node } from '@tiptap/core';
import { mergeAttributes } from '@tiptap/core';
import Image from '@tiptap/extension-image';

const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '250px',
        parseHTML: element => element.getAttribute('data-width') || '250px',
        renderHTML: attributes => ({
          'data-width': attributes.width,
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
      minimized: {
        default: false,
        parseHTML: element => element.getAttribute('data-minimized') === 'true',
        renderHTML: attributes => ({
          'data-minimized': attributes.minimized ? 'true' : 'false',
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[data-resizable-image]',
        getAttrs: element => {
          return {
            src: element.getAttribute('src'),
            width: element.getAttribute('data-width') || '250px',
            minimized: element.getAttribute('data-minimized') === 'true',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes({ 'data-resizable-image': '' }, HTMLAttributes)];
  },

  group: 'inline',
  inline: true,
  atom: true,

  addNodeView() {
    return ({ node, getPos, editor }) => {
      let isDragging = false;
      let startX = 0;
      let startWidth = 0;
      let currentNode = node; // Keep track of the current node

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'block';
      wrapper.style.margin = '10px 0';

      // Add spacing above the image
      const spacerTop = document.createElement('div');
      spacerTop.style.height = '1em';
      wrapper.appendChild(spacerTop);

      const content = document.createElement('div');
      content.style.position = 'relative';
      content.style.display = 'inline-block';

      const img = document.createElement('img');
      img.src = currentNode.attrs.src;
      img.style.width = currentNode.attrs.width || '250px';
      img.style.height = 'auto';
      img.style.display = currentNode.attrs.minimized ? 'none' : 'block';

      // Placeholder when minimized
      const placeholder = document.createElement('div');
      placeholder.style.width = currentNode.attrs.width || '250px';
      placeholder.style.height = '50px';
      placeholder.style.display = currentNode.attrs.minimized ? 'flex' : 'none';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.backgroundColor = '#f0f0f0';
      placeholder.style.border = '1px solid #ccc';
      placeholder.textContent = 'Image minimized (click to expand)';
      placeholder.style.cursor = 'pointer';

      const onPlaceholderClick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const minimized = false;
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, {
              ...currentNode.attrs,
              minimized,
            });
            return true;
          })
          .run();
      };
      placeholder.addEventListener('click', onPlaceholderClick);

      content.appendChild(img);
      content.appendChild(placeholder);

      // Controls container
      const controls = document.createElement('div');
      controls.style.position = 'absolute';
      controls.style.top = '5px';
      controls.style.left = '5px';
      controls.style.display = 'flex';
      controls.style.gap = '5px';

      // Delete Button
      const deleteButton = document.createElement('button');
      deleteButton.textContent = '✖';
      deleteButton.style.background = 'rgba(255, 255, 255, 0.7)';
      deleteButton.style.border = 'none';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.fontSize = '16px';
      deleteButton.style.padding = '2px';

      const onDelete = (event) => {
        event.preventDefault();
        event.stopPropagation();
        editor.chain().focus().deleteRange({ from: getPos(), to: getPos() + currentNode.nodeSize }).run();
      };
      deleteButton.addEventListener('click', onDelete);

      // Minimize Button
      const minimizeButton = document.createElement('button');
      minimizeButton.textContent = currentNode.attrs.minimized ? '🔍' : '➖';
      minimizeButton.style.background = 'rgba(255, 255, 255, 0.7)';
      minimizeButton.style.border = 'none';
      minimizeButton.style.cursor = 'pointer';
      minimizeButton.style.fontSize = '16px';
      minimizeButton.style.padding = '2px';

      const onToggleMinimize = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const minimized = !currentNode.attrs.minimized;
        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, {
              ...currentNode.attrs,
              minimized,
            });
            return true;
          })
          .run();
      };
      minimizeButton.addEventListener('click', onToggleMinimize);

      controls.appendChild(deleteButton);
      controls.appendChild(minimizeButton);

      content.appendChild(controls);

      // Resize Handle
      const resizeHandle = document.createElement('div');
      resizeHandle.style.position = 'absolute';
      resizeHandle.style.bottom = '0';
      resizeHandle.style.right = '0';
      resizeHandle.style.width = '15px';
      resizeHandle.style.height = '15px';
      resizeHandle.style.background = 'rgba(0, 0, 0, 0.5)';
      resizeHandle.style.cursor = 'nwse-resize';
      resizeHandle.style.borderRadius = '50%';

      const onMouseDown = (event) => {
        event.preventDefault();
        event.stopPropagation(); // Prevent event from bubbling up
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

        if (newWidth > 50) {
          img.style.width = `${newWidth}px`;
          placeholder.style.width = `${newWidth}px`;
        }
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;

        editor
          .chain()
          .focus()
          .command(({ tr }) => {
            tr.setNodeMarkup(getPos(), undefined, {
              ...currentNode.attrs,
              width: img.style.width,
            });
            return true;
          })
          .run();

        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      resizeHandle.addEventListener('mousedown', onMouseDown);

      content.appendChild(resizeHandle);

      wrapper.appendChild(content);

      // Add spacing below the image and place the cursor there
      const spacerBottom = document.createElement('div');
      spacerBottom.style.height = '1em';
      wrapper.appendChild(spacerBottom);

      return {
        dom: wrapper,
        update: (updatedNode) => {
          if (updatedNode.type.name !== 'image') {
            return false;
          }
          currentNode = updatedNode; // Update the current node

          img.src = updatedNode.attrs.src;
          img.style.width = updatedNode.attrs.width || '250px';
          img.style.display = updatedNode.attrs.minimized ? 'none' : 'block';

          placeholder.style.width = updatedNode.attrs.width || '250px';
          placeholder.style.display = updatedNode.attrs.minimized ? 'flex' : 'none';

          minimizeButton.textContent = updatedNode.attrs.minimized ? '🔍' : '➖';

          return true;
        },
        destroy() {
          resizeHandle.removeEventListener('mousedown', onMouseDown);
          deleteButton.removeEventListener('click', onDelete);
          minimizeButton.removeEventListener('click', onToggleMinimize);
          placeholder.removeEventListener('click', onPlaceholderClick);
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        },
      };
    };
  },
});

export default ResizableImage;
