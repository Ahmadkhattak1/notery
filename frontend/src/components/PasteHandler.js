// PasteHandler.js

import { Extension } from '@tiptap/core';

const PasteHandler = Extension.create({
  name: 'pasteHandler',

  addProseMirrorPlugins() {
    return [
      new this.editor.constructor.PMPlugin({
        props: {
          handlePaste: (view, event) => {
            const items = (event.clipboardData || event.originalEvent.clipboardData).items;
            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
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
                event.preventDefault();
                return true;
              }
            }
            return false;
          },
        },
      }),
    ];
  },
});

export default PasteHandler;
