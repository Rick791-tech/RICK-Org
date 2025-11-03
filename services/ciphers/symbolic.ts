// symbolic.ts
// A gallery of pure representation, my friend! These ciphers and codes transform our alphabet
// into entirely new forms—dots, dashes, symbols, numbers, and even binary patterns.
// This is where cryptography borders on creating new languages.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';
import { sanitizeText } from './helpers';

// --- Mappings & Constants ---
const MORSE_CODE_MAP: Record<string, string> = { 'a': '.-', 'b': '-...', 'c': '-.-.', 'd': '-..', 'e': '.', 'f': '..-.', 'g': '--.', 'h': '....', 'i': '..', 'j': '.---', 'k': '-.-', 'l': '.-..', 'm': '--', 'n': '-.', 'o': '---', 'p': '.--.', 'q': '--.-', 'r': '.-.', 's': '...', 't': '-', 'u': '..-', 'v': '...-', 'w': '.--', 'x': '-..-', 'y': '-.--', 'z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/' };
const REVERSE_MORSE_CODE_MAP = Object.fromEntries(Object.entries(MORSE_CODE_MAP).map(([k, v]) => [v, k]));

const PIGPEN_ASCII_MAP: Record<string, string> = { 'a': '|_|', 'b': '|_', 'c': '_|', 'd': '|_|', 'e': '|_', 'f': '_|', 'g': '|_|', 'h': '|_', 'i': '_|', 'j': '._|', 'k': '|_.', 'l': '|_.', 'm': '._|', 'n': '|.', 'o': '._', 'p': '_', 'q': '_.', 'r': '._', 's': '<', 't': '>', 'u': '^', 'v': 'v', 'w': '<.', 'x': '>.', 'y': '^.', 'z': 'v.' };
const REVERSE_PIGPEN_ASCII_MAP = Object.fromEntries(Object.entries(PIGPEN_ASCII_MAP).map(([k, v]) => [v, k]));

const BACONIAN_MAP: Record<string, string> = { 'a': 'aaaaa', 'b': 'aaaab', 'c': 'aaaba', 'd': 'aaabb', 'e': 'aabaa', 'f': 'aabab', 'g': 'aabba', 'h': 'aabbb', 'i': 'abaaa', 'j': 'abaab', 'k': 'ababa', 'l': 'ababb', 'm': 'abbaa', 'n': 'abbab', 'o': 'abbba', 'p': 'abbbb', 'q': 'baaaa', 'r': 'baaab', 's': 'baaba', 't': 'baabb', 'u': 'babaa', 'v': 'babab', 'w': 'babba', 'x': 'babbb', 'y': 'bbaaa', 'z': 'bbaab' };
const REVERSE_BACONIAN_MAP = Object.fromEntries(Object.entries(BACONIAN_MAP).map(([k, v]) => [v, k]));

const POLYBIUS_GRID = [ ['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h', 'i', 'k'], ['l', 'm', 'n', 'o', 'p'], ['q', 'r', 's', 't', 'u'], ['v', 'w', 'x', 'y', 'z'] ];
const TAP_CODE_GRID = [ ['a','b','c','d','e'], ['f','g','h','i','k'], ['l','m','n','o','p'], ['q','r','s','t','u'], ['v','w','x','y','z'] ];

// --- Implementations ---

const morse: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.toLowerCase().split('').map(char => MORSE_CODE_MAP[char] || '').join(' '),
    decode: (text) => text.split(' ').map(code => REVERSE_MORSE_CODE_MAP[code] || '').join(''),
};

const pigpen: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.toLowerCase().replace(/[^a-z]/g, '').split('').map(char => PIGPEN_ASCII_MAP[char] || '').join(' '),
    decode: (text) => text.split(' ').map(symbol => REVERSE_PIGPEN_ASCII_MAP[symbol] || '').join(''),
};

const a1z26: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.toLowerCase().replace(/[a-z]/g, char => `${char.charCodeAt(0) - 96} `).trim(),
    decode: (text) => text.split(/[\s,]+/).filter(Boolean).map(num => String.fromCharCode(parseInt(num, 10) + 96)).join(''),
};

const baconian: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => text.toLowerCase().replace(/[a-z]/g, char => BACONIAN_MAP[char] || ''),
    decode: (text) => (text.match(/.{1,5}/g) || []).map(code => REVERSE_BACONIAN_MAP[code] || '').join(''),
};

