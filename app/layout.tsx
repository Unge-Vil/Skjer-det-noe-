import type { Metadata, Viewport } from "next";
import { cookies, headers } from "next/headers";
import { Schibsted_Grotesk, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";
import { getDictionary, getLocale } from "@/lib/i18n/server";
import { getUser } from "@/lib/auth";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { SiteHeader } from "@/components/SiteHeader";
import { MobileTabBar } from "@/components/MobileTabBar";
import { CookieBanner } from "@/components/CookieBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { LocationProvider } from "@/components/location/LocationProvider";
import { createClient } from "@/lib/supabase/server";
import { LOCATION_COOKIE, parseLocationPreferences } from "@/lib/location";
import type { Municipality } from "@/lib/types";

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
  appleWebApp: {
    capable: true,
    title: "Skjer det noe?",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBF8F2" },
    { media: "(prefers-color-scheme: dark)", color: "#15181B" },
  ],
};

// Set the theme before paint so there's no flash. Defaults to "auto".
const themeInit = `(function(){try{var t=localStorage.getItem("sdn-theme")||"auto";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","auto");}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  // Embeds are framed on third-party sites: no site chrome, no providers, and
  // the theme comes from the embed config (localStorage is partitioned away).
  if (requestHeaders.get("x-sdn-embed") === "1") {
    return (
      <html
        lang="nb"
        data-theme={requestHeaders.get("x-sdn-embed-theme") ?? "auto"}
        suppressHydrationWarning
        className={`${schibsted.variable} ${splineMono.variable} h-full antialiased`}
      >
        <body className="min-h-full" style={{ background: "transparent" }}>
          {children}
        </body>
      </html>
    );
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const user = await getUser();
  const configured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  let municipalities: Municipality[] = [];
  if (configured) {
    const supabase = await createClient();
    const { data } = await supabase.from("municipalities_view").select("*").order("name");
    municipalities = (data as Municipality[]) ?? [];
  }
  const preferences = parseLocationPreferences((await cookies()).get(LOCATION_COOKIE)?.value);

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
          <LocationProvider initialPreferences={preferences} municipalities={municipalities}>
            <a href="#main" className="skip-link">
              {dict.nav.skipToContent}
            </a>
            <div className="flex min-h-screen flex-col" style={{ background: "var(--bg-app)" }}>
              <SiteHeader initialSignedIn={Boolean(user)} />
              {children}
              <MobileTabBar />
            </div>
            <CookieBanner />
            <ServiceWorkerRegister />
          </LocationProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
