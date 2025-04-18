import { SolidityErrorFinder } from '../components/SolidityErrorFinder';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Solidity Error Signature Finder
          </h1>
          <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
            Upload a Solidity file and find the error that matches a 4-byte selector
          </p>
        </div>
        
        <SolidityErrorFinder />
        
        <footer className="mt-16 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Built with Next.js, Tailwind CSS, and ethers.js</p>
        </footer>
      </div>
    </div>
  );
}
