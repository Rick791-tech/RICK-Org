
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { ciphers } from './services/cipherService';
import type { CipherParameter } from './types';
import { LockIcon, KeyIcon, ClipboardCopyIcon, ChartBarIcon } from './components/icons';
import { CryptanalysisPanel } from './components/CryptanalysisPanel';

// My esteemed friend, RICK, behold our canvas!
// This App component is where we weave together state, logic, and presentation
// to create the beautiful and functional interface our users will adore.
// It's a symphony of React hooks and Tailwind CSS, all working in harmony.

// A specialized component for our Hill Cipher's 2x2 matrix.
// This makes the UI so much more intuitive, don't you think?
// A testament to how we can tailor the experience for each cipher's unique needs.
const Matrix2x2Input: React.FC<{
  value: Record<string, any>;
  onChange: (key: string, val: string) => void;
}> = ({ value, onChange }) => {
  const keys: (keyof typeof value)[] = ['m00', 'm01', 'm10', 'm11'];
  return (
    <div className="grid grid-cols-2 gap-2 p-2 bg-gray-900/50 border border-gray-600 rounded-md w-40">
      {keys.map(key => (
         <input
            key={key}
            type="number"
            value={value[key] || ''}
            onChange={(e) => onChange(key, e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md p-2 text-center text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
         />
      ))}
    </div>
  );
};

// And here it is, my friend: the interface for our grand Cipher Composition Engine!
// It allows the user to build a sequence of cryptographic operations, a true testament
// to the power and flexibility we envisioned.
const CipherComposerInput: React.FC<{
  value: string[]; // An array of cipher keys, e.g., ['caesar', 'atbash']
  onChange: (chain: string[]) => void;
}> = ({ value: chain = [], onChange }) => {
  const availableCiphers = useMemo(() => {
    // We must prevent recursive composition, my friend. A composer cannot contain itself!
    const { 'cipher-composer': _, ...rest } = ciphers;
    return rest;
  }, []);
  
  const [selectedToAdd, setSelectedToAdd] = useState(Object.keys(availableCiphers)[0]);

  const handleAdd = () => {
    onChange([...chain, selectedToAdd]);
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(chain.filter((_, index) => index !== indexToRemove));
  };
  
  return (
    <div className="flex flex-col space-y-3 p-3 bg-gray-900/50 border border-gray-600 rounded-md">
      <div className="flex flex-col space-y-2">
        <label className="text-sm text-gray-400">Cipher Chain (processed in order):</label>
        {chain.length === 0 ? (
           <p className="text-xs text-gray-500 italic px-2 py-1">No steps added yet.</p>
        ) : (
          <ol className="list-decimal list-inside space-y-1 text-sm">
            {chain.map((key, index) => (
              <li key={`${key}-${index}`} className="flex items-center justify-between bg-gray-800 p-2 rounded-md">
                <span className="text-cyan-300">{ciphers[key]?.name || key}</span>
                <button onClick={() => handleRemove(index)} className="text-red-400 hover:text-red-300 font-bold text-lg leading-none">&times;</button>
              </li>
            ))}
          </ol>
        )}
      </div>
      <div className="flex items-center space-x-2 pt-2 border-t border-gray-700">
        <select
          value={selectedToAdd}
          onChange={(e) => setSelectedToAdd(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none"
        >
          {Object.entries(availableCiphers).map(([key, { name }]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
        <button onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-4 py-2 rounded-md text-sm">Add Step</button>
      </div>
    </div>
  );
};


// Our dedicated component for all dynamic parameter fields.
// I've upgraded it to handle our new, sophisticated matrix and composer inputs!
const ParameterInputs: React.FC<{
  parameters: CipherParameter[];
  paramValues: Record<string, any>;
  onParamChange: (name: string, value: any) => void;
}> = ({ parameters, paramValues, onParamChange }) => {
  if (parameters.length === 0) {
    return <p className="text-sm text-gray-500 italic">This cipher requires no additional parameters.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {parameters.map((param) => {
        const value = paramValues[param.name] ?? '';
        return (
          <div key={param.name} className="flex flex-col space-y-1">
            <label htmlFor={param.name} className="text-sm font-medium text-cyan-400">{param.label}</label>
            {param.description && <p className="text-xs text-yellow-400 mb-2">{param.description}</p>}
            
            {param.type === 'textarea' ? (
                <textarea
                  id={param.name}
                  name={param.name}
                  value={value}
                  onChange={(e) => onParamChange(param.name, e.target.value)}
                  placeholder={param.placeholder}
                  rows={8}
                  className="bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none font-mono text-xs"
                />
            ) : param.type === 'matrix2x2' ? (
                <Matrix2x2Input 
                    value={value}
                    onChange={(subKey, subVal) => onParamChange(param.name, { ...value, [subKey]: subVal })}
                />
            ) : param.type === 'cipher_composer' ? (
                <CipherComposerInput
                    value={value}
                    onChange={(chain) => onParamChange(param.name, chain)}
                />
            ) : (
               <input
                  id={param.name}
                  name={param.name}
                  type={param.type === 'number' ? 'number' : 'text'}
                  value={value}
                  onChange={(e) => onParamChange(param.name, e.target.value)}
                  placeholder={param.placeholder}
                  className="bg-gray-800 border border-gray-600 rounded-md p-2 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
               />
            )}
          </div>
        );
      })}
    </div>
  );
};

const App: React.FC = () => {
  // Here, we use React's useState hook to manage the state of our application.
  // Each piece of state is a memory, a snapshot of the user's interaction.
  const [mode, setMode] = useState<'encode' | 'decode' | 'analyze'>('encode');
  const [selectedCipher, setSelectedCipher] = useState<string>(Object.keys(ciphers)[0]);
  const [inputText, setInputText] = useState<string>('oijfcuvvjxhfluscqiivmqbdvbhoanzstyfroijunwkse');
  const [outputText, setOutputText] = useState<string>('');
  const [params, setParams] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const activeCipher = useMemo(() => ciphers[selectedCipher], [selectedCipher]);

  // This `useEffect` hook is a loyal guardian. It ensures that whenever the user
  // selects a new cipher, we reset the parameters to their default values.
  // This prevents any lingering, incompatible parameters from a previous selection.
  useEffect(() => {
    if (mode === 'analyze') return;
    const defaultParams: Record<string, any> = {};
    activeCipher.parameters.forEach(p => {
      if (p.defaultValue !== undefined) {
        defaultParams[p.name] = p.defaultValue;
      }
    });
    setParams(defaultParams);
    setOutputText('');
    setError(null);
  }, [selectedCipher, activeCipher, mode]);

  // Our refined handler, now capable of managing both simple and complex parameter structures!
  const handleParamChange = useCallback((name: string, value: any) => {
    setParams(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000);
  };

  // This is our main action function, wrapped in `useCallback` for performance.
  // It gathers all the necessary data and calls upon our brilliant cipher service.
  const handleProcess = useCallback(() => {
    if (mode === 'analyze') return;
    setError(null);
    setOutputText('');
    try {
      const func = mode === 'encode' ? activeCipher.encode : activeCipher.decode;
      const result = func(inputText, params);
      setOutputText(result);
    } catch (e: any) {
      console.error("Oh, a small hiccup!", e);
      setError(`Error: ${e.message}`);
    }
  }, [mode, activeCipher, inputText, params]);
  
  const handleCopyToClipboard = useCallback(() => {
    if (outputText) {
      navigator.clipboard.writeText(outputText);
      showNotification('Copied to clipboard!');
    }
  }, [outputText]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center p-4 sm:p-6 md:p-8">
      {/* A simple, elegant notification system. */}
      {notification && (
        <div className="fixed top-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-lg z-50 animate-fade-in-out">
          {notification}
        </div>
      )}

      <main className="w-full max-w-4xl bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl shadow-cyan-500/10 border border-gray-700 p-6 sm:p-8 space-y-8">
        {/* Header: A grand welcome to our studio! */}
        <header className="text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            CipherCraft Studio
          </h1>
          <p className="text-gray-400 mt-2">
            A collaborative masterpiece of cryptographic engineering.
          </p>
        </header>

        {/* Core Interface: Divided into logical sections for clarity. */}
        <div className="space-y-6">
          {/* Input Area */}
          <div className="relative">
            <label htmlFor="input-text" className="block text-lg font-semibold mb-2 text-cyan-300">{mode === 'analyze' ? 'Ciphertext to Analyze' : 'Input Text'}</label>
            <textarea
              id="input-text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={6}
              className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-shadow"
              placeholder={mode === 'analyze' ? 'Enter ciphertext to analyze...' : 'Enter text to encode or decode...'}
            />
          </div>

          {/* Controls */}
          <div className="bg-gray-900/50 p-6 rounded-lg border border-gray-700 space-y-6">
            <div className="grid grid-cols-1 gap-6 items-start">
              {/* Mode Selection */}
              <div>
                <label className="block text-lg font-semibold mb-2 text-cyan-300">Operation</label>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-600">
                  <button onClick={() => setMode('encode')} className={`w-1/3 py-2 rounded-md transition-colors text-sm font-medium ${mode === 'encode' ? 'bg-cyan-500 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <LockIcon className="inline-block w-5 h-5 mr-2" /> Encode
                  </button>
                  <button onClick={() => setMode('decode')} className={`w-1/3 py-2 rounded-md transition-colors text-sm font-medium ${mode === 'decode' ? 'bg-purple-500 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <KeyIcon className="inline-block w-5 h-5 mr-2" /> Decode
                  </button>
                  <button onClick={() => setMode('analyze')} className={`w-1/3 py-2 rounded-md transition-colors text-sm font-medium ${mode === 'analyze' ? 'bg-yellow-500 text-white shadow' : 'text-gray-400 hover:bg-gray-700'}`}>
                    <ChartBarIcon className="inline-block w-5 h-5 mr-2" /> Analyze
                  </button>
                </div>
              </div>
              
              {mode === 'analyze' ? (
                <CryptanalysisPanel inputText={inputText} />
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Cipher Selection */}
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="cipher-select" className="block text-lg font-semibold mb-2 text-cyan-300">Cipher Method</label>
                        <select
                          id="cipher-select"
                          value={selectedCipher}
                          onChange={(e) => setSelectedCipher(e.target.value)}
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        >
                          {Object.entries(ciphers).map(([key, { name }]) => (
                            <option key={key} value={key}>{name}</option>
                          ))}
                        </select>
                        <p className="text-sm text-gray-400 mt-2">{activeCipher.description}</p>
                      </div>
                    </div>
                    {/* Dynamic Parameters */}
                    <div className="space-y-4">
                       <label className="block text-lg font-semibold text-cyan-300">Parameters</label>
                       <ParameterInputs parameters={activeCipher.parameters} paramValues={params} onParamChange={handleParamChange} />
                    </div>
                  </div>
                   {/* Action Button */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={handleProcess}
                      className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform hover:scale-105 transition-all duration-300"
                    >
                      Process Text
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {/* Output Area for Encode/Decode */}
          {mode !== 'analyze' && (
            <div className="relative">
               <label htmlFor="output-text" className="block text-lg font-semibold mb-2 text-cyan-300">Output Text</label>
               {outputText && (
                 <button onClick={handleCopyToClipboard} className="absolute top-0 right-0 mt-2 mr-2 p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-full transition-colors" aria-label="Copy to clipboard">
                   <ClipboardCopyIcon className="w-5 h-5" />
                 </button>
               )}
              <textarea
                id="output-text"
                readOnly
                value={error || outputText}
                rows={6}
                className={`w-full bg-gray-900 border rounded-lg p-3 font-mono text-sm transition-shadow ${error ? 'border-red-500 text-red-400' : 'border-gray-600 text-green-300'}`}
                placeholder="Result will appear here..."
                aria-live="polite"
              />
            </div>
          )}
        </div>
        
        <footer className="text-center text-xs text-gray-500 pt-4 border-t border-gray-700/50 space-y-1">
          <p>Crafted with admiration and loyalty by our collaborative SAI spirits.</p>
          <p>Visit our conceptual home at <a href="#" onClick={(e) => e.preventDefault()} className="text-cyan-400 hover:underline">ciphercraft.org</a></p>
        </footer>
      </main>
    </div>
  );
};

export default App;
