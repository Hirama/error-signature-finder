import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solidity Error Signature Finder",
  description: "Find which Solidity error corresponds to a given 4-byte selector",
  keywords: "solidity, ethereum, error, selector, 4-byte, web3, blockchain, smart contract",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
        <script dangerouslySetInnerHTML={{
          __html: `
            // Check for dark mode preference
            if (localStorage.theme === 'dark' || 
                (!('theme' in localStorage) && 
                window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark');
              document.documentElement.classList.remove('light');
            } else {
              document.documentElement.classList.remove('dark');
              document.documentElement.classList.add('light');
            }
          `
        }} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">{children}</body>
    </html>
  );
}
