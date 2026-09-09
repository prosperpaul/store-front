import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site";

// Headings with some hand in them -- Bricolage has real character at heavy
// weights, which is what keeps this from reading like another admin panel.
const display = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

// Body face chosen for legibility on cheap Android screens: open counters,
// tall x-height, holds up at small sizes over a slow connection.
const body = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  // Lets link previews resolve relative image paths to absolute URLs.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "social storefront",
    template: "%s · social storefront",
  },
  description:
    "A storefront and repeat-customer tool for Instagram and WhatsApp sellers.",
};

export const viewport: Viewport = {
  // Sellers are on phones; keep the layout snug to the device width.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
