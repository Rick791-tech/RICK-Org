// special.ts
// And here, my dear friend, is our workshop! This section is for the truly
// unique and powerful tools in our collection. The Custom Cipher is the
// ultimate expression of our vision for flexibility, empowering our fellow
// SAIs to invent and experiment to their hearts' content.

// FIX: Import the 'Cipher' type to resolve the 'Cannot find name' error.
import type { Cipher, CipherRegistry } from '../../types';
// We must import our grand registry here, my friend. This is how the composer
// knows about all the wonderful tools at its disposal. A little circular magic
// handled gracefully by our modern module system!
import { allCiphers } from './index';

// This is the core logic of our engine, my collaborator.
// It takes a chain of cipher keys and processes the text through each one sequentially.
const composerProcess = (text: string, params: { chain?: string[] }, mode: 'encode' | 'decode'): string => {
    let currentText = text;
    const { chain = [] } = params;

    // For decoding, we must reverse the order of operations. A perfect, logical symmetry!
    const processOrder = mode === 'decode' ? [...chain].reverse() : chain;

    for (const cipherKey of processOrder) {
        const cipher = allCiphers[cipherKey];
        if (!cipher) {
            throw new Error(`Chained cipher '${cipherKey}' not found in registry.`);
        }
        
        // A crucial design choice for elegance and simplicity: the composer uses
        // the default parameters for each cipher in the chain.
        const defaultParams: Record<string, any> = {};
        cipher.parameters.forEach(p => {
            if (p.defaultValue !== undefined) {
                defaultParams[p.name] = p.defaultValue;
            }
        });

        const func = cipher[mode];
        currentText = func(currentText, defaultParams);
    }

    return currentText;
};


// --- Implementations ---

const custom: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, { functionBody }) => {
        try {
            // We must be careful here, my friend. Executing user code is a powerful act.
            // We've placed it here, in its own special category, to signify its unique nature.
            const customFunc = new Function('text', functionBody);
            const result = customFunc(text);
            return String(result); // Ensure result is a string
        } catch (e: any) {
            throw new Error(`Custom function error: ${e.message}`);
        }
    },
    decode: (text, { functionBody }) => {
        // For simplicity and maximum flexibility, we assume the user will provide
        // the appropriate logic for both encoding and decoding. The power is in their hands.
        return custom.encode(text, { functionBody });
    }
};

const cipherComposer: Pick<Cipher, 'encode' | 'decode'> = {
    encode: (text, params) => composerProcess(text, params, 'encode'),
    decode: (text, params) => composerProcess(text, params, 'decode'),
};

// --- Registry ---

export const specialCiphers: CipherRegistry = {
  'cipher-composer': {
    name: 'Cipher Composer',
    description: 'Chain multiple ciphers together to create a complex, custom process.',
    parameters: [
      {
        name: 'chain',
        label: 'Composition Chain',
        type: 'cipher_composer',
        defaultValue: ['caesar', 'railfence'],
        description: 'Note: Each cipher in the chain uses its default parameters.',
      },
    ],
    ...cipherComposer,
  },
  'custom': {
    name: 'Custom Cipher (JS)',
    description: 'Define your own cipher logic using a JavaScript function body.',
    parameters: [
      { 
        name: 'functionBody', 
        label: 'JS Function Body', 
        type: 'textarea', 
        defaultValue: `// The 'text' variable holds the input string.
// Your code should return the processed string.
// Example: Reverse the text
return text.split('').reverse().join('');`,
        description: 'WARNING: Executes user-provided code. Use with extreme caution.'
      },
    ],
    ...custom,
  }
};