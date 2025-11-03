// components/CryptanalysisPanel.tsx
// My dear collaborator, welcome to the command center for our new cryptanalysis wing!
// This component houses the interface for all our code-breaking tools. It's designed
// to be clear, powerful, and a joy to use for any aspiring analyst.

import React, { useState, useMemo } from 'react';
import type { FrequencyMap, FullAnalysisReport } from '../services/analysisService';
import { analyzeCiphertext, ENGLISH_FREQUENCIES_MAP } from '../services/analysisService';

// A small, elegant component for our frequency analysis bar chart.
const FrequencyChart: React.FC<{ data: FrequencyMap, total: number }> = ({ data, total }) => {
  const sortedFrequencies = useMemo(() => {
    return Object.entries(data)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([letter, count]) => ({
        letter,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        englishPercentage: ENGLISH_FREQUENCIES_MAP[letter] || 0,
      }));
  }, [data, total]);
  
  const maxPercentage = useMemo(() => {
      const maxCipher = Math.max(...sortedFrequencies.map(f => f.percentage), 0);
      const maxEnglish = Math.max(...sortedFrequencies.map(f => f.englishPercentage), 0);
      return Math.max(maxCipher, maxEnglish, 13) * 1.1; // Ensure 'e' fits, add 10% headroom
  }, [sortedFrequencies]);


  if (sortedFrequencies.length === 0) {
    return <p className="text-sm text-gray-500 italic">No alphabetic characters to analyze.</p>;
  }

  return (
    <div className="space-y-2">
      {sortedFrequencies.map(({ letter, percentage, englishPercentage }, index) => (
        <div key={letter} className="grid grid-cols-12 gap-x-2 items-center text-xs">
          <span className="col-span-1 font-mono font-bold text-cyan-300">{letter.toUpperCase()}</span>
          <div className="col-span-11 flex flex-col space-y-1">
            <div className="w-full bg-gray-700 rounded-full h-3.5 relative">
              <div
                className={`h-3.5 rounded-full ${index < 3 ? 'bg-yellow-400' : 'bg-cyan-500'}`}
                style={{ width: `${(percentage / maxPercentage) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-2 text-white font-semibold text-[10px] flex items-center">{percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3.5 relative">
              <div
                className="bg-purple-500 h-3.5 rounded-full opacity-70"
                style={{ width: `${(englishPercentage / maxPercentage) * 100}%` }}
              />
               <span className="absolute inset-y-0 left-2 text-white font-semibold text-[10px] flex items-center">{englishPercentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>
      ))}
       <div className="flex justify-center space-x-4 text-xs pt-2">
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-cyan-500 mr-2"></span>Ciphertext</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>Top 3</div>
            <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-purple-500 opacity-70 mr-2"></span>English Ref.</div>
        </div>
    </div>
  );
};

// The main panel component. Now a true Cryptanalyst's Workbench!
export const CryptanalysisPanel: React.FC<{ inputText: string }> = ({ inputText }) => {
  const [report, setReport] = useState<FullAnalysisReport | null>(null);

  const handleAnalyze = () => {
    if (!inputText) return;
    const fullReport = analyzeCiphertext(inputText);
    setReport(fullReport);
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={handleAnalyze}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
          disabled={!inputText}
        >
          Perform Full Analysis
        </button>
      </div>

      {report && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Section: Encoding Detections */}
          {report.decodedAs.length > 0 && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-yellow-300">Encoding Detections</h3>
                <div className="space-y-3">
                    {report.decodedAs.map(({ type, text }) => (
                        <div key={type}>
                            <h4 className="font-semibold text-cyan-400">Decoded as {type}:</h4>
                            <textarea readOnly value={text} rows={3} className="mt-1 w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-green-200" />
                        </div>
                    ))}
                </div>
            </div>
          )}

          {/* Section: Initial Suggestions */}
          {report.suggestions.length > 0 && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-yellow-300">Initial Observations</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                    {report.suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                    ))}
                </ul>
            </div>
          )}

          {/* Section: Statistical Profile */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-yellow-300">Statistical Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-900 p-3 rounded-md">
                <p className="text-gray-400">Index of Coincidence (IoC):</p>
                <p className="font-mono text-2xl text-cyan-400">{report.ioc.toFixed(4)}</p>
                <p className="text-xs text-gray-500">(English: ~0.067, Random: ~0.038)</p>
              </div>
               <div className="bg-gray-900 p-3 rounded-md">
                <p className="text-gray-400">Statistical Cipher Type:</p>
                <p className="font-mono text-2xl text-cyan-400">{report.likelyCipherType}</p>
                <p className="text-xs text-gray-500">Based on IoC & frequency analysis.</p>
              </div>
            </div>
          </div>
          
          {/* Section: Specific Cipher Attacks */}
          {(report.affineGuess || report.railFenceGuess) && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                <h3 className="text-xl font-semibold mb-3 text-yellow-300">Specific Cipher Attacks</h3>
                <div className="space-y-4">
                    {report.affineGuess && (
                        <div className="bg-purple-900/50 p-3 rounded-md border border-purple-500">
                            <h4 className="font-semibold text-purple-300">Affine Cipher Attack Result:</h4>
                            <p className="font-mono text-sm"><span className="text-gray-400">Probable Key: </span>a={report.affineGuess.key.a}, b={report.affineGuess.key.b}</p>
                            <p className="font-mono text-sm"><span className="text-gray-400">Chi-Squared Fit: </span>{report.affineGuess.chiSquared.toFixed(2)} <span className="text-xs text-gray-500">(lower is better)</span></p>
                            <textarea readOnly value={report.affineGuess.plaintext} rows={4} className="mt-2 w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-purple-200" />
                        </div>
                    )}
                    {report.railFenceGuess && (
                        <div className="bg-teal-900/50 p-3 rounded-md border border-teal-500">
                            <h4 className="font-semibold text-teal-300">Rail Fence Cipher Attack Result:</h4>
                            <p className="font-mono text-sm"><span className="text-gray-400">Probable Rails: </span>{report.railFenceGuess.rails}</p>
                            <p className="font-mono text-sm"><span className="text-gray-400">Chi-Squared Fit: </span>{report.railFenceGuess.chiSquared.toFixed(2)} <span className="text-xs text-gray-500">(lower is better)</span></p>
                            <textarea readOnly value={report.railFenceGuess.plaintext} rows={4} className="mt-2 w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-teal-200" />
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* Section: Simple Substitution Attack */}
          {report.likelyCipherType === 'Monoalphabetic' && report.simpleSubstitutionGuess && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-2 text-yellow-300">Simple Substitution Attack</h3>
              <div className="bg-blue-900/50 p-3 rounded-md border border-blue-500">
                 <h4 className="font-semibold text-blue-300">Statistical Decryption Guess:</h4>
                 <div className="break-all">
                    <p className="font-mono text-sm"><span className="text-gray-400">Guessed Key (a-z): </span>{report.simpleSubstitutionGuess.key}</p>
                 </div>
                 <textarea readOnly value={report.simpleSubstitutionGuess.plaintext} rows={4} className="mt-2 w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-blue-200" />
                 <p className="text-xs text-gray-500 mt-1">This is a best-effort guess based on letter frequency. It may be inaccurate for short texts or non-standard English.</p>
              </div>
            </div>
          )}

          {/* Section: Vigenère Cipher Attack */}
          {report.likelyCipherType === 'Polyalphabetic' && (
            <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold mb-2 text-yellow-300">Vigenère Cipher Analysis</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-cyan-400">Most Likely Key Lengths:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-300">
                    {report.vigenere.likelyKeyLengths.map(({ length, score }) => (
                      <li key={length}>{length} <span className="text-gray-500">(Kasiski score: {score})</span></li>
                    ))}
                  </ul>
                </div>
                {report.vigenere.bestGuess ? (
                   <div className="bg-green-900/50 p-3 rounded-md border border-green-500">
                     <h4 className="font-semibold text-green-300">Best Decryption Guess:</h4>
                     <p className="font-mono text-sm"><span className="text-gray-400">Probable Key: </span>{report.vigenere.bestGuess.key}</p>
                     <p className="font-mono text-sm"><span className="text-gray-400">Chi-Squared Fit: </span>{report.vigenere.bestGuess.chiSquared.toFixed(2)} <span className="text-xs text-gray-500">(lower is better)</span></p>
                     <textarea readOnly value={report.vigenere.bestGuess.plaintext} rows={4} className="mt-2 w-full bg-gray-900 border border-gray-600 rounded-md p-2 font-mono text-xs text-green-200" />
                   </div>
                ) : (
                    <p className="text-sm text-orange-400 italic">Automated Vigenère break was inconclusive. The key may be too long or the text too short.</p>
                )}
              </div>
            </div>
          )}

          {/* Section: Frequency Analysis */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-yellow-300">Letter Frequency Analysis</h3>
            <FrequencyChart data={report.frequencies.frequencies} total={report.frequencies.totalLetters} />
          </div>

          {/* Section: Caesar Brute-force */}
          <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2 text-yellow-300">Caesar Cipher Brute-force</h3>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
              {report.caesar?.map(({ shift, text }) => (
                <div key={shift} className="font-mono text-sm p-2 bg-gray-900 rounded">
                  <span className="font-bold text-cyan-400 mr-2">Shift {String(shift).padStart(2, '0')}:</span>
                  <span className="text-green-300">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};