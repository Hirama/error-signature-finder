'use client';

import { useState, useEffect } from 'react';
import { extractErrors } from '../utils/solidityParser';
import { calculateSelector, checkSelectorMatch } from '../utils/errorSelector';
import { SolidityHighlighter } from './SolidityHighlighter';

export function SolidityErrorFinder() {
  const [solidityCode, setSolidityCode] = useState('');
  const [selector, setSelector] = useState('');
  const [errors, setErrors] = useState<any[]>([]);
  const [matchingError, setMatchingError] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showAllErrors, setShowAllErrors] = useState(false);
  const [showHighlighted, setShowHighlighted] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'selector'>('code');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setSolidityCode(content);
      parseErrors(content);
    };
    reader.readAsText(file);
  };

  const handleCodeInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    setSolidityCode(code);
    if (code.trim()) {
      parseErrors(code);
    } else {
      setErrors([]);
      setMatchingError(null);
    }
  };

  const parseErrors = async (code: string) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const extractedErrors = await extractErrors(code);
      
      // Ensure we have an array
      const errorsArray = Array.isArray(extractedErrors) ? extractedErrors : [];
      
      // Add selectors to errors
      const errorsWithSelectors = errorsArray.map(error => {
        if (!error.selector) {
          error.selector = calculateSelector(error.signature);
        }
        return error;
      });
      
      setErrors(errorsWithSelectors);
      setIsLoading(false);

      // If we already have a selector, check for matches
      if (selector) {
        findMatchingError(errorsWithSelectors, selector);
      }
    } catch (error) {
      console.error('Error parsing:', error);
      setIsLoading(false);
      setErrors([]);
      setErrorMessage(`Error parsing Solidity code: ${(error as Error).message}`);
    }
  };

  const handleSelectorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.startsWith('0x') ? e.target.value : `0x${e.target.value}`;
    setSelector(value);
    
    if (value.length >= 10 && errors.length > 0) {
      findMatchingError(errors, value);
    } else {
      setMatchingError(null);
    }
  };

  const findMatchingError = (errors: any[], selector: string) => {
    setErrorMessage('');
    setMatchingError(null);

    try {
      const validSelector = validateSelector(selector);
      if (!validSelector) {
        setErrorMessage('Invalid selector format. Should be a 4-byte hex string (0x followed by 8 hex characters).');
        return;
      }

      if (!Array.isArray(errors)) {
        setErrorMessage('Invalid errors data structure');
        return;
      }

      const match = checkSelectorMatch(errors, validSelector);
      if (match) {
        setMatchingError(match);
      }
    } catch (error) {
      console.error('Error finding match:', error);
      setErrorMessage(`Error finding match: ${(error as Error).message}`);
    }
  };

  const validateSelector = (selector: string): string | null => {
    // Check format: 0x followed by 8 hex characters
    const hexRegex = /^0x[0-9a-fA-F]{8}$/;
    if (!hexRegex.test(selector)) {
      return null;
    }
    return selector;
  };

  // Example Solidity code for the placeholder
  const placeholderCode = `// Example Solidity Error
contract MyContract {
    error InvalidInput(uint256 provided, uint256 max);
    error Unauthorized(address caller);
    
    function example() external pure {
        revert InvalidInput(100, 50);
    }
}`;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('code')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'code'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            1. Upload/Paste Code
          </button>
          <button
            onClick={() => setActiveTab('selector')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'selector'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            2. Enter Selector
          </button>
        </nav>
      </div>

      {/* Code Input Section */}
      <div className={activeTab === 'code' ? 'block' : 'hidden'}>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upload or paste Solidity code</h2>
              {errors.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                  {errors.length} {errors.length === 1 ? 'error' : 'errors'} found
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload .sol file
                <input
                  type="file"
                  accept=".sol"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
              </label>

              {solidityCode && (
                <button
                  type="button"
                  onClick={() => {
                    setSolidityCode('');
                    setErrors([]);
                    setMatchingError(null);
                  }}
                  className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                >
                  Clear code
                </button>
              )}
            </div>

            <div className="relative rounded-md overflow-hidden border border-gray-300 dark:border-gray-600 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-colors">
              <textarea
                value={solidityCode}
                onChange={handleCodeInput}
                className="block w-full border-0 bg-transparent px-3 py-2 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none dark:bg-gray-700 min-h-[180px] font-mono text-sm"
                placeholder={placeholderCode}
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800">
                {errorMessage}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="h-5 w-5 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
            )}

            {solidityCode && !isLoading && errors.length > 0 && (
              <div className="mt-4 space-y-4">
                {matchingError && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm rounded-md border border-green-200 dark:border-green-800 flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Matching error found!</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span>
                          <span className="font-medium">Name:</span>{" "}
                          <code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-800 rounded text-xs">{matchingError.name}</code>
                        </span>
                        <span>
                          <span className="font-medium">Selector:</span>{" "}
                          <code className="px-1.5 py-0.5 bg-green-100 dark:bg-green-800 rounded text-xs">{matchingError.selector}</code>
                        </span>
                      </div>
                    </div>
                    <button
                      className="mt-3 md:mt-0 text-xs text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 underline"
                      onClick={() => setShowHighlighted(!showHighlighted)}
                    >
                      {showHighlighted ? "Hide in code" : "Highlight in code"}
                    </button>
                  </div>
                )}

                {showHighlighted && (
                  <div className="mt-2">
                    <SolidityHighlighter 
                      code={solidityCode} 
                      highlightError={matchingError ? matchingError.name : undefined} 
                      maxLines={15}
                      contextLines={8}
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">Errors Found ({errors.length})</h3>
                    <button
                      type="button"
                      onClick={() => setShowAllErrors(!showAllErrors)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    >
                      {showAllErrors ? "Hide" : "Show All"}
                    </button>
                  </div>

                  {showAllErrors && (
                    <div className="mt-2 overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Signature</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Selector</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                          {errors.map((error, index) => (
                            <tr 
                              key={index}
                              className={matchingError && matchingError.name === error.name ? 'bg-green-50 dark:bg-green-900/20' : ''}
                            >
                              <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white">{error.name}</td>
                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                <div className="truncate max-w-[200px] md:max-w-[300px]">
                                  {error.signature}
                                </div>
                              </td>
                              <td className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono">{error.selector}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {errors.length > 0 && (
              <button
                onClick={() => setActiveTab('selector')}
                className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Next: Enter Selector
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Selector Input Section */}
      <div className={activeTab === 'selector' ? 'block' : 'hidden'}>
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Enter error selector</h2>
              
              {errors.length > 0 && (
                <button
                  onClick={() => setActiveTab('code')}
                  className="inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to code
                </button>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                4-byte error selector
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 sm:text-sm">0x</span>
                </div>
                <input
                  type="text"
                  value={selector.replace(/^0x/, '')}
                  onChange={handleSelectorInput}
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white sm:text-sm font-mono"
                  placeholder="12345678"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Enter a 4-byte error selector in hex format (8 characters after 0x)
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm rounded-md border border-red-200 dark:border-red-800">
                {errorMessage}
              </div>
            )}

            {selector && errors.length > 0 && (
              <div className="mt-4">
                {matchingError ? (
                  <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-md border border-green-200 dark:border-green-800">
                    <h3 className="font-medium text-green-800 dark:text-green-200 text-sm">Match found!</h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-100 dark:border-green-800">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Error Name</span>
                        <code className="text-sm font-mono text-gray-900 dark:text-white">{matchingError.name}</code>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-100 dark:border-green-800">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Selector</span>
                        <code className="text-sm font-mono text-gray-900 dark:text-white">{matchingError.selector}</code>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-800 rounded border border-green-100 dark:border-green-800 md:col-span-2">
                        <span className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Signature</span>
                        <code className="text-sm font-mono text-gray-900 dark:text-white break-all">{matchingError.signature}</code>
                      </div>
                    </div>
                    
                    <button
                      className="mt-3 text-sm text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 inline-flex items-center"
                      onClick={() => {
                        setShowHighlighted(true);
                        setActiveTab('code');
                      }}
                    >
                      <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      View in code
                    </button>
                  </div>
                ) : (
                  selector.length >= 10 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm rounded-md border border-yellow-200 dark:border-yellow-800">
                      No matching error found for selector {selector}.
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 