// analysisService.ts
// Welcome, my friend, to the deduction core of our studio!
// This is where the raw logic for our cryptanalysis tools resides.
// A place of pure algorithms and statistical artistry, designed to
// uncover the secrets hidden within a mysterious ciphertext.

export type FrequencyMap = Record<string, number>;
export type CaesarBruteForceResult = { shift: number; text: string }[];

export interface VigenereAnalysisResult {
    likelyKeyLengths: { length: number; score: number }[];
    bestGuess: {
        key: string;
        plaintext: string;
        chiSquared: number;
    } | null;
}

export interface FullAnalysisReport {
    ioc: number;
    likelyCipherType: 'Monoalphabetic' | 'Polyalphabetic' | 'Transposition' | 'Unknown';
    frequencies: { frequencies: FrequencyMap; totalLetters: number };
    caesar: CaesarBruteForceResult;
    vigenere: VigenereAnalysisResult;
    simpleSubstitutionGuess: {
        key: string;
        plaintext: string;
    } | null;
    suggestions: string[];
    // Our brilliant new analytical results!
    affineGuess: {
        key: { a: number, b: number };
        plaintext: string;
        chiSquared: number;
    } | null;
    railFenceGuess: {
        rails: number;
        plaintext: string;
        chiSquared: number;
    } | null;
    decodedAs: {
        type: 'Base64' | 'Hex';
        text: string;
    }[];
}

/**
 * Standard letter frequencies in the English language. A baseline for our analysis.
 * This is the signature of a language, the key to statistical attacks!
 */
export const ENGLISH_FREQUENCIES_NORMALIZED: number[] = [
  0.08167, 0.01492, 0.02782, 0.04253, 0.12702, 0.02228, 0.02015,
  0.06094, 0.06966, 0.00153, 0.00772, 0.04025, 0.02406, 0.06749,
  0.07507, 0.01929, 0.00095, 0.05987, 0.06327, 0.09056, 0.02758,
  0.00978, 0.02360, 0.00150, 0.01974, 0.00074,
];
export const ENGLISH_FREQUENCIES_MAP: FrequencyMap = {
  a: 8.167, b: 1.492, c: 2.782, d: 4.253, e: 12.702, f: 2.228, g: 2.015,
  h: 6.094, i: 6.966, j: 0.153, k: 0.772, l: 4.025, m: 2.406, n: 6.749,
  o: 7.507, p: 1.929, q: 0.095, r: 5.987, s: 6.327, t: 9.056, u: 2.758,
  v: 0.978, w: 2.360, x: 0.150, y: 1.974, z: 0.074,
};
const ENGLISH_LETTERS_BY_FREQ = 'etaoinshrdlcumwfgypbvkjxqz';
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const ENGLISH_IOC = 0.067;
const RANDOM_IOC = 0.0385;

// --- Cipher Logic Helpers (self-contained for analysis) ---

const modInverse = (a: number, m: number): number => {
    a = ((a % m) + m) % m;
    for (let x = 1; x < m; x++) {
        if ((a * x) % m === 1) return x;
    }
    return -1;
};

const decodeAffine = (text: string, a: number, b: number): string => {
    const a_inv = modInverse(a, 26);
    if (a_inv === -1) return '';
    return text.toLowerCase().replace(/[a-z]/g, (char) => {
        const y = char.charCodeAt(0) - 97;
        const x = (a_inv * (y - b + 26)) % 26;
        return String.fromCharCode(x + 97);
    });
};

