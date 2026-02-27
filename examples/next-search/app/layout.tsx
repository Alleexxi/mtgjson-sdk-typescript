import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "MTGJSON Card Search",
  description: "Search Magic: The Gathering cards powered by mtgjson-sdk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
        <header className="border-b border-gray-800 px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight hover:text-gray-300">
            MTGJSON Card Search
          </Link>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">{children}</main>
        <Suspense>
          <Footer />
        </Suspense>
      </body>
    </html>
  );
}
