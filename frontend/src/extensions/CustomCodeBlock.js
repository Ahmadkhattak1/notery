// src/extensions/CustomCodeBlock.js

import { CodeBlock } from '@tiptap/extension-code-block';

const CustomCodeBlock = CodeBlock.extend({
  name: 'customCodeBlock',

  addKeyboardShortcuts() {
    return {
      'Mod-Alt-c': () => this.editor.commands.toggleCodeBlock(),
      'Enter': () => {
        const { state, commands } = this.editor;
        const { $from } = state.selection;
        const currentNode = $from.node();

        if (currentNode.type.name === 'customCodeBlock') {
          const text = currentNode.text || '';
          const lines = text.split('\n');

          // If the last line is empty, exit the code block
          if (lines[lines.length - 1].trim() === '') {
            commands.setParagraph();
            return true;
          }
        }

        return false;
      },
    };
  },

  addCommands() {
    return {
      toggleCodeBlock:
        () =>
        ({ commands, state, chain }) => {
          const { from, to, empty } = state.selection;

          if (empty) {
            // If the selection is empty, toggle code block for the current block
            return commands.toggleCodeBlock();
          }

          // Determine if the entire selection is already a code block
          let isEntireSelectionCodeBlock = true;
          state.doc.nodesBetween(from, to, (node) => {
            if (node.type.name !== 'customCodeBlock') {
              isEntireSelectionCodeBlock = false;
            }
          });

          if (isEntireSelectionCodeBlock) {
            // If the entire selection is a code block, toggle it off to paragraphs
            return chain().setBlockType('paragraph').run();
          } else {
            // Otherwise, wrap the entire selection in a single code block
            return chain()
              .command(({ tr, state }) => {
                // Replace the selection with a single code block containing the selected text
                const selectedText = state.doc.textBetween(from, to, '\n');
                tr.replaceWith(
                  from,
                  to,
                  state.schema.nodes.customCodeBlock.create(
                    null,
                    state.schema.text(selectedText)
                  )
                );
                // Set the selection inside the new code block
                tr.setSelection(
                  state.selection.constructor.near(tr.doc.resolve(from))
                );
                return true;
              })
              .run();
          }
        },
    };
  },
});

export default CustomCodeBlock;
