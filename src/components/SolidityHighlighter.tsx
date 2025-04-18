'use client';

import React, { useState, useEffect, useMemo } from 'react';

interface SolidityHighlighterProps {
  code: string;
  highlightError?: string;
  maxLines?: number;
  contextLines?: number;
}

export function SolidityHighlighter({ 
  code, 
  highlightError,
  maxLines = 25,
  contextLines = 5  // Default to 5 lines of context
}: SolidityHighlighterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Reset expanded state when code changes
  useEffect(() => {
    setIsExpanded(false);
  }, [code]);

  // Basic regex patterns for Solidity syntax
  const keywordPattern = /\b(contract|error|function|address|uint256|string|bytes|bool|if|else|for|while|struct|mapping|public|private|external|internal|pure|view|returns|memory|storage|calldata|payable|modifier|import|pragma|solidity|interface)\b/g;
  const commentPattern = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
  const stringPattern = /"(?:[^"\\]|\\.)*"/g;
  const numberPattern = /\b\d+\b/g;
  const errorNamePattern = /error\s+([A-Za-z0-9_]+)/g;
  
  // Memoize the extraction of errors to avoid recalculating on each render
  const allErrors = useMemo(() => {
    const errorRegex = /error\s+([A-Za-z0-9_]+)\s*\([^)]*\)/g;
    const matches = [...code.matchAll(errorRegex)];
    return matches.map(match => ({
      name: match[1],
      fullMatch: match[0],
      index: match.index || 0
    }));
  }, [code]);

  // Function to highlight error definition with the given name
  const highlightErrorDef = (text: string, errorName: string | undefined) => {
    if (!errorName) return text;
    
    // Create a pattern to find the error definition
    const errorDefPattern = new RegExp(`(error\\s+${errorName}\\s*\\([^)]*\\))`, 'g');
    
    return text.replace(errorDefPattern, (match) => {
      return `<span class="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">${match}</span>`;
    });
  };
  
  // Split the code into lines
  const lines = code.split('\n');
  
  // Determine if the code needs to be truncated
  const shouldTruncate = !isExpanded && lines.length > maxLines;
  
  // Get code to display based on truncation state
  const displayCode = useMemo(() => {
    if (!shouldTruncate) {
      return code;
    }

    if (highlightError) {
      // If we have a specific error to highlight
      const targetError = allErrors.find(err => err.name === highlightError);
      if (targetError) {
        // Find the line number where the error is defined
        const lineNumberUpToError = code.substring(0, targetError.index).split('\n').length - 1;
        
        // Show lines around the error (exact context)
        const startLine = Math.max(0, lineNumberUpToError - contextLines);
        const endLine = Math.min(lines.length, lineNumberUpToError + contextLines + 1);
        
        // Create the displayed content with headers
        return [
          ...lines.slice(0, 3), // First 3 lines
          '/* ... */',
          ...lines.slice(startLine, endLine),
          '/* ... */'
        ].join('\n');
      }
    }
    
    // If no specific error to highlight or it wasn't found
    if (allErrors.length > 0) {
      // Show areas around errors
      const errorSections: string[] = [];
      const addedLines = new Set<number>();
      
      // Add first few lines
      for (let i = 0; i < 3 && i < lines.length; i++) {
        addedLines.add(i);
      }
      
      // Process up to 5 errors
      const errorsToShow = allErrors.slice(0, 5);
      
      // Add each error with context
      errorsToShow.forEach((error, idx) => {
        const lineNumber = code.substring(0, error.index).split('\n').length - 1;
        
        // Add context lines
        const startLine = Math.max(0, lineNumber - contextLines);
        const endLine = Math.min(lines.length, lineNumber + contextLines + 1);
        
        if (idx > 0) {
          errorSections.push('/* ... */');
        }
        
        for (let i = startLine; i < endLine; i++) {
          if (!addedLines.has(i)) {
            errorSections.push(lines[i]);
            addedLines.add(i);
          }
        }
      });
      
      // Combine the displayCode
      return [
        ...Array.from(addedLines).filter(i => i < 3).map(i => lines[i]),
        '/* ... */',
        ...errorSections,
        '/* ... */'
      ].join('\n');
    }
    
    // Default truncation if no errors
    return [
      ...lines.slice(0, maxLines),
      '/* ... */'
    ].join('\n');
  }, [code, shouldTruncate, highlightError, allErrors, contextLines, lines, maxLines]);

  // Process the code for display with syntax highlighting
  const processedCode = useMemo(() => {
    // First handle line breaks to preserve them in the HTML
    let processedCode = displayCode.replace(/\n/g, '<br />');
    
    // Now process the code with proper escaping
    let highlightedCode = processedCode
      // Escape HTML special characters
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Add back the line breaks we replaced
      .replace(/&lt;br \/&gt;/g, '<br />');
    
    // Store segments to preserve their order (comments, strings, etc.)
    const segments: {pattern: string, className: string}[] = [];
    
    // Process comments first (they might contain keywords)
    let commentMatched = highlightedCode.match(commentPattern);
    if (commentMatched) {
      commentMatched.forEach(match => {
        segments.push({
          pattern: match,
          className: 'text-gray-500 dark:text-gray-400'
        });
      });
    }
    
    // Process strings (they might contain keywords too)
    let stringMatched = highlightedCode.match(stringPattern);
    if (stringMatched) {
      stringMatched.forEach(match => {
        segments.push({
          pattern: match,
          className: 'text-green-600 dark:text-green-400'
        });
      });
    }
    
    // Replace each segment with a placeholder, then restore after highlight
    let result = highlightedCode;
    const placeholders: {[key: string]: string} = {};
    
    segments.forEach((segment, i) => {
      const placeholder = `__PLACEHOLDER_${i}__`;
      placeholders[placeholder] = `<span class="${segment.className}">${segment.pattern}</span>`;
      // Use replace once to avoid replacing generated spans
      result = result.replace(segment.pattern, placeholder);
    });
    
    // Apply regular highlighting
    result = result
      .replace(keywordPattern, (match) => 
        `<span class="text-purple-600 dark:text-purple-400 font-medium">${match}</span>`)
      .replace(numberPattern, (match) => 
        `<span class="text-blue-600 dark:text-blue-400">${match}</span>`)
      .replace(errorNamePattern, (match, name) => 
        `<span class="text-purple-600 dark:text-purple-400 font-medium">error</span> <span class="text-yellow-600 dark:text-yellow-400">${name}</span>`);
    
    // Restore placeholders
    Object.entries(placeholders).forEach(([placeholder, value]) => {
      result = result.replace(placeholder, value);
    });
    
    // Format truncation markers
    result = result.replace(/\/\* \.\.\. \*\//g, 
      '<span class="block py-1 border-t border-b border-gray-300 dark:border-gray-600 my-1 text-center text-gray-500 dark:text-gray-400 text-xs">...</span>');
    
    // Highlight specific error if provided
    if (highlightError) {
      result = highlightErrorDef(result, highlightError);
    }
    
    return result;
  }, [displayCode, highlightError]);

  // Calculate line count for button text
  const lineCountText = useMemo(() => {
    if (lines.length <= maxLines) return '';
    if (lines.length < 100) return `Show All (${lines.length})`;
    if (lines.length < 1000) return `Show All (${lines.length}, large)`;
    return 'Show All (very large file)';
  }, [lines.length, maxLines]);
  
  return (
    <div className="rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Solidity Code</div>
        {lines.length > maxLines && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center"
          >
            {isExpanded ? (
              <>
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {lineCountText}
              </>
            )}
          </button>
        )}
      </div>
      
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
        <code dangerouslySetInnerHTML={{ __html: processedCode }} />
      </pre>
    </div>
  );
} 