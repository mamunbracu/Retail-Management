export const safeJsonParse = (str: any, fallback: any = []) => {
  if (!str) return fallback;
  if (typeof str !== 'string') return str;
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn("Failed to parse JSON:", str);
    return fallback;
  }
};
