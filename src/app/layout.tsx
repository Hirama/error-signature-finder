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
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>{children}</body>
    </html>
  );
}
