// src/extensions/CustomHeading.js

import { Heading } from '@tiptap/extension-heading';
import { mergeAttributes } from '@tiptap/core';

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level
      : this.options.levels[0];

    // Set default colors based on heading level
    let defaultColor = '';
    if (level === 1) {
      defaultColor = '#6495ED'; // Blue for H1
    } else if (level === 2) {
      defaultColor = '#FFBF00'; // Orange for H2
    }

    // Apply default color if no color style is already set
    if (!HTMLAttributes.style || !HTMLAttributes.style.includes('color')) {
      HTMLAttributes.style = `${HTMLAttributes.style || ''}color: ${defaultColor};`;
    }

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

export default CustomHeading;
