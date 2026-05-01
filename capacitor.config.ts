import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.lovable.d837bd22b5d7491295127dd5a4e6fc83",
  appName: "needforscore",
  webDir: "dist",
  server: {
    url: "https://d837bd22-b5d7-4912-9512-7dd5a4e6fc83.lovableproject.com?forceHideBadge=true",
    cleartext: true,
  },
  ios: {
    contentInset: "always",
  },
  android: {
    backgroundColor: "#0F172A",
  },
};

export default config;
