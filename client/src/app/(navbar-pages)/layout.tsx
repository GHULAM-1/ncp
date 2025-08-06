import type { Metadata } from "next";
import "../globals.css";
import Header from "@/components/header";
import { AuthProvider } from "@/components/context/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import CookieBanner from "@/components/cookie-banner";
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})
export const metadata: Metadata = {
  title: "NCP News & Forum",
  description:
    "Stay on top of the latest headlines, comment on your favorite stories, and join community discussions in our forum—powered by NCP.",
  icons: {
    icon: "Icons/logo.jpeg",
  },
  twitter: {
    card: "summary_large_image",
    title: "NCP News & Forum",
    description:
      "Read, comment, and discuss the latest news—plus join our vibrant community forum.",
    images: ["https://ncp-client.vercel.app/twitter-image.png"],
  },
  openGraph: {
    title: "NCP News & Forum",
    description:
      "Read, comment, and discuss the latest news—plus join our vibrant community forum.",
    url: "https://ncp-client.vercel.app/",
    siteName: "NCP News & Forum",
    images: [
      {
        url: "https://ncp-client.vercel.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "NCP News & Forum",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  keywords: ["news", "forum", "comments", "community", "NCP", "live updates"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          property="twitter:image"
          content="https://ncp-client.vercel.app/twitter-image.png"
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${inter.variable} antialiased bg-white dark:bg-[#292a2d]`}
      >
        <AuthProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <Header />
            {children}
            <CookieBanner />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
