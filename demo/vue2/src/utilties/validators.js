export function validateURL(input) {
  try {
    const url = new URL(input, window.location.origin);
    return url.href;
  } catch (e) {
    return false;
  }
}