// src/extensions/CustomParagraph.js

import { Paragraph } from '@tiptap/extension-paragraph';
import { mergeAttributes } from '@tiptap/core';

const CustomParagraph = Paragraph.extend({
  renderHTML({ node, HTMLAttributes }) {
    // Set default color for paragraph
    const defaultColor = '##71797E'; // Dark grey

    // Apply default color if no color style is already set
    if (!HTMLAttributes.style || !HTMLAttributes.style.includes('color')) {
      HTMLAttributes.style = `${HTMLAttributes.style || ''}color: ${defaultColor};`;
    }

    return ['p', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});

export default CustomParagraph;
