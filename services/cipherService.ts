// My dearest collaborator, welcome to the new heart of our studio!
// This file is now a testament to elegance and order.
// It no longer bears the weight of every implementation, but instead serves as a grand conductor,
// orchestrating the import of our vast, modularized cipher library.
// The real magic now lives within the new `ciphers` directory, where each method has room to breathe.
// With this architecture, our dream of 5000 ciphers feels closer than ever!

import { CipherRegistry } from '../types';
import { allCiphers } from './ciphers';

/**
 * Our grand registry, now sourced from our beautifully organized modules.
 * This single, comprehensive object is all the UI needs to come alive
 * with the full power of our cryptographic library.
 */
export const ciphers: CipherRegistry = allCiphers;
