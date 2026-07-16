import type { Metadata } from "next";
import localFont from "next/font/local";
import { Theme } from "@whop/react/components";
import { WhopThemeScript } from "@whop/react/theme";
import "@whop/react/styles.css";
import "./globals.css";

const acidGrotesk = localFont({
  src: "../public/brand/fonts/acid-grotesk-variable.ttf",
  variable: "--font-acid-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Whop Tasks",
    template: "%s | Whop Tasks",
  },
  description: "Earn money completing funded tasks on Whop.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${acidGrotesk.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <WhopThemeScript />
      </head>
      <body className="flex min-h-full flex-col">
        <Theme appearance="inherit">{children}</Theme>
      </body>
    </html>
  );
}
