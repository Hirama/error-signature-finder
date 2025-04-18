'use client';

import React, { useState, useEffect } from 'react';

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
  
  // Basic regex patterns for Solidity syntax
  const keywordPattern = /\b(contract|error|function|address|uint256|string|bytes|bool|if|else|for|while|struct|mapping|public|private|external|internal|pure|view|returns|memory|storage|calldata|payable|modifier|import|pragma|solidity|interface)\b/g;
  const commentPattern = /\/\/.*?$|\/\*[\s\S]*?\*\//gm;
  const stringPattern = /"(?:[^"\\]|\\.)*"/g;
  const numberPattern = /\b\d+\b/g;
  const errorNamePattern = /error\s+([A-Za-z0-9_]+)/g;
  
  // Extract all error definitions for smart display
  const findAllErrors = (sourceCode: string) => {
    const errorRegex = /error\s+([A-Za-z0-9_]+)\s*\([^)]*\)/g;
    const matches = [...sourceCode.matchAll(errorRegex)];
    return matches.map(match => ({
      name: match[1],
      fullMatch: match[0],
      index: match.index || 0
    }));
  };
  
  // By default, start not expanded
  useEffect(() => {
    setIsExpanded(false);
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

  // Get all errors from the code
  const allErrors = findAllErrors(code);
  
  // Split the code into lines
  const lines = code.split('\n');
  
  // Determine if the code needs to be truncated
  const shouldTruncate = !isExpanded && lines.length > maxLines;
  
  // Get code to display based on truncation state
  let displayCode = '';
  
  if (shouldTruncate) {
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
        displayCode = [
          ...lines.slice(0, 5), // First 5 lines
          '/* ... */',
          ...lines.slice(startLine, endLine),
          '/* ... */'
        ].join('\n');
      } else {
        // If error not found, show default truncated view
        displayCode = [
          ...lines.slice(0, maxLines),
          '/* ... */'
        ].join('\n');
      }
    } else if (allErrors.length > 0) {
      // Show areas around errors
      const errorSections = [];
      const addedLines = new Set<number>();
      
      // Add first few lines
      for (let i = 0; i < 5 && i < lines.length; i++) {
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
      displayCode = [
        ...Array.from(addedLines).filter(i => i < 5).map(i => lines[i]),
        '/* ... */',
        ...errorSections,
        '/* ... */'
      ].join('\n');
    } else {
      // Default truncation if no errors
      displayCode = [
        ...lines.slice(0, maxLines),
        '/* ... */'
      ].join('\n');
    }
  } else {
    // Show full code
    displayCode = code;
  }

  // First handle line breaks to preserve them in the HTML
  let processedCode = displayCode.replace(/\n/g, '<br />');
  
  // Now process the code with proper escaping
  let highlightedCode = processedCode
    // Escape HTML special characters
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Add back the line breaks we replaced
    .replace(/&lt;br \/&gt;/g, '<br />');
  
  // Apply syntax highlighting in the correct order
  const applyHighlighting = (input: string) => {
    // Store segments to preserve their order (comments, strings, etc.)
    const segments: {pattern: string, className: string}[] = [];
    
    // Process comments first (they might contain keywords)
    let commentMatched = input.match(commentPattern);
    if (commentMatched) {
      commentMatched.forEach(match => {
        segments.push({
          pattern: match,
          className: 'text-gray-500 dark:text-gray-400'
        });
      });
    }
    
    // Process strings (they might contain keywords too)
    let stringMatched = input.match(stringPattern);
    if (stringMatched) {
      stringMatched.forEach(match => {
        segments.push({
          pattern: match,
          className: 'text-green-600 dark:text-green-400'
        });
      });
    }
    
    // Replace each segment with a placeholder, then restore after highlight
    let result = input;
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
      '<span class="block py-1 border-t border-b border-gray-300 dark:border-gray-600 my-1 text-center text-gray-500 dark:text-gray-400">...</span>');
    
    return result;
  };
  
  highlightedCode = applyHighlighting(highlightedCode);
  
  // Highlight specific error if provided
  if (highlightError) {
    highlightedCode = highlightErrorDef(highlightedCode, highlightError);
  }
  
  return (
    <div className="rounded-md overflow-hidden">
      <pre className="bg-gray-100 dark:bg-gray-800 p-4 overflow-x-auto text-sm font-mono text-gray-800 dark:text-gray-200">
        <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
      </pre>
      
      {lines.length > maxLines && (
        <div className="flex justify-end mt-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium"
          >
            {isExpanded ? "Show Less" : `Show All (${lines.length} lines)`}
          </button>
        </div>
      )}
    </div>
  );
} 