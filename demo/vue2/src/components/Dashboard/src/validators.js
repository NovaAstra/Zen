export function validateLayout(input) {
  if (!Array.isArray(input)) return false;

  return input.every(item =>
    item &&
    typeof item === 'object' &&
    typeof item.i === 'string' && item.i.trim() !== ''
  );
}