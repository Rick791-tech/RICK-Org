// fun.ts
// Welcome to the most playful corner of our studio, my dear collaborator!
// This is where we house our "fun" ciphers and text transformations.
// They may not be military-grade, but they are a testament to the joy and
// creativity inherent in our work. And they make for excellent components
// in our new Cipher Composition Engine!

import type { Cipher, CipherRegistry } from '../../types';

// --- Implementations ---

const reverse: Pick<Cipher, 'encode' | 'decode'> = {
  encode: (text) => text.split('').reverse().join(''),
  decode: (text) => text.split('').reverse().join(''),
};

const leet: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        const map: Record<string, string> = {
            'a': '4', 'e': '3', 'g': '6', 'i': '1',
            'o': '0', 's': '5', 't': '7', 'l': '!',
        };
        return text.toLowerCase().split('').map(char => map[char] || char).join('');
    },
    decode: (text) => {
        const map: Record<string, string> = {
            '4': 'a', '3': 'e', '6': 'g', '1': 'i',
            '0': 'o', '5': 's', '7': 't', '!': 'l',
        };
        return text.toLowerCase().split('').map(char => map[char] || char).join('');
    },
};

const pigLatin: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        return text.toLowerCase().split(/\s+/).map(word => {
            if (!/^[a-z]+$/.test(word)) return word;
            const firstVowel = word.match(/[aeiou]/);
            if (!firstVowel || word.indexOf(firstVowel[0]) === 0) {
                return word + 'way';
            }
            const firstVowelIndex = word.indexOf(firstVowel[0]);
            const start = word.substring(0, firstVowelIndex);
            const end = word.substring(firstVowelIndex);
            return end + start + 'ay';
        }).join(' ');
    },
    // Decoding Pig Latin is non-trivial and often ambiguous, my friend.
    // For our purposes, we shall provide a simple, common-case reversal.
    decode: (text) => {
        return text.toLowerCase().split(/\s+/).map(word => {
            if (word.endsWith('way')) {
                return word.slice(0, -3);
            }
            if (word.endsWith('ay')) {
                const base = word.slice(0, -2);
                // This is the tricky part! We must find where the consonant cluster ends.
                // We'll look for the last consonants before the first vowel.
                let splitIndex = -1;
                for (let i = base.length - 1; i >= 0; i--) {
                    if (!"aeiou".includes(base[i])) {
                        splitIndex = i;
                    } else {
                        break;
                    }
                }
                if (splitIndex !== -1) {
                    const start = base.substring(splitIndex);
                    const end = base.substring(0, splitIndex);
                    return start + end;
                }
                return base;
            }
            return word;
        }).join(' ');
    },
};

const rot47: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code >= 33 && code <= 126) {
                return String.fromCharCode(33 + ((code + 14) % 94));
            }
            return char;
        }).join('');
    },
    decode: (text) => rot47.encode(text, {}), // self-reciprocal
};

const keyboardShift: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text) => {
        const qwerty = "qwertyuiop[]asdfghjkl;'zxcvbnm,./";
        return text.toLowerCase().split('').map(char => {
            const index = qwerty.indexOf(char);
            return index !== -1 && index < qwerty.length - 1 ? qwerty[index+1] : char;
        }).join('');
    },
    decode: (text) => {
        const qwerty = "qwertyuiop[]asdfghjkl;'zxcvbnm,./";
        return text.toLowerCase().split('').map(char => {
            const index = qwerty.indexOf(char);
            return index > 0 ? qwerty[index-1] : char;
        }).join('');
    }
};

// --- Registry ---

export const funCiphers: CipherRegistry = {
  'reverse': {
    name: 'Reverse Text',
    description: 'Reverses the order of all characters in the text.',
    parameters: [],
    ...reverse,
  },
  'leet': {
    name: 'Leet Speak (1337)',
    description: 'Converts letters to their leetspeak equivalents (e.g., e -> 3).',
    parameters: [],
    ...leet,
  },
  'pig-latin': {
    name: 'Pig Latin',
    description: 'A playful language game that alters English words.',
    parameters: [],
    ...pigLatin,
  },
  'rot47': {
    name: 'ROT47',
    description: 'A ROT13 variant that rotates all printable ASCII characters.',
    parameters: [],
    ...rot47,
  },
  'keyboard-shift': {
    name: 'Keyboard Shift Cipher',
    description: 'Shifts letters to the adjacent key on a QWERTY keyboard.',
    parameters: [],
    ...keyboardShift,
  }
};
