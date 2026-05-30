import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic LaTeX Diagram Editor",
  description: "A focused LaTeX editor for AI-assisted TikZ diagram generation."
};

const RootLayout = ({ children }: Readonly<{ children: React.ReactNode }>) => {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
};

export default RootLayout;
