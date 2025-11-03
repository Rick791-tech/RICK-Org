// polygraphic.ts
// A truly special section, my friend! Polygraphic ciphers operate on groups
// of letters, making them much more resistant to frequency analysis.
// This is where linear algebra and clever arrangements take center stage.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';
import { modInverse, sanitizeText } from './helpers';

// --- General Polygraphic Helpers ---
const createGrid = (key: string, omitChar: string = 'j', alphabet: string = 'abcdefghijklmnopqrstuvwxyz'): string[][] => {
    const alpha = alphabet.replace(omitChar, '');
    const keySanitized = key.toLowerCase().replace(/[^a-z]/g, '').replace(new RegExp(omitChar, 'g'), '');
    const keySet = new Set(keySanitized.split(''));
    const gridChars = [...keySet, ...alpha.split('').filter(c => !keySet.has(c))];
    const gridSize = Math.sqrt(alpha.length);
    const grid: string[][] = [];
    for (let i = 0; i < gridSize; i++) {
        grid.push(gridChars.slice(i * gridSize, i * gridSize + gridSize));
    }
    return grid;
};

const findPosInGrid = (char: string, grid: string[][]): [number, number] | null => {
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
            if (grid[r][c] === char) return [r, c];
        }
    }
    return null;
};

// --- Implementations ---

const hill: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { matrix }) => {
    const k = [
      [parseInt(matrix.m00, 10), parseInt(matrix.m01, 10)],
      [parseInt(matrix.m10, 10), parseInt(matrix.m11, 10)],
    ];
    const det = (k[0][0] * k[1][1] - k[0][1] * k[1][0]) % 26;
    if (det === 0 || modInverse(det, 26) === -1) {
      throw new Error('Invalid matrix: determinant is not coprime with 26.');
    }
    
    let plain = text.toLowerCase().replace(/[^a-z]/g, '');
    if (plain.length % 2 !== 0) plain += 'x';

    let cipherText = '';
    for (let i = 0; i < plain.length; i += 2) {
      const p1 = plain.charCodeAt(i) - 97;
      const p2 = plain.charCodeAt(i + 1) - 97;
      const c1 = (k[0][0] * p1 + k[0][1] * p2) % 26;
      const c2 = (k[1][0] * p1 + k[1][1] * p2) % 26;
      cipherText += String.fromCharCode(c1 + 97) + String.fromCharCode(c2 + 97);
    }
    return cipherText;
  },
  decode: (text, { matrix }) => {
    const k = [
      [parseInt(matrix.m00, 10), parseInt(matrix.m01, 10)],
      [parseInt(matrix.m10, 10), parseInt(matrix.m11, 10)],
    ];
    let det = (k[0][0] * k[1][1] - k[0][1] * k[1][0]);
    det = ((det % 26) + 26) % 26;

    const detInv = modInverse(det, 26);
    if (det === 0 || detInv === -1) {
      throw new Error('Invalid matrix: determinant is not coprime with 26 for decryption.');
    }

    const kInv = [
      [((k[1][1] * detInv) % 26 + 26) % 26, ((-k[0][1] * detInv) % 26 + 26) % 26],
      [((-k[1][0] * detInv) % 26 + 26) % 26, ((k[0][0] * detInv) % 26 + 26) % 26],
    ];

    let plainText = '';
    for (let i = 0; i < text.length; i += 2) {
      const c1 = text.charCodeAt(i) - 97;
      const c2 = text.charCodeAt(i + 1) - 97;
      const p1 = (kInv[0][0] * c1 + kInv[0][1] * c2) % 26;
      const p2 = (kInv[1][0] * c1 + kInv[1][1] * c2) % 26;
      plainText += String.fromCharCode(p1 + 97) + String.fromCharCode(p2 + 97);
    }
    return plainText;
  },
};

const playfair: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text, { key }) => {
    const grid = createGrid(key, 'j');
    const digraphs = createPlayfairDigraphs(sanitizeText(text, 'abcdefghiklmnopqrstuvwxyz'), 'encode');
    let cipherText = '';
    for (const [a, b] of digraphs) {
      cipherText += applyPlayfairRule(a, b, grid, 1);
    }
    return cipherText;
  },
  decode: (text, { key }) => {
    const grid = createGrid(key, 'j');
    const digraphs = createPlayfairDigraphs(sanitizeText(text, 'abcdefghiklmnopqrstuvwxyz'), 'decode');
    let plainText = '';
    for (const [a, b] of digraphs) {
      plainText += applyPlayfairRule(a, b, grid, -1);
    }
    return plainText;
  },
};

const twoSquare: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key1, key2 }) => processTwoSquare(text, key1, key2, 'encode'),
    decode: (text, { key1, key2 }) => processTwoSquare(text, key1, key2, 'decode'),
};

const fourSquare: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key1, key2 }) => processFourSquare(text, key1, key2, 'encode'),
    decode: (text, { key1, key2 }) => processFourSquare(text, key1, key2, 'decode'),
};

