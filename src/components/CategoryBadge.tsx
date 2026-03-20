import React from 'react';
import { getCategoryColor } from '../utils/colors';

interface Props {
  category: string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<Props> = ({ category, size = 'md' }) => {
  const color = getCategoryColor(category);
  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';
  return (
    <span
      className={`inline-block rounded-full font-medium ${padding}`}
      style={{ backgroundColor: color, color: getTextColor(color) }}
    >
      {category}
    </span>
  );
};

// Simple contrast: use white text on dark backgrounds
function getTextColor(bg: string): string {
  // For hsl pastel colors, text is dark
  if (bg.startsWith('hsl')) return '#333';
  // Parse hex
  const hex = bg.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#333' : '#fff';
}