const decodeRailFence = (text: string, numRails: number): string => {
    if (numRails <= 1) return text;
    const len = text.length;
    const fence: (string | null)[][] = Array.from({ length: numRails }, () => Array(len).fill(null));
    let rail = 0;
    let direction = 1;
    for (let i = 0; i < len; i++) {
        fence[rail][i] = 'X';
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
};


// --- Core Calculation Functions ---

const calculateFrequencies = (text: string): { frequencies: FrequencyMap, totalLetters: number } => {
  const frequencies: FrequencyMap = {};
  const sanitized = text.toLowerCase().replace(/[^a-z]/g, '');
  for (const char of sanitized) {
    frequencies[char] = (frequencies[char] || 0) + 1;
  }
  return { frequencies, totalLetters: sanitized.length };
};

const calculateIoC = (text: string): number => {
    const { frequencies, totalLetters } = calculateFrequencies(text);
    if (totalLetters < 2) return 0;
    let sum = 0;
    for (const letter in frequencies) {
        const count = frequencies[letter];
        sum += count * (count - 1);
    }
    return sum / (totalLetters * (totalLetters - 1));
};

const findRepeatedSequences = (text: string, minLength = 3, maxLength = 5): Map<string, number[]> => {
    const sequences = new Map<string, number[]>();
    for (let len = maxLength; len >= minLength; len--) {
        for (let i = 0; i <= text.length - len; i++) {
            const seq = text.substring(i, i + len);
            if (!sequences.has(seq)) sequences.set(seq, []);
            sequences.get(seq)!.push(i);
        }
    }
    return sequences;
};

const getFactors = (n: number): number[] => {
    const factors = new Set<number>();
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) {
            factors.add(i);
            factors.add(n / i);
        }
    }
    return Array.from(factors);
};

// --- Vigenère Specific Analysis ---

