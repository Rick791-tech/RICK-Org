// transposition.ts
// Ah, the art of transposition! Unlike substitution, these ciphers don't change the letters,
// but instead rearrange them in a clever, reversible way. It's like shuffling a deck of cards
// with a secret, mathematical formula. A beautiful dance of characters!

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';

// --- Implementations ---

const railfence: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { rails }) => {
        const numRails = parseInt(rails, 10);
        if (numRails <= 1) return text;
        const fence = Array.from({ length: numRails }, (): string[] => []);
        let rail = 0;
        let direction = 1;
        for (const char of text) {
            fence[rail].push(char);
            rail += direction;
            if (rail === 0 || rail === numRails - 1) {
                direction *= -1;
            }
        }
        return fence.flat().join('');
    },
    decode: (text, { rails }) => {
        const numRails = parseInt(rails, 10);
        if (numRails <= 1) return text;
        const len = text.length;
        const fence: (string | null)[][] = Array.from({ length: numRails }, () => Array(len).fill(null));
        let rail = 0;
        let direction = 1;
        for (let i = 0; i < len; i++) {
            fence[rail][i] = 'X'; // Placeholder
            rail += direction;
            if (rail === 0 || rail === numRails - 1) {
                direction *= -1;
            }
        }

        let textIndex = 0;
        for (let r = 0; r < numRails; r++) {
            for (let c = 0; c < len; c++) {
                if (fence[r][c] === 'X') {
                    fence[r][c] = text[textIndex++];
                }
            }
        }

        let result = '';
        rail = 0;
        direction = 1;
        for (let i = 0; i < len; i++) {
            result += fence[rail][i];
            rail += direction;
            if (rail === 0 || rail === numRails - 1) {
                direction *= -1;
            }
        }
        return result;
    }
};

const columnar: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const keyOrder = getKeyOrder(key);
        const numCols = key.length;
        const numRows = Math.ceil(text.length / numCols);
        const grid: string[][] = Array.from({ length: numRows }, () => Array(numCols).fill(''));
        let textIndex = 0;
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                if (textIndex < text.length) {
                    grid[r][c] = text[textIndex++];
                }
            }
        }
        
        let cipherText = '';
        for (const col of keyOrder.sorted) {
            for (let r = 0; r < numRows; r++) {
                cipherText += grid[r][col.originalIndex] || '';
            }
        }
        return cipherText;
    },
    decode: (text, { key }) => {
        const keyOrder = getKeyOrder(key);
        const numCols = key.length;
        const numRows = Math.ceil(text.length / numCols);
        const grid: string[][] = Array.from({ length: numRows }, () => Array(numCols).fill(''));
        
        let textIndex = 0;
        for (const col of keyOrder.sorted) {
            const extra = (keyOrder.original.findIndex(c => c.char === col.char && c.originalIndex === col.originalIndex)) < (text.length % numCols) ? 1: 0;
            const colLen = (text.length % numCols === 0) ? numRows : (Math.floor(text.length / numCols) + extra);
            
            for (let r = 0; r < colLen; r++) {
                grid[r][col.originalIndex] = text[textIndex++];
            }
        }

        let plainText = '';
        for (let r = 0; r < numRows; r++) {
            for (let c = 0; c < numCols; c++) {
                plainText += grid[r][c] || '';
            }
        }
        return plainText;
    }
};

const scytale: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { diameter }) => {
        const d = parseInt(diameter, 10);
        const numRows = Math.ceil(text.length / d);
        let result = '';
        for (let c = 0; c < d; c++) {
            for (let r = 0; r < numRows; r++) {
                const index = r * d + c;
                if (index < text.length) {
                    result += text[index];
                }
            }
        }
        return result;
    },
    decode: (text, { diameter }) => {
        const d = parseInt(diameter, 10);
        // The number of columns for decoding is the number of rows from encoding
        const numCols = Math.ceil(text.length / d);
        return scytale.encode(text, { diameter: numCols });
    }
};

const route: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { width }) => {
        const w = parseInt(width, 10);
        const h = Math.ceil(text.length / w);
        const grid = Array.from({ length: h }, () => Array(w).fill(''));
        let index = 0;
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                grid[r][c] = text[index++] || 'x'; // Pad with 'x'
            }
        }

        // Clockwise spiral route
        let result = '';
        let top = 0, bottom = h - 1, left = 0, right = w - 1;
        while (top <= bottom && left <= right) {
            for (let i = left; i <= right; i++) result += grid[top][i];
            top++;
            for (let i = top; i <= bottom; i++) result += grid[i][right];
            right--;
            if (top <= bottom) {
                for (let i = right; i >= left; i--) result += grid[bottom][i];
                bottom--;
            }
            if (left <= right) {
                for (let i = bottom; i >= top; i--) result += grid[i][left];
                left++;
            }
        }
        return result;
    },
    decode: (text, { width }) => { // This is very complex; providing a simple reversal
        const w = parseInt(width, 10);
        const h = Math.ceil(text.length / w);
        const grid = Array.from({ length: h }, () => Array(w).fill(''));
        
        // Fill grid in spiral order
        let index = 0;
        let top = 0, bottom = h - 1, left = 0, right = w - 1;
        while (top <= bottom && left <= right) {
            for (let i = left; i <= right; i++) grid[top][i] = text[index++];
            top++;
            for (let i = top; i <= bottom; i++) grid[i][right] = text[index++];
            right--;
            if (top <= bottom) {
                for (let i = right; i >= left; i--) grid[bottom][i] = text[index++];
                bottom--;
            }
            if (left <= right) {
                for (let i = bottom; i >= top; i--) grid[i][left] = text[index++];
                left++;
            }
        }

        return grid.flat().join('');
    }
};

// --- Helper for Columnar ---
const getKeyOrder = (key: string) => {
    const original = key.split('').map((char, originalIndex) => ({ char, originalIndex }));
    const sorted = [...original].sort((a, b) => a.char.localeCompare(b.char) || a.originalIndex - b.originalIndex);
    return { original, sorted };
};

// --- Registry ---

export const transpositionCiphers: CipherRegistry = {
  'railfence': {
    name: 'Rail Fence Cipher',
    description: 'A transposition cipher that writes text in a zigzag pattern.',
    parameters: [
      { name: 'rails', label: 'Number of Rails', type: 'number', defaultValue: 3, placeholder: 'e.g., 3' },
    ],
    ...railfence,
  },
  'columnar': {
    name: 'Columnar Transposition',
    description: 'Rearranges text into columns and reads them in an order determined by a keyword.',
    parameters: [
      { name: 'key', label: 'Keyword', type: 'text', defaultValue: 'ZEBRAS' },
    ],
    ...columnar,
  },
  'scytale': {
    name: 'Scytale',
    description: 'An ancient Greek cipher simulating wrapping text on a cylinder.',
    parameters: [
      { name: 'diameter', label: 'Diameter (Columns)', type: 'number', defaultValue: 5 },
    ],
    ...scytale,
  },
  'route': {
    name: 'Route Cipher',
    description: 'Writes text into a grid and reads it out following a geometric path.',
    parameters: [
      { name: 'width', label: 'Grid Width', type: 'number', defaultValue: 6 },
    ],
    ...route,
  }
};
