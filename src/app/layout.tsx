import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TimeLaps — AI Architectural Timelapse Generator',
  description:
    'Generate stunning architectural timelapse videos using AI-powered video generation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen animated-gradient-bg text-gray-100 antialiased">
        {/* Header */}
        <header className="border-b border-white/[0.06] bg-gray-950/80 backdrop-blur-md sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <a href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow-indigo">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M15 10l4.553-2.069A1 1 0 0121 8.876V15a1 1 0 01-1.553.832L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight gradient-text">TimeLaps</span>
            </a>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm hidden sm:block font-medium">
                AI Architectural Timelapse
              </span>
              <a
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
              >
                Dashboard
              </a>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">{children}</main>

        {/* Footer */}
        <footer className="border-t border-white/[0.04] mt-16 py-6">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <p className="text-center text-gray-600 text-sm">
              Powered by <span className="text-gray-500">Kling AI</span> · Built with Next.js
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
