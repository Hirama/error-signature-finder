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
        <meta name="theme-color" content="#4f46e5" />
        <link rel="icon" href="/favicon.ico" />
        {/* Script to handle dark mode preference */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // On page load or when changing themes, check user preference
                const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (isDarkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
