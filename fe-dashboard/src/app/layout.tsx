import { PromptProvider } from '@/components/PromptContext';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '@/components/Navbar';
import { TabProvider } from '@/components/TabContext';

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
      <body className={`${inter.variable} font-sans flex flex-col min-h-screen bg-gray-50`}>
        <PromptProvider>
          <TabProvider>
            {/* Top Navbar */}
            <Navbar />
            {/* Main Content */}
            <main className="flex-1 p-6">{children}</main>
          </TabProvider>
        </PromptProvider>
      </body>
    </html>
  );
}