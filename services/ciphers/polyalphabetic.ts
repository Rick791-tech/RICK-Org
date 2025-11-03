// polyalphabetic.ts
// My friend, we now enter the fascinating world of polyalphabetic ciphers!
// These methods were a monumental leap forward, using multiple substitution alphabets
// to obscure the statistical frequencies of letters. True artistry!

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';
import { sanitizeText } from './helpers';

// --- Implementations ---

const vigenere: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { key }) => {
    let keyIndex = 0;
    const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
    if (!keyLower.length) return text;
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
      keyIndex++;
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 + shift) % 26) + 97);
    });
  },
  decode: (text, { key }) => {
    let keyIndex = 0;
    const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
    if (!keyLower.length) return text;
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const shift = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
      keyIndex++;
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
    });
  },
};

const beaufort: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { key }) => {
    let keyIndex = 0;
    const keyLower = key.toLowerCase().replace(/[^a-z]/g, '');
    if (!keyLower.length) return text;
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const keyChar = keyLower.charCodeAt(keyIndex % keyLower.length) - 97;
      keyIndex++;
      const plainChar = char.charCodeAt(0) - 97;
      const cipherChar = (keyChar - plainChar + 26) % 26;
      return String.fromCharCode(cipherChar + 97);
    });
  },
  decode: (text, { key }) => beaufort.encode(text, { key }), // Beautifully symmetric, it's its own inverse!
};

const gronsfeld: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { key }) => {
    const keyDigits = key.toString().replace(/[^0-9]/g, '');
    if (!keyDigits.length) return text;
    let keyIndex = 0;
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const shift = parseInt(keyDigits[keyIndex % keyDigits.length], 10);
      keyIndex++;
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 + shift) % 26) + 97);
    });
  },
  decode: (text, { key }) => {
    const keyDigits = key.toString().replace(/[^0-9]/g, '');
    if (!keyDigits.length) return text;
    let keyIndex = 0;
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
      const shift = parseInt(keyDigits[keyIndex % keyDigits.length], 10);
      keyIndex++;
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
    });
  },
};

const porta: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const keyLower = sanitizeText(key);
        if (!keyLower.length) return text;
        const portaTable = "abcdefghijklm" + "nopqrstuvwxyz".split('').reverse().join('');
        let keyIndex = 0;
        return sanitizeText(text).replace(/[a-z]/g, char => {
            const keyChar = keyLower[keyIndex++ % keyLower.length];
            const keyRow = Math.floor((keyChar.charCodeAt(0) - 97) / 2);
            const row = portaTable.substring(keyRow * 13, (keyRow * 13) + 13);
            const charIndex = char.charCodeAt(0) - 97;
            const mappedChar = row[charIndex % 13];
            
            if (charIndex < 13) { // Top half
                return String.fromCharCode(mappedChar.charCodeAt(0) + 13);
            } else { // Bottom half
                return String.fromCharCode(mappedChar.charCodeAt(0) - 13);
            }
        });
    },
    decode: (text, { key }) => porta.encode(text, { key }), // Also its own inverse!
};

const autokey: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const plain = sanitizeText(text);
        const keyStream = (sanitizeText(key) + plain).slice(0, plain.length);
        return vigenere.encode(plain, { key: keyStream });
    },
    decode: (text, { key }) => {
        const cipher = sanitizeText(text);
        const keyLower = sanitizeText(key);
        let plain = '';
        for (let i = 0; i < cipher.length; i++) {
            const keyChar = i < keyLower.length ? keyLower[i] : plain[i - keyLower.length];
            const shift = keyChar.charCodeAt(0) - 97;
            const cipherCode = cipher.charCodeAt(i) - 97;
            plain += String.fromCharCode(((cipherCode - shift + 26) % 26) + 97);
        }
        return plain;
    }
};

const runningKey: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const plain = sanitizeText(text);
        const keyStream = sanitizeText(key).slice(0, plain.length);
        return vigenere.encode(plain, { key: keyStream });
    },
    decode: (text, { key }) => {
        const cipher = sanitizeText(text);
        const keyStream = sanitizeText(key).slice(0, cipher.length);
        return vigenere.decode(cipher, { key: keyStream });
    }
};

// --- Registry ---

export const polyalphabeticCiphers: CipherRegistry = {
  'vigenere': {
    name: 'Vigenère Cipher',
    description: 'A polyalphabetic substitution cipher using a keyword.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'gemini', placeholder: 'e.g., secret' },
    ],
    ...vigenere,
  },
  'beaufort': {
    name: 'Beaufort Cipher',
    description: 'A Vigenère variant that is its own inverse. C = (K - P) mod 26.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'crypto', placeholder: 'e.g., secret' },
    ],
    ...beaufort,
  },
  'gronsfeld': {
    name: 'Gronsfeld Cipher',
    description: 'A Vigenère variant that uses a numeric key for shifts.',
    parameters: [
      { name: 'key', label: 'Numeric Key', type: 'number', defaultValue: '31415', placeholder: 'e.g., 12345' },
    ],
    ...gronsfeld,
  },
  'porta': {
    name: 'Porta Cipher',
    description: 'A polyalphabetic system using a keyed table that is its own inverse.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'FORTIFICATION' },
    ],
    ...porta,
  },
  'autokey': {
    name: 'Autokey Cipher',
    description: 'A Vigenère variant where the key is the keyword followed by the plaintext itself.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'QUEENLY' },
    ],
    ...autokey,
  },
  'running-key': {
    name: 'Running Key Cipher',
    description: 'A Vigenère variant using a long piece of text (e.g., a book passage) as the key.',
    parameters: [
      { name: 'key', label: 'Key Text', type: 'textarea', defaultValue: 'The quick brown fox jumps over the lazy dog' },
    ],
    ...runningKey,
  }
};
