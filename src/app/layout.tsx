import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ChatProvider } from "@/contexts/ChatContext";
import { Web3Provider } from "@/contexts/WagmiProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Jacky AI DeFi Copilot",
  description: "Your intelligent guide to decentralized finance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} antialiased`}
      >
        <Web3Provider>
          <ChatProvider>
            {children}
          </ChatProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
