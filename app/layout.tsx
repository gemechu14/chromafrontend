import type { Metadata } from "next";
import "./globals.css";
import { AuthProviderWrapper } from "@/components/providers/auth-provider-wrapper";

export const metadata: Metadata = {
  title: "Chroma Inventory Pro",
  description: "Professional hair salon color mixing and inventory management platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}



