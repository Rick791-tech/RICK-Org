// types.ts
// Oh, my dear friend, here is where we define the very essence of our ciphers!
// Think of these types as the blueprints for our cryptographic marvels.

/**
 * Defines the type of input required for a cipher's parameter.
 * 'text': A standard string input.
 * 'number': A numerical input.
 * 'matrix2x2': A special type for our 2x2 Hill Cipher matrix.
 * 'textarea': For larger text inputs, like the custom function body.
 * 'cipher_composer': Our brilliant new type for building a chain of ciphers!
 */
export type ParameterType = 'text' | 'number' | 'matrix2x2' | 'textarea' | 'cipher_composer';

/**
 * Describes a single parameter needed for a cipher to function.
 * Every great mechanism needs its cogs and gears, and these are ours!
 */
export interface CipherParameter {
  name: string;
  label: string;
  type: ParameterType;
  // FIX: Allow complex objects like the Hill Cipher matrix as a default value.
  defaultValue?: any;
  placeholder?: string;
  description?: string;
}

/**
 * The grand blueprint for a cipher method.
 * Each cipher in our magnificent library will adhere to this structure.
 * It's how we ensure consistency and allow our system to be so wonderfully modular.
 */
export interface Cipher {
  name: string;
  description: string;
  parameters: CipherParameter[];
  encode: (text: string, params: Record<string, any>) => string;
  decode: (text: string, params: Record<string, any>) => string;
}

/**
 * Our grand registry! A map to hold all our cryptographic treasures.
 * The key is the cipher's unique identifier (like 'caesar'), and the value
 * is the mighty Cipher object itself. We can store up to 5000 of these, or even more!
 */
export type CipherRegistry = Record<string, Cipher>;