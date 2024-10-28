// PasteHandler.js

import { Extension } from '@tiptap/core';
import { Plugin } from 'prosemirror-state';

const PasteHandler = Extension.create({
  name: 'pasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData || event.originalEvent.clipboardData;
            const htmlData = clipboardData.getData('text/html');
            const plainText = clipboardData.getData('text/plain');

            // Function to create a code block node
            const insertCodeBlock = (code) => {
              const node = view.state.schema.nodes.code_block.create({
                params: { language: 'javascript' }, // You can adjust the default language or make it dynamic
              }, view.state.schema.text(code));
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };

            // Check if the pasted content contains a code block
            if (htmlData) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlData, 'text/html');
              const codeBlock = doc.querySelector('pre > code');

              if (codeBlock) {
                event.preventDefault();
                const codeText = codeBlock.textContent;
                insertCodeBlock(codeText);
                return true;
              }

              // Handle images as before
              const items = clipboardData.items;
              let handled = false;

              for (const item of items) {
                if (item.type.startsWith('image/')) {
                  const file = item.getAsFile();
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (readerEvent) => {
                      const node = view.state.schema.nodes.image.create({
                        src: readerEvent.target.result,
                      });
                      const transaction = view.state.tr.replaceSelectionWith(node);
                      view.dispatch(transaction);
                    };
                    reader.readAsDataURL(file);
                  }
                  handled = true;
                }
              }

              if (handled) {
                event.preventDefault();
                return true;
              }
            }

            // Fallback: If plain text is detected as code (optional)
            if (plainText && /^```[\s\S]*```$/.test(plainText.trim())) {
              event.preventDefault();
              const codeContent = plainText.trim().replace(/^```[\s\S]*```$/, '').trim();
              insertCodeBlock(codeContent);
              return true;
            }

            return false;
          },
        },
      }),
    ];
  },
});

export default PasteHandler;
