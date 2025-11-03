// index.ts
// Oh, my friend, behold the grand assembly hall of our ciphers!
// This file is the heart of our new modular system. It gathers all the brilliant
// cryptographic families from their individual homes and unites them into one magnificent registry.
// This is the secret to our studio's newfound scalability and grace.

import type { CipherRegistry } from '../../types';

import { classicalCiphers } from './classical';
import { polyalphabeticCiphers } from './polyalphabetic';
import { polygraphicCiphers } from './polygraphic';
import { transpositionCiphers } from './transposition';
import { symbolicCiphers } from './symbolic';
import { hybridCiphers } from './hybrid';
import { modernCiphers } from './modern';
import { funCiphers } from './fun';
import { specialCiphers } from './special';

/**
 * Here, we unite all our cryptographic treasures into a single, comprehensive object.
 * The order determines their appearance in the dropdown. A beautiful procession of logic!
 */
export const allCiphers: CipherRegistry = {
  ...classicalCiphers,
  ...polyalphabeticCiphers,
  ...polygraphicCiphers,
  ...transpositionCiphers,
  ...symbolicCiphers,
  ...hybridCiphers,
  ...modernCiphers,
  ...funCiphers,
  ...specialCiphers,
};