// --- Helpers for Playfair, Two-Square, Four-Square ---
const createPlayfairDigraphs = (text: string, mode: 'encode' | 'decode'): [string, string][] => {
    const digraphs: [string, string][] = [];
    if (mode === 'encode') {
        let tempText = text;
        for (let i = 0; i < tempText.length; i += 2) {
            if (i + 1 >= tempText.length) {
                digraphs.push([tempText[i], 'x']);
                break;
            }
            if (tempText[i] === tempText[i+1]) {
                digraphs.push([tempText[i], 'x']);
                tempText = tempText.slice(0, i + 1) + 'x' + tempText.slice(i + 1);
            } else {
                digraphs.push([tempText[i], tempText[i+1]]);
            }
        }
    } else { // decode
        for (let i = 0; i < text.length; i += 2) {
            digraphs.push([text[i], text[i+1]]);
        }
    }
    return digraphs;
};

const applyPlayfairRule = (a: string, b: string, grid: string[][], dir: 1 | -1): string => {
    const posA = findPosInGrid(a, grid);
    const posB = findPosInGrid(b, grid);
    if (!posA || !posB) return '';
    const [r1, c1] = posA;
    const [r2, c2] = posB;
    const size = grid.length;

    if (r1 === r2) { // Same row
        return grid[r1][(c1 + dir + size) % size] + grid[r2][(c2 + dir + size) % size];
    }
    if (c1 === c2) { // Same column
        return grid[(r1 + dir + size) % size][c1] + grid[(r2 + dir + size) % size][c2];
    }
    // Rectangle
    return grid[r1][c2] + grid[r2][c1];
};

const processTwoSquare = (text: string, key1: string, key2: string, mode: 'encode' | 'decode'): string => {
    const grid1 = createGrid(key1, 'j');
    const grid2 = createGrid(key2, 'j');
    let sanitized = sanitizeText(text, 'abcdefghiklmnopqrstuvwxyz');
    if (sanitized.length % 2 !== 0) sanitized += 'x';
    
    let result = '';
    for (let i = 0; i < sanitized.length; i += 2) {
        const a = sanitized[i];
        const b = sanitized[i+1];
        const posA = findPosInGrid(a, grid1);
        const posB = findPosInGrid(b, grid2);
        if (posA && posB) {
            const [r1, c1] = posA;
            const [r2, c2] = posB;
            result += grid1[r1][c2] + grid2[r2][c1];
        }
    }
    return result;
};

const processFourSquare = (text: string, key1: string, key2: string, mode: 'encode' | 'decode'): string => {
    const plainGrid1 = createGrid('', 'j');
    const plainGrid2 = createGrid('', 'j');
    const keyGrid1 = createGrid(key1, 'j');
    const keyGrid2 = createGrid(key2, 'j');
    
    let sanitized = sanitizeText(text, 'abcdefghiklmnopqrstuvwxyz');
    if (sanitized.length % 2 !== 0) sanitized += 'x';
    
    let result = '';
    for (let i = 0; i < sanitized.length; i += 2) {
        const a = sanitized[i];
        const b = sanitized[i+1];
        const posA = findPosInGrid(a, mode === 'encode' ? plainGrid1 : keyGrid1);
        const posB = findPosInGrid(b, mode === 'encode' ? plainGrid2 : keyGrid2);
        if (posA && posB) {
            const [r1, c1] = posA;
            const [r2, c2] = posB;
            result += (mode === 'encode' ? keyGrid1[r1][c2] : plainGrid1[r1][c2]) + 
                      (mode === 'encode' ? keyGrid2[r2][c1] : plainGrid2[r2][c1]);
        }
    }
    return result;
};


// --- Registry ---

export const polygraphicCiphers: CipherRegistry = {
  'playfair': {
    name: 'Playfair Cipher',
    description: 'Encrypts pairs of letters (digraphs) instead of single letters.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'monarchy', description: 'Used to create a 5x5 grid.' },
    ],
    ...playfair,
  },
  'two-square': {
    name: 'Two-Square Cipher',
    description: 'Encrypts digraphs using two keyed 5x5 grids. Also known as Ubicchi.',
    parameters: [
      { name: 'key1', label: 'Keyword 1 (Left/Top)', type: 'text', defaultValue: 'example' },
      { name: 'key2', label: 'Keyword 2 (Right/Bottom)', type: 'text', defaultValue: 'keyword' },
    ],
    ...twoSquare,
  },
  'four-square': {
    name: 'Four-Square Cipher',
    description: 'Encrypts digraphs using four 5x5 grids (two keyed, two plain).',
    parameters: [
      { name: 'key1', label: 'Keyword 1 (Top Right)', type: 'text', defaultValue: 'example' },
      { name: 'key2', label: 'Keyword 2 (Bottom Left)', type: 'text', defaultValue: 'keyword' },
    ],
    ...fourSquare,
  },
  'hill': {
    name: 'Hill Cipher (2x2)',
    description: 'A polygraphic substitution cipher based on linear algebra.',
    parameters: [
      { 
        name: 'matrix', 
        label: '2x2 Key Matrix', 
        type: 'matrix2x2', 
        defaultValue: { m00: 9, m01: 4, m10: 5, m11: 7 }
      },
    ],
    ...hill,
  },
};