const polybius: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        return text.toLowerCase().replace(/j/g, 'i').replace(/[a-z]/g, char => {
            for (let r = 0; r < 5; r++) {
                const c = POLYBIUS_GRID[r].indexOf(char);
                if (c !== -1) return `${r + 1}${c + 1}`;
            }
            return '';
        });
    },
    decode: (text) => {
        return (text.match(/.{1,2}/g) || []).map(pair => {
            const r = parseInt(pair[0], 10) - 1;
            const c = parseInt(pair[1], 10) - 1;
            return POLYBIUS_GRID[r]?.[c] || '';
        }).join('');
    }
};

const tapCode: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => sanitizeText(text).replace(/k/g, 'c').split('').map(char => {
        for(let r=0; r<5; r++) for(let c=0; c<5; c++) if(TAP_CODE_GRID[r][c] === char) return `${'.'.repeat(r+1)} ${'.'.repeat(c+1)}`;
        return '';
    }).join('  '),
    decode: (text) => text.split('  ').map(pair => {
        const parts = pair.split(' ');
        if (parts.length !== 2) return '';
        const r = parts[0].length - 1;
        const c = parts[1].length - 1;
        return TAP_CODE_GRID[r]?.[c] || '';
    }).join(''),
};

const bifid: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        const plain = sanitizeText(text).replace(/j/g, 'i');
        const rows: number[] = [], cols: number[] = [];
        for (const char of plain) {
            const pos = polybius.encode(char, {});
            rows.push(parseInt(pos[0], 10));
            cols.push(parseInt(pos[1], 10));
        }
        const coords = [...rows, ...cols];
        let cipher = '';
        for (let i = 0; i < coords.length; i += 2) {
            cipher += polybius.decode(`${coords[i]}${coords[i+1]}`, {});
        }
        return cipher;
    },
    decode: (text) => {
        const cipher = sanitizeText(text).replace(/j/g, 'i');
        let coordsStr = '';
        for (const char of cipher) {
            coordsStr += polybius.encode(char, {});
        }
        const half = coordsStr.length / 2;
        const rows = coordsStr.slice(0, half);
        const cols = coordsStr.slice(half);
        let plain = '';
        for (let i = 0; i < half; i++) {
            plain += polybius.decode(`${rows[i]}${cols[i]}`, {});
        }
        return plain;
    }
};

const nihilist: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { key }) => {
        const plainCoords = polybius.encode(sanitizeText(text), {}).split('').map(Number);
        const keyCoords = polybius.encode(sanitizeText(key), {}).split('').map(Number);
        return plainCoords.map((p, i) => p + keyCoords[i % keyCoords.length]).join(' ');
    },
    decode: (text, { key }) => {
        const cipherNums = text.split(' ').map(Number);
        const keyCoords = polybius.encode(sanitizeText(key), {}).split('').map(Number);
        const plainCoords = cipherNums.map((c, i) => c - keyCoords[i % keyCoords.length]).join('');
        return polybius.decode(plainCoords, {});
    }
};

// --- Registry ---

export const symbolicCiphers: CipherRegistry = {
  'morse': { name: 'Morse Code', description: 'Encodes text into a series of dots and dashes.', parameters: [], ...morse },
  'pigpen': { name: 'Pigpen Cipher', description: 'A geometric substitution cipher using symbols.', parameters: [], ...pigpen },
  'a1z26': { name: 'A1Z26 Cipher', description: 'Replaces letters with their position in the alphabet (A=1, Z=26).', parameters: [], ...a1z26 },
  'baconian': { name: 'Baconian Cipher', description: 'Encodes each letter into a 5-character binary sequence ("a"s and "b"s).', parameters: [], ...baconian },
  'polybius': { name: 'Polybius Square', description: 'Represents letters using coordinates on a 5x5 grid.', parameters: [], ...polybius },
  'tap-code': { name: 'Tap Code', description: 'Encodes letters based on a 5x5 grid, used by prisoners.', parameters: [], ...tapCode },
  'bifid': { name: 'Bifid Cipher', description: 'A fractionating cipher combining a Polybius square with transposition.', parameters: [], ...bifid },
  'nihilist': { name: 'Nihilist Cipher', description: 'Combines a Polybius square with keyed number addition.', parameters: [{name: 'key', label: 'Keyword', type: 'text', defaultValue: 'RUSSIAN'}], ...nihilist },
};
