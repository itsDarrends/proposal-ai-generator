import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const sans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Proposal Generator",
  description: "Create and send professional proposals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${sans.variable}`}>
      <body className="font-sans antialiased bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
