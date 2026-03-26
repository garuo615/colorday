import type { FixedCategory } from '../types';

export const CATEGORY_COLORS: Record<FixedCategory, string> = {
  仕事: '#4A90D9',
  食事: '#F5A623',
  趣味: '#7ED321',
  睡眠: '#2C3E7A',
  移動: '#9B9B9B',
  運動: '#D0021B',
  身支度: '#E91E8C',
  休憩: '#F8E71C',
};

export const FIXED_CATEGORIES: FixedCategory[] = [
  '仕事', '食事', '趣味', '睡眠', '移動', '運動', '身支度', '休憩',
];

// Generate a random pastel color for custom categories
const customColorMap = new Map<string, string>();

export function getCategoryColor(category: string): string {
  if (category in CATEGORY_COLORS) {
    return CATEGORY_COLORS[category as FixedCategory];
  }
  if (customColorMap.has(category)) {
    return customColorMap.get(category)!;
  }
  // Generate pastel: hue random, high saturation & lightness
  const hue = Math.floor(Math.random() * 360);
  const color = `hsl(${hue}, 70%, 65%)`;
  customColorMap.set(category, color);
  return color;
}