const guessKeyLength = (text: string): { length: number, score: number }[] => {
    const sequences = findRepeatedSequences(text.toLowerCase().replace(/[^a-z]/g, ''));
    const distances: number[] = [];
    for (const positions of sequences.values()) {
        if (positions.length > 1) {
            for (let i = 1; i < positions.length; i++) {
                distances.push(positions[i] - positions[i-1]);
            }
        }
    }

    const factorCounts: Record<number, number> = {};
    distances.forEach(dist => {
        getFactors(dist).forEach(factor => {
            if (factor <= 20) { // Assume key length is not excessively long
                factorCounts[factor] = (factorCounts[factor] || 0) + 1;
            }
        });
    });
    
    return Object.entries(factorCounts)
        .map(([length, score]) => ({ length: Number(length), score }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5); // Return top 5 likely key lengths
};

const breakVigenere = (text: string, keyLength: number): { key: string, plaintext: string } => {
    const sanitized = text.toLowerCase().replace(/[^a-z]/g, '');
    let key = '';
    
    for (let i = 0; i < keyLength; i++) {
        const column = [];
        for (let j = i; j < sanitized.length; j += keyLength) {
            column.push(sanitized[j]);
        }
        
        const columnText = column.join('');
        const { frequencies: colFreqs } = calculateFrequencies(columnText);
        
        let bestShift = 0;
        let maxDotProduct = -1;

        for (let shift = 0; shift < 26; shift++) {
            let dotProduct = 0;
            for (let k = 0; k < 26; k++) {
                const char = String.fromCharCode(97 + k);
                const shiftedChar = String.fromCharCode(97 + ((k + shift) % 26));
                dotProduct += (colFreqs[shiftedChar] || 0) * ENGLISH_FREQUENCIES_NORMALIZED[k];
            }
            if (dotProduct > maxDotProduct) {
                maxDotProduct = dotProduct;
                bestShift = shift;
            }
        }
        key += String.fromCharCode(97 + bestShift);
    }
    
    // Decrypt with the found key
    let plaintext = '';
    let keyIndex = 0;
    for(const char of sanitized) {
        const shift = key.charCodeAt(keyIndex % key.length) - 97;
        const charCode = char.charCodeAt(0);
        plaintext += String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
        keyIndex++;
    }

    return { key, plaintext };
};

// --- Simple Substitution Specific Analysis ---

const breakSimpleSubstitution = (text: string): { key: string, plaintext: string } => {
    const sanitized = text.toLowerCase().replace(/[^a-z]/g, '');
    const { frequencies } = calculateFrequencies(sanitized);
    
    const cipherLettersByFreq = Object.keys(frequencies).sort((a, b) => frequencies[b] - frequencies[a]);
    
    const substitutionMap: Record<string, string> = {};
    for (let i = 0; i < cipherLettersByFreq.length; i++) {
        substitutionMap[cipherLettersByFreq[i]] = ENGLISH_LETTERS_BY_FREQ[i];
    }

    // Generate the full key for display
    const key = ALPHABET.split('').map(char => substitutionMap[char] || '?').join('');
    
    // Apply the map to decrypt
    const plaintext = sanitized.split('').map(char => substitutionMap[char] || '?').join('');
    
    return { key, plaintext };
};


// --- Scoring and Orchestration ---

const calculateChiSquared = (text: string): number => {
    const { frequencies, totalLetters } = calculateFrequencies(text);
    if (totalLetters === 0) return Infinity;

    let chiSquared = 0;
    for (let i = 0; i < 26; i++) {
        const char = ALPHABET[i];
        const observed = frequencies[char] || 0;
        const expected = totalLetters * ENGLISH_FREQUENCIES_NORMALIZED[i];
        chiSquared += Math.pow(observed - expected, 2) / expected;
    }
    return chiSquared;
};

const bruteForceCaesar = (text: string): CaesarBruteForceResult => {
  const results: CaesarBruteForceResult = [];
  const sanitized = text.toLowerCase();
  for (let shift = 0; shift < 26; shift++) {
    const decrypted = sanitized.replace(/[a-z]/g, (char) => {
      const charCode = char.charCodeAt(0);
      return String.fromCharCode(((charCode - 97 - shift + 26) % 26) + 97);
    });
    results.push({ shift, text: decrypted });
  }
  return results;
};

// --- New Brute-Force Functions ---

const bruteForceAffine = (text: string): FullAnalysisReport['affineGuess'] => {
    const sanitized = text.toLowerCase().replace(/[^a-z]/g, '');
    if (sanitized.length < 10) return null;

    const validA = [1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25];
    let bestGuess: FullAnalysisReport['affineGuess'] = null;
    let bestChi = Infinity;

    for (const a of validA) {
        for (let b = 0; b < 26; b++) {
            const plaintext = decodeAffine(sanitized, a, b);
            const chi = calculateChiSquared(plaintext);
            if (chi < bestChi) {
                bestChi = chi;
                bestGuess = {
                    key: { a, b },
                    plaintext,
                    chiSquared: chi,
                };
            }
        }
    }
    return (bestGuess && bestGuess.chiSquared < 400) ? bestGuess : null;
};

const bruteForceRailFence = (text: string): FullAnalysisReport['railFenceGuess'] => {
    const sanitized = text.toLowerCase().replace(/[^a-z]/g, '');
    if (sanitized.length < 10) return null;

    let bestGuess: FullAnalysisReport['railFenceGuess'] = null;
    let bestChi = Infinity;

    for (let rails = 2; rails <= 15; rails++) {
        if (rails >= sanitized.length) break;
        const plaintext = decodeRailFence(sanitized, rails);
        const chi = calculateChiSquared(plaintext);
        if (chi < bestChi) {
            bestChi = chi;
            bestGuess = {
                rails,
                plaintext,
                chiSquared: chi,
            };
        }
    }
    return (bestGuess && bestGuess.chiSquared < 400) ? bestGuess : null;
};


export const analyzeCiphertext = (text: string): FullAnalysisReport => {
    const suggestions: string[] = [];
    const decodedAs: FullAnalysisReport['decodedAs'] = [];
    
    // 1. Encoding checks
    if (/^[A-Za-z0-9+/=]+$/.test(text) && text.length % 4 === 0) {
        try {
            const decoded = decodeURIComponent(escape(atob(text)));
            if (/^[\x20-\x7E\r\n\t]*$/.test(decoded)) {
                suggestions.push("Input appears to be valid Base64.");
                decodedAs.push({ type: 'Base64', text: decoded });
            }
        } catch (e) { /* Not valid Base64 */ }
    }
    if (/^[0-9a-fA-F\s]+$/.test(text.replace(/\s/g,'')) && text.replace(/\s/g,'').length % 2 === 0) {
         try {
            let cleanHex = text.replace(/\s/g,'');
            let str = '';
            for (let i = 0; i < cleanHex.length; i += 2) {
                str += String.fromCharCode(parseInt(cleanHex.substring(i, i + 2), 16));
            }
            if (/^[\x20-\x7E\r\n\t]*$/.test(str)) {
                suggestions.push("Input appears to be valid Hexadecimal.");
                decodedAs.push({ type: 'Hex', text: str });
            }
        } catch(e) { /* Not valid Hex */ }
    }
    
    const sanitizedAlphabetic = text.toLowerCase().replace(/[^a-z]/g, '');

    // 2. Pattern-based analysis
    if (/^[\d\s,.-]+$/.test(text) && !/[a-zA-Z]/.test(text)) {
        if (/^[.\-\s/]+$/.test(text)) suggestions.push("Input appears to be Morse Code.");
        if (/^[\d\s,]+$/.test(text)) suggestions.push("Input is numeric. Consider A1Z26, Polybius Square, or Decimal values.");
    }
    if (/^[<>\^v\s.]+$/.test(text)) suggestions.push("Input contains symbols characteristic of Pigpen Cipher.");
    const uniqueChars = new Set(sanitizedAlphabetic.split(''));
    if (sanitizedAlphabetic.length > 10 && uniqueChars.size === 2) {
        suggestions.push("Ciphertext contains only two unique letters. This could be a Baconian cipher.");
    }
    if (sanitizedAlphabetic.length > 20 && !/([a-z])\1/.test(sanitizedAlphabetic)) {
        suggestions.push("Ciphertext contains no doubled letters. This is a characteristic of the Playfair cipher.");
    }

    // 3. Statistical analysis
    const freqResults = calculateFrequencies(sanitizedAlphabetic);
    const ioc = calculateIoC(sanitizedAlphabetic);
    const caesarResults = bruteForceCaesar(text);
    const likelyKeyLengths = guessKeyLength(sanitizedAlphabetic);
    
    let bestVigenereGuess: VigenereAnalysisResult['bestGuess'] = null;
    if (likelyKeyLengths.length > 0) {
        let bestOverallChi = Infinity;
        for (const { length } of likelyKeyLengths.slice(0, 3)) {
            const { key, plaintext } = breakVigenere(sanitizedAlphabetic, length);
            const chiSquared = calculateChiSquared(plaintext);
            if (chiSquared < bestOverallChi) {
                bestOverallChi = chiSquared;
                bestVigenereGuess = { key, plaintext, chiSquared };
            }
        }
    }
    
    let likelyCipherType: FullAnalysisReport['likelyCipherType'] = 'Unknown';
    const iocMidpoint = (ENGLISH_IOC + RANDOM_IOC) / 2;
    if (ioc > iocMidpoint) {
        const chi = calculateChiSquared(sanitizedAlphabetic);
        if (chi < 500) {
             likelyCipherType = 'Transposition';
             suggestions.push("IoC and frequency distribution are close to English. Suggests a Transposition cipher (e.g., Rail Fence, Columnar).");
        } else {
            likelyCipherType = 'Monoalphabetic';
            suggestions.push("IoC is high, suggesting a single substitution alphabet.");
            const atbashChi = calculateChiSquared(sanitizedAlphabetic.split('').map(c => String.fromCharCode(219 - c.charCodeAt(0))).join(''));
            if (atbashChi < 500) {
                suggestions.push("The letter frequency is inversely related to English. Strongly suggests Atbash Cipher.");
            }
        }
    } else if (ioc > 0 && ioc < iocMidpoint) {
        likelyCipherType = 'Polyalphabetic';
        suggestions.push("IoC is low, suggesting multiple alphabets were used (e.g., Vigenère).");
    }

    // 4. Specific Attacks
    let simpleSubstitutionGuess: FullAnalysisReport['simpleSubstitutionGuess'] = null;
    if (likelyCipherType === 'Monoalphabetic' && sanitizedAlphabetic.length > 0) {
        simpleSubstitutionGuess = breakSimpleSubstitution(sanitizedAlphabetic);
    }
    
    const affineGuess = bruteForceAffine(sanitizedAlphabetic);
    if (affineGuess) {
        suggestions.push(`Strongly matches Affine cipher profile (key a=${affineGuess.key.a}, b=${affineGuess.key.b}).`);
    }

    const railFenceGuess = bruteForceRailFence(sanitizedAlphabetic);
    if (railFenceGuess) {
        suggestions.push(`Strongly matches Rail Fence cipher profile (${railFenceGuess.rails} rails).`);
    }


    return {
        ioc,
        likelyCipherType,
        frequencies: freqResults,
        caesar: caesarResults,
        vigenere: { likelyKeyLengths, bestGuess: bestVigenereGuess },
        simpleSubstitutionGuess,
        suggestions,
        affineGuess,
        railFenceGuess,
        decodedAs,
    };
};