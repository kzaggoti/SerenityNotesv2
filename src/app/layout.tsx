import "./globals.css";
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { Cormorant_Garamond } from 'next/font/google';

const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic']
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#CCDAD1]">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
