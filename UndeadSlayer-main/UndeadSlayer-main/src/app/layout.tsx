import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Undead Slayer: Chronicles | 2D Action RPG",
  description:
    "Fast-paced 2D action RPG featuring 10 unique heroes, 5 chapters, 25 levels, ferocious boss battles, and character progression.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-950 text-neutral-100 antialiased min-h-screen selection:bg-amber-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
