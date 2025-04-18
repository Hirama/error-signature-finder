import { ethers } from 'ethers';

interface ErrorDef {
  name: string;
  signature: string;
  selector: string;
  params?: any[];
}

export function calculateSelector(signature: string): string {
  try {
    // Calculate the keccak256 hash of the signature
    const hash = ethers.keccak256(ethers.toUtf8Bytes(signature));
    
    // Take the first 4 bytes (8 hex characters + '0x' prefix)
    return hash.substring(0, 10);
  } catch (error) {
    console.error('Error calculating selector:', error);
    throw new Error(`Failed to calculate selector: ${(error as Error).message}`);
  }
}

export function checkSelectorMatch(errors: ErrorDef[] | any, selector: string): ErrorDef | null {
  // Ensure errors is an array
  if (!Array.isArray(errors)) {
    console.error('Expected errors to be an array, but got:', typeof errors);
    return null;
  }
  
  // Calculate selectors for all errors if not already calculated
  const errorsWithSelectors = errors.map(error => {
    if (!error.selector) {
      error.selector = calculateSelector(error.signature);
    }
    return error;
  });

  // Find the error with a matching selector
  return errorsWithSelectors.find(error => error.selector.toLowerCase() === selector.toLowerCase()) || null;
} 