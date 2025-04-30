import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { PromptProvider } from '@/components/PromptContext';
import Sidebar from '@/components/Sidebar';

// Load Inter font from Google Fonts
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'AI Dashboard',
  description: 'A dashboard for generating and pinning charts using AI.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans flex min-h-screen`}>
        <PromptProvider>
          {/* First Part: Narrower Grey Sidebar */}
          <div className="w-1/6 bg-gray-200 p-6">
            <Sidebar />
          </div>

          {/* Second Part: Wider White Main Content */}
          <div className="w-5/6 bg-white p-0">
            {children}
          </div>
        </PromptProvider>
      </body>
    </html>
  );
}