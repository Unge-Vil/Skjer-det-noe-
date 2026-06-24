import type { Metadata } from "next";
import { Schibsted_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const schibsted = Schibsted_Grotesk({
  variable: "--font-schibsted",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const splineMono = Spline_Sans_Mono({
  variable: "--font-spline",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Skjer det noe?",
  description:
    "Finn faste aktiviteter, arrangementer og organisasjoner i nærheten av deg.",
};

// Set the theme before paint so there's no flash. Defaults to "auto".
const themeInit = `(function(){try{var t=localStorage.getItem("sdn-theme")||"auto";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","auto");}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nb"
      data-theme="auto"
      className={`${schibsted.variable} ${splineMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="skip-link">
          Hopp til innhold
        </a>
        {children}
      </body>
    </html>
  );
}
