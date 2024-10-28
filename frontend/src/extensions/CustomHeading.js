// src/extensions/CustomHeading.js

import { Heading } from '@tiptap/extension-heading';
import { mergeAttributes } from '@tiptap/core';

const CustomHeading = Heading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const level = this.options.levels.includes(node.attrs.level)
      ? node.attrs.level
      : this.options.levels[0];

    // Set default colors and font sizes based on heading level
    let defaultColor = '';
    let defaultFontSize = '';

    if (level === 1) {
      defaultColor = '#1c1c1c'; // Blue for H1
      defaultFontSize = '1.5em'; // Adjust as needed
    } else if (level === 2) {
      defaultColor = '#3d3d3d'; // Orange for H2
      defaultFontSize = '1.2em'; // Adjust as needed
    }

    // Apply default styles if not already set
    const style = HTMLAttributes.style || '';
    const hasColor = style.includes('color');
    const hasFontSize = style.includes('font-size');

    HTMLAttributes.style = `${style}${!hasColor && defaultColor ? `color: ${defaultColor};` : ''}${!hasFontSize && defaultFontSize ? `font-size: ${defaultFontSize};` : ''}`;

    return [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});

export default CustomHeading;
