import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wrapper for the native iOS/Android app.
 *
 * The app is server-rendered (Next on Cloudflare), so the native shell loads the
 * hosted deployment rather than a static export. Set `server.url` to the
 * deployed URL (or a LAN dev URL for live reload), then run:
 *   pnpm cap:sync && npx cap add ios   (needs Xcode)
 *   pnpm cap:sync && npx cap add android (needs Android Studio)
 */
const config: CapacitorConfig = {
  appId: "no.ungevil.skjerdetnoe",
  appName: "Skjer det noe?",
  // Placeholder dir (Capacitor requires one); real content comes from server.url.
  webDir: "public",
  server: {
    androidScheme: "https",
    // url: "https://skjerdetnoe.no",
  },
  backgroundColor: "#FBF8F2",
};

export default config;
