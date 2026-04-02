import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { ChunkErrorBoundary } from "@/components/chunk-error-boundary";
import { ChunkErrorHandler } from "@/components/chunk-error-handler";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "rivvl - Intelligent Comparison Reports",
  description:
    "Intelligent comparison reports for the biggest purchases of your life. Compare vehicles and real estate with detailed analysis, data enrichment, and clear recommendations.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  openGraph: {
    images: [{ url: "/images/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased"
      >
        <ChunkErrorHandler />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <ChunkErrorBoundary>
            <Navbar />
            <main>{children}</main>
          </ChunkErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
