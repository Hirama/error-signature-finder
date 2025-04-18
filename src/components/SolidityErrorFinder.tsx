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

  return (
    <div className="space-y-8">
      {/* File upload section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Step 1: Upload a Solidity file or paste code</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload .sol file
          </label>
          <input
            type="file"
            accept=".sol"
            onChange={handleFileUpload}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or paste Solidity code
          </label>
          <textarea
            value={solidityCode}
            onChange={handleCodeInput}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white min-h-[200px]"
            placeholder="// Paste your Solidity code here..."
          />
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-md">
            {errorMessage}
          </div>
        )}

        {solidityCode && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowHighlighted(!showHighlighted)}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
            >
              {showHighlighted ? "Hide Highlighted Code" : "Show Highlighted Code"}
            </button>
            
            {showHighlighted && (
              <div className="mt-2">
                <SolidityHighlighter 
                  code={solidityCode} 
                  highlightError={matchingError ? matchingError.name : undefined} 
                  maxLines={20}
                  contextLines={10}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selector input section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Step 2: Enter 4-byte error selector</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Error selector (4 bytes)
          </label>
          <input
            type="text"
            value={selector}
            onChange={handleSelectorInput}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="0x12345678"
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Format: 0x followed by 8 hex characters (e.g., 0xabcdef12)
          </p>
        </div>
      </div>

      {/* Results section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Results</h2>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
          </div>
        ) : errors.length > 0 ? (
          <div className="space-y-6">
            {matchingError ? (
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-md">
                <h3 className="font-semibold text-green-800 dark:text-green-200">Match found!</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Error Name:</span>{" "}
                    <code className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded">{matchingError.name}</code>
                  </p>
                  <p>
                    <span className="font-medium">Error Signature:</span>{" "}
                    <code className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded">{matchingError.signature}</code>
                  </p>
                  <p>
                    <span className="font-medium">Selector:</span>{" "}
                    <code className="px-2 py-1 bg-green-200 dark:bg-green-800 rounded">{matchingError.selector}</code>
                  </p>
                </div>
              </div>
            ) : selector.length >= 10 ? (
              <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                <p className="text-yellow-800 dark:text-yellow-200">No matching error found for selector {selector}.</p>
              </div>
            ) : null}

            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white">All Errors Found ({errors.length})</h3>
                <button
                  type="button"
                  onClick={() => setShowAllErrors(!showAllErrors)}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                >
                  {showAllErrors ? "Hide" : "Show All"}
                </button>
              </div>

              {showAllErrors && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Signature</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Selector</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {errors.map((error, index) => (
                        <tr key={index} className={matchingError && matchingError.selector === error.selector ? "bg-green-50 dark:bg-green-900" : ""}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{error.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{error.signature}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{error.selector}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : solidityCode ? (
          <p className="text-gray-500 dark:text-gray-400">No errors found in the provided Solidity code.</p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Please upload a Solidity file or paste code to get started.</p>
        )}
      </div>
    </div>
  );
} 