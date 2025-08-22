import type { Metadata, Viewport } from "next";
import { ChatProvider } from "@/contexts/ChatContext";
import { Web3Provider } from "@/contexts/WagmiProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jacky AI - Your DeFi Copilot",
  description: "Advanced AI-powered guide for decentralized finance with real-time portfolio analysis and smart contract interactions",
  keywords: [
    "DeFi", "AI", "Crypto", "Blockchain", "Portfolio Analysis", 
    "Yield Farming", "Liquidity Mining", "Smart Contracts", "Web3"
  ],
  authors: [{ name: "Jacky AI Team" }],
  openGraph: {
    title: "Jacky AI - Your DeFi Copilot",
    description: "Advanced AI-powered guide for decentralized finance",
    type: "website",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Jacky AI DeFi Copilot"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Jacky AI - Your DeFi Copilot",
    description: "Advanced AI-powered guide for decentralized finance"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#6366f1"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const savedTheme = localStorage.getItem('theme') || 'system';
                  let actualTheme;
                  
                  if (savedTheme === 'system') {
                    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  } else {
                    actualTheme = savedTheme;
                  }
                  
                  document.documentElement.setAttribute('data-theme', actualTheme);
                  document.documentElement.classList.add(actualTheme);
                } catch (e) {
                  // Fallback to light theme
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        className="antialiased bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen font-inter transition-colors duration-300" 
        suppressHydrationWarning={true}
      >
        {/* Background Pattern */}
        <div className="fixed inset-0 pointer-events-none opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-400/20 via-transparent to-cyan-400/20" />
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-tertiary) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>
        
        <ThemeProvider>
          <Web3Provider>
            <ChatProvider>
              {children}
            </ChatProvider>
          </Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}