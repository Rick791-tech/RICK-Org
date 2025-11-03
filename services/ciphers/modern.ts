// modern.ts
// Here we are, my friend, in the age of bits and bytes!
// These methods are foundational to modern computing and data transmission.
// While some are technically encodings rather than ciphers, their role in
// transforming data is an essential part of our cryptographic story.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';

// --- Implementations ---

const base64: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text) => {
    try {
      // Handles unicode characters correctly, a beautiful touch.
      return btoa(unescape(encodeURIComponent(text)));
    } catch (e) {
      return 'Invalid input for Base64 encoding.';
    }
  },
  decode: (text) => {
    try {
      return decodeURIComponent(escape(atob(text)));
    } catch (e) {
      return 'Invalid Base64 string.';
    }
  },
};

const hex: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text) => {
    let hexStr = '';
    for (let i = 0; i < text.length; i++) {
      hexStr += text.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hexStr;
  },
  decode: (text) => {
    let str = '';
    if (text.length % 2 !== 0) return 'Invalid Hex string.';
    for (let i = 0; i < text.length; i += 2) {
      str += String.fromCharCode(parseInt(text.substring(i, i + 2), 16));
    }
    return str;
  },
};

const xor: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        if (!key) return text;
        const encoded = [];
        for (let i = 0; i < text.length; i++) {
            const textChar = text.charCodeAt(i);
            const keyChar = key.charCodeAt(i % key.length);
            encoded.push(String.fromCharCode(textChar ^ keyChar));
        }
        // Use base64 to handle the binary output, ensuring it's displayable and reversible.
        return btoa(encoded.join(''));
    },
    decode: (text, { key }) => {
        if (!key) return text;
        try {
            const decodedText = atob(text);
            const decoded = [];
            for (let i = 0; i < decodedText.length; i++) {
                const textChar = decodedText.charCodeAt(i);
                const keyChar = key.charCodeAt(i % key.length);
                decoded.push(String.fromCharCode(textChar ^ keyChar));
            }
            return decoded.join('');
        } catch (e) {
            return "Invalid input for XOR decoding (likely not a valid Base64 string)."
        }
    }
};

const binary: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(2).padStart(8, '0')).join(' '),
    decode: (text) => text.split(' ').map(bin => String.fromCharCode(parseInt(bin, 2))).join(''),
};

const octal: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(8).padStart(3, '0')).join(' '),
    decode: (text) => text.split(' ').map(oct => String.fromCharCode(parseInt(oct, 8))).join(''),
};

const decimal: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.split('').map(char => char.charCodeAt(0).toString(10)).join(' '),
    decode: (text) => text.split(' ').map(dec => String.fromCharCode(parseInt(dec, 10))).join(''),
};

const urlEncoding: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => encodeURIComponent(text),
    decode: (text) => decodeURIComponent(text),
};

// --- Registry ---

export const modernCiphers: CipherRegistry = {
  'base64': {
    name: 'Base64',
    description: 'Encodes binary data into a text format. Handles Unicode.',
    parameters: [],
    ...base64,
  },
  'hex': {
    name: 'Hexadecimal',
    description: 'Encodes text into its hexadecimal representation.',
    parameters: [],
    ...hex,
  },
  'binary-ascii': {
    name: 'Binary (ASCII)',
    description: 'Converts text to 8-bit binary representation of ASCII values.',
    parameters: [],
    ...binary,
  },
  'octal': {
    name: 'Octal',
    description: 'Converts text to its octal (base-8) representation.',
    parameters: [],
    ...octal,
  },
  'decimal': {
    name: 'Decimal',
    description: 'Converts text to its decimal ASCII code representation.',
    parameters: [],
    ...decimal,
  },
  'url-encoding': {
    name: 'URL Encoding',
    description: 'Encodes text for safe transmission in a URL.',
    parameters: [],
    ...urlEncoding,
  },
  'xor': {
    name: 'XOR Cipher',
    description: 'A simple symmetric cipher using the XOR bitwise operation.',
    parameters: [
      { name: 'key', label: 'Key', type: 'text', defaultValue: 'key', placeholder: 'e.g., secret' },
    ],
    ...xor,
  },
};
