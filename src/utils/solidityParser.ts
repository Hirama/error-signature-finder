// Import types only for TypeScript
type SolidityParser = {
  parse: (code: string, options?: { tolerant?: boolean }) => any;
  visit: (ast: any, visitor: any) => void;
};

interface ErrorDef {
  name: string;
  params: { type: string; name: string }[];
  signature: string;
  selector: string;
}

// Simple error extractor that doesn't use the parser
function simpleErrorExtractor(code: string): ErrorDef[] {
  const errors: ErrorDef[] = [];
  // Match error declarations with a regex - simple but effective for most cases
  const errorRegex = /error\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)/g;
  let match;
  
  while ((match = errorRegex.exec(code)) !== null) {
    const errorName = match[1];
    const paramsText = match[2].trim();
    
    const params = paramsText ? paramsText.split(',').map(param => {
      const parts = param.trim().split(/\s+/);
      return {
        type: parts[0] || '',
        name: parts[1] || ''
      };
    }) : [];
    
    const signature = `${errorName}(${params.map(p => p.type).join(',')})`;
    
    errors.push({
      name: errorName,
      params,
      signature,
      selector: ''
    });
  }
  
  return errors;
}

export async function extractErrors(solidityCode: string): Promise<ErrorDef[]> {
  try {
    // First try with the regex-based extractor for simple cases
    if (!solidityCode || typeof solidityCode !== 'string') {
      throw new Error('Invalid Solidity code provided');
    }
    
    try {
      // Try the simple extractor first
      return simpleErrorExtractor(solidityCode);
    } catch (simpleError) {
      console.warn('Simple extractor failed, falling back to parser:', simpleError);
      
      // Dynamic import of the parser - only runs on client
      const solidity = await import('@solidity-parser/parser') as SolidityParser;
      const ast = solidity.parse(solidityCode, { tolerant: true });
      const errors: ErrorDef[] = [];

      // Use a custom visitor function to extract error definitions
      solidity.visit(ast, {
        ErrorDefinition: (node: any) => {
          try {
            // Extra safety: ensure node.parameters is an array
            if (!Array.isArray(node.parameters)) {
              console.warn('node.parameters is not an array:', node.parameters);
              return;
            }
            
            const params = node.parameters.map((param: any) => {
              // Extra null check
              if (!param || !param.typeName) {
                return { type: '', name: param?.name || '' };
              }
              return {
                type: extractTypeName(param.typeName),
                name: param.name || ''
              };
            });

            const signature = buildErrorSignature(node.name, params);
            
            errors.push({
              name: node.name,
              params,
              signature,
              selector: '' // Will be filled by the caller using the errorSelector utility
            });
          } catch (nodeError) {
            console.error('Error processing node:', nodeError);
          }
        }
      });

      return errors;
    }
  } catch (error) {
    console.error('Error parsing Solidity code:', error);
    // Return empty array instead of throwing error
    return [];
  }
}

// Function to recursively extract type names
function extractTypeName(typeNode: any): string {
  if (!typeNode) return '';
  
  // Direct string type name
  if (typeof typeNode.name === 'string') {
    return typeNode.name;
  }
  
  // Array type
  if (typeNode.type === 'ArrayTypeName') {
    const baseType = extractTypeName(typeNode.baseTypeName);
    return `${baseType}[]`;
  }
  
  // User defined type
  if (typeNode.type === 'UserDefinedTypeName') {
    return typeNode.namePath || '';
  }
  
  // Elementary type
  if (typeNode.type === 'ElementaryTypeName') {
    return typeNode.name || '';
  }
  
  // Mapping type
  if (typeNode.type === 'Mapping') {
    const keyType = extractTypeName(typeNode.keyType);
    const valueType = extractTypeName(typeNode.valueType);
    return `mapping(${keyType} => ${valueType})`;
  }
  
  // Function type
  if (typeNode.type === 'FunctionTypeName') {
    return 'function';
  }
  
  // Tuple type
  if (typeNode.type === 'TupleTypeName') {
    const components = Array.isArray(typeNode.components) 
      ? typeNode.components.map((comp: any) => extractTypeName(comp)).join(',')
      : '';
    return `tuple(${components})`;
  }
  
  // Fallback: return the type property itself or empty string
  return typeNode.type || '';
}

function buildErrorSignature(name: string, params: { type: string; name: string }[]): string {
  // Make sure params is an array before using join
  const paramTypes = Array.isArray(params) 
    ? params.map(param => param.type).filter(Boolean).join(',') 
    : '';
  return `${name}(${paramTypes})`;
} 