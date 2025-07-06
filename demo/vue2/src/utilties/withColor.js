import Color from 'color';

export function withColor(input) {
  if (typeof input !== 'string') return 'none';

  try {
    return Color(input);
  } catch (e) {
    return 'none'
  }
}