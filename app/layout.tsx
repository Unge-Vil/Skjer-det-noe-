import type { Metadata } from "next";
import { Schibsted_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <html
      lang={locale}
      data-theme="auto"
      suppressHydrationWarning
      className={`${schibsted.variable} ${splineMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full">
        <LocaleProvider locale={locale} dict={dict}>
          <a href="#main" className="skip-link">
            {dict.nav.skipToContent}
          </a>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
