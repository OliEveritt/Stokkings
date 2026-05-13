import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FirebaseAuthProvider } from "@/context/FirebaseAuthContext";
import { GroupProvider } from "@/context/GroupContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stokkings — Stokvel Management",
  description: "Digital stokvel management platform for South African savings groups",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseAuthProvider>
          <GroupProvider>    
          {children}
          </GroupProvider>
        </FirebaseAuthProvider>
            
      </body>
    </html>
  );
}
