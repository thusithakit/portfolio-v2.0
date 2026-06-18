import type { Metadata } from "next";
import { Outfit, Inter, Newsreader } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Thusitha Kithuldora | Frontend Focused Full-Stack Software Engineer",
  description: "Explore the portfolio of Thusitha Kithuldora, a frontend focused full-stack software engineer specializing in React, Next.js, and responsive web applications with over 70+ successful projects.",
  keywords: ["Frontend Developer", "Full-Stack Engineer", "React Developer", "Next.js Portfolio", "Thusitha Kithuldora", "JavaScript Developer"],
  authors: [{ name: "Thusitha Kithuldora", url: "https://thusithakit.com/" }],
  openGraph: {
    title: "Thusitha Kithuldora | Frontend Developer",
    description: "Explore the portfolio of Thusitha Kithuldora, a frontend focused full-stack software engineer specializing in React, Next.js, and responsive web applications.",
    url: "https://thusithakit.com/",
    siteName: "Thusitha Kithuldora Portfolio",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Thusitha Kithuldora | Frontend Developer",
    description: "Explore the portfolio of Thusitha Kithuldora, a frontend focused full-stack software engineer specializing in React, Next.js, and responsive web applications.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${inter.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var saved = localStorage.getItem("site-theme");
                  if (saved === "dark" || saved === "light") {
                    document.documentElement.setAttribute("data-theme", saved);
                  } else {
                    var hour = new Date().getHours();
                    var theme = (hour >= 18 || hour < 6) ? "dark" : "light";
                    document.documentElement.setAttribute("data-theme", theme);
                  }
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "light");
                }
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col relative bg-ink-900 text-ink-100">
        <div className="warm-wash" aria-hidden="true" />
        <div className="warm-wash-glow" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
