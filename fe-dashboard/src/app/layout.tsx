import { PromptProvider } from '@/components/PromptContext';
import { Inter } from 'next/font/google';
import '../styles/globals.css';
import Navbar from '@/components/Navbar';
import { TabProvider } from '@/components/TabContext';

// Load Inter font from Google Fonts
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'AI Chart Dashboard',
  description: 'A professional dashboard for generating and managing AI-powered charts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-background text-foreground flex flex-col min-h-screen font-sans`}>
        <PromptProvider>
          <TabProvider>
            <Navbar />
            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
              {children}
            </main>
          </TabProvider>
        </PromptProvider>
      </body>
    </html>
  );
}