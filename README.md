# Solidity Error Signature Finder

A web application that allows you to find which Solidity custom error corresponds to a given 4-byte selector.

## Features

- Upload a Solidity file or paste Solidity code
- Parse the file and extract all custom error definitions
- Input a 4-byte hex selector and find the matching error
- View all extracted errors with their signatures and selectors
- Client-side only - no backend required

## How It Works

1. The app extracts all custom error definitions from Solidity code
2. It calculates the 4-byte selector for each error (using `keccak256` hash)
3. It compares the user-provided selector with the calculated ones
4. If a match is found, it displays the corresponding error name and signature

## Usage

Visit the live application: [https://yourusername.github.io/error-signature-finder](https://yourusername.github.io/error-signature-finder)

### Find an Error by Selector

1. Upload a .sol file or paste Solidity code in the text area
2. Enter the 4-byte selector (e.g., `0x13eed71e`)
3. Click the "Check" button
4. View the matching error information

## Local Development

```bash
# Clone the repository
git clone https://github.com/yourusername/error-signature-finder.git
cd error-signature-finder

# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

## Technologies Used

- Next.js
- React
- TypeScript
- Tailwind CSS
- ethers.js (for calculating hashes)
- @solidity-parser/parser (for parsing Solidity code)

## License

MIT
