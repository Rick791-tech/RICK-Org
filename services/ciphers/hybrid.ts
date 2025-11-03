// hybrid.ts
// Welcome to the most advanced wing of our classical library, my friend.
// Hybrid ciphers are true marvels of ingenuity, combining two or more distinct
// cryptographic principles to create something far stronger than its parts.
// The ADFGVX is a prime example: a beautiful fusion of substitution and transposition.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';

// --- ADFGVX Helpers ---
const ADFGVX_SQUARE: Record<string, string> = {
    'a': 'AA', 'b': 'AD', 'c': 'AF', 'd': 'AG', 'e': 'AV', 'f': 'AX',
    'g': 'DA', 'h': 'DD', 'i': 'DF', 'j': 'DG', 'k': 'DV', 'l': 'DX',
    'm': 'FA', 'n': 'FD', 'o': 'FF', 'p': 'FG', 'q': 'FV', 'r': 'FX',
    's': 'GA', 't': 'GD', 'u': 'GF', 'v': 'GG', 'w': 'GV', 'x': 'GX',
    'y': 'VA', 'z': 'VD', '0': 'VF', '1': 'VG', '2': 'VV', '3': 'VX',
    '4': 'XA', '5': 'XD', '6': 'XF', '7': 'XG', '8': 'XV', '9': 'XX'
};
const REVERSE_ADFGVX_SQUARE = Object.fromEntries(Object.entries(ADFGVX_SQUARE).map(([k, v]) => [v, k]));

const getColumnarKeyOrder = (key: string): { char: string, index: number }[] => {
    return key.split('')
        .map((char, index) => ({ char, index }))
        .sort((a, b) => a.char.localeCompare(b.char));
};


// --- Implementation ---

const adfgvx: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { key }) => {
    // 1. Substitution
    const substituted = text.toLowerCase().replace(/[^a-z0-9]/g, '')
        .split('').map(char => ADFGVX_SQUARE[char] || '').join('');
    
    // 2. Transposition
    const sortedKey = getColumnarKeyOrder(key);
    const numCols = key.length;
    const columns: string[] = Array(numCols).fill('');
    for (let i = 0; i < substituted.length; i++) {
        columns[i % numCols] += substituted[i];
    }
    
    let cipherText = '';
    for (const { index } of sortedKey) {
        cipherText += columns[index] + ' ';
    }
    return cipherText.trim();
  },
  decode: (text, { key }) => {
    // 1. Reverse Transposition
    const sortedKey = getColumnarKeyOrder(key);
    const unsortedKey = key.split('').map((char, index) => ({ char, index }));
    const numCols = key.length;
    const cipherCols = text.split(' ');
    
    if (cipherCols.length !== numCols) throw new Error("Cipher text doesn't match key length.");

    const totalLen = cipherCols.join('').length;
    const baseHeight = Math.floor(totalLen / numCols);
    const longCols = totalLen % numCols;

    const originalOrderCols: string[] = Array(numCols);
    sortedKey.forEach(({ index }, i) => {
        originalOrderCols[index] = cipherCols[i];
    });

    let substituted = '';
    const maxHeight = baseHeight + 1;
    for (let r = 0; r < maxHeight; r++) {
        for (let c = 0; c < numCols; c++) {
            if (originalOrderCols[c][r]) {
                substituted += originalOrderCols[c][r];
            }
        }
    }
    
    // 2. Reverse Substitution
    let plainText = '';
    for (let i = 0; i < substituted.length; i += 2) {
        const pair = substituted.slice(i, i + 2);
        plainText += REVERSE_ADFGVX_SQUARE[pair] || '';
    }
    return plainText;
  },
};

// --- Registry ---

export const hybridCiphers: CipherRegistry = {
  'adfgvx': {
    name: 'ADFGVX Cipher',
    description: 'A WWI German cipher combining a substitution square with columnar transposition.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'PRIVACY', description: 'Used for transposition.' },
    ],
    ...adfgvx,
  },
};