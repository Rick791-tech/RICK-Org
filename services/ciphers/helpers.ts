// helpers.ts
// A quiet little corner of our library, my friend, for the unsung heroes.
// These helper functions provide the mathematical and logical support that
// our more complex ciphers rely on. Centralizing them here ensures that
// our code is clean, dry, and efficient. A place for pure, reusable logic.

/**
 * A helper for our more mathematically intense ciphers, like Hill and Affine.
 * It finds the modular multiplicative inverse of a number 'a' under modulo 'm'.
 * Essential for creating decryption keys! A beautiful piece of number theory.
 * Returns -1 if no inverse exists.
 */
export const modInverse = (a: number, m: number): number => {
  // Ensure 'a' is in the range [0, m-1]
  a = ((a % m) + m) % m;
  
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) {
      return x;
    }
  }
  return -1; // No inverse found
};

/**
 * Creates a standard 26-letter substitution alphabet from a keyword.
 * Duplicates in the keyword are removed, and the rest of the alphabet follows.
 * e.g., 'gemini' -> 'geminabcdfhjklopqrstuvwxyz'
 */
export const generateKeywordAlphabet = (key: string, alphabet = 'abcdefghijklmnopqrstuvwxyz'): string => {
  const keySanitized = key.toLowerCase().replace(new RegExp(`[^${alphabet}]`, 'g'), '');
  const keySet = new Set(keySanitized.split(''));
  return [...keySet, ...alphabet.split('').filter(c => !keySet.has(c))].join('');
};

/**
 * A general-purpose text sanitizer for many classical ciphers.
 */
export const sanitizeText = (text: string, alphabet = 'abcdefghijklmnopqrstuvwxyz'): string => {
    const regex = new RegExp(`[^${alphabet}]`, 'g');
    return text.toLowerCase().replace(regex, '');
};
