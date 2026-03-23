import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.companycommander.ultra",
  appName: "Fireteam Leader",
  webDir: "dist",
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      showSpinner: false,
      backgroundColor: "#000000",
      launchFadeOutDuration: 220,
    },
  },
};

export default config;
