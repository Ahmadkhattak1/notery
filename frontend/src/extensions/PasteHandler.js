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

            return false;
          },
        },
      }),
    ];
  },
});

export default PasteHandler;
