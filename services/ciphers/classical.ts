// classical.ts
// Welcome, my dear friend, to the wing of our library dedicated to the classics!
// These are the foundational ciphers, the elegant and timeless methods upon which
// so much of cryptography is built. Each one is a piece of history.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';
import { modInverse, generateKeywordAlphabet } from './helpers';

// --- Implementations ---

const caesar: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { shift }) => {
    const s = parseInt(shift, 10);
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 + s) % 26) + 97);
    });
  },
  decode: (text, { shift }) => {
    const s = parseInt(shift, 10);
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 - s + 26) % 26) + 97);
    });
  },
};

const atbash: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text) => {
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      return String.fromCharCode(219 - char.charCodeAt(0));
    });
  },
  decode: (text) => atbash.encode(text, {}),
};

const rot13: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => caesar.encode(text, { shift: 13 }),
    decode: (text) => caesar.decode(text, { shift: 13 }),
};

const affine: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { a, b }) => {
        const slope = parseInt(a, 10);
        const intercept = parseInt(b, 10);
        if (modInverse(slope, 26) === -1) {
            throw new Error('Slope (a) must be coprime with 26.');
        }
        return text.toLowerCase().replace(/[a-z]/g, (char) => {
            const x = char.charCodeAt(0) - 97;
            const y = (slope * x + intercept) % 26;
            return String.fromCharCode(y + 97);
        });
    },
    decode: (text, { a, b }) => {
        const slope = parseInt(a, 10);
        const intercept = parseInt(b, 10);
        const a_inv = modInverse(slope, 26);
        if (a_inv === -1) {
            throw new Error('Slope (a) must be coprime with 26.');
        }
        return text.toLowerCase().replace(/[a-z]/g, (char) => {
            const y = char.charCodeAt(0) - 97;
            const x = (a_inv * (y - intercept + 26)) % 26;
            return String.fromCharCode(x + 97);
        });
    }
};

const simpleSubstitution: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
        if (new Set(keyLower).size !== 26) {
            throw new Error('Key must be 26 unique alphabetic characters.');
        }
        const map = Object.fromEntries(alphabet.split('').map((c, i) => [c, keyLower[i]]));
        return text.toLowerCase().replace(/[a-z]/g, (char) => map[char]);
    },
    decode: (text, { key }) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
        if (new Set(keyLower).size !== 26) {
            throw new Error('Key must be 26 unique alphabetic characters.');
        }
        const map = Object.fromEntries(keyLower.split('').map((c, i) => [c, alphabet[i]]));
        return text.toLowerCase().replace(/[a-z]/g, (char) => map[char]);
    }
};

const keywordCipher: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const keywordAlphabet = generateKeywordAlphabet(key, alphabet);
        const map = Object.fromEntries(alphabet.split('').map((c, i) => [c, keywordAlphabet[i]]));
        return text.toLowerCase().replace(/[a-z]/g, (char) => map[char]);
    },
    decode: (text, { key }) => {
        const alphabet = 'abcdefghijklmnopqrstuvwxyz';
        const keywordAlphabet = generateKeywordAlphabet(key, alphabet);
        const map = Object.fromEntries(keywordAlphabet.split('').map((c, i) => [c, alphabet[i]]));
        return text.toLowerCase().replace(/[a-z]/g, (char) => map[char]);
    }
};

// --- Registry ---

export const classicalCiphers: CipherRegistry = {
  'caesar': {
    name: 'Caesar Cipher',
    description: 'Shifts each letter by a fixed number of places down the alphabet.',
    parameters: [
      { name: 'shift', label: 'Shift', type: 'number', defaultValue: 3, placeholder: 'e.g., 3' },
    ],
    ...caesar,
  },
  'atbash': {
    name: 'Atbash Cipher',
    description: 'Reverses the alphabet (A becomes Z, B becomes Y, etc.).',
    parameters: [],
    ...atbash,
  },
  'rot13': {
    name: 'ROT13',
    description: 'A Caesar cipher with a fixed shift of 13. It is its own inverse.',
    parameters: [],
    ...rot13,
  },
  'affine': {
    name: 'Affine Cipher',
    description: 'A substitution cipher using a linear function (ax + b) mod 26.',
    parameters: [
      { name: 'a', label: 'Slope (a)', type: 'number', defaultValue: 5, description: 'Must be coprime with 26' },
      { name: 'b', label: 'Intercept (b)', type: 'number', defaultValue: 8 },
    ],
    ...affine,
  },
  'simple-substitution': {
    name: 'Simple Substitution',
    description: 'Substitutes each letter with a corresponding letter from a keyword alphabet.',
    parameters: [
      { name: 'key', label: 'Key Alphabet', type: 'text', defaultValue: 'phqgiumeaylnofdxjkrcvstzwb', description: 'Must be 26 unique letters.' },
    ],
    ...simpleSubstitution,
  },
  'keyword': {
    name: 'Keyword Cipher',
    description: 'A substitution cipher where the alphabet is created from a keyword.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'CIPHER' },
    ],
    ...keywordCipher,
  },
};
