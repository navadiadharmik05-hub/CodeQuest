import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.codequest.app",
  appName: "CodeQuest",
  webDir: "out",                  // next export output
  bundledWebRuntime: false,
  server: {
    // During development, point to local Next.js server for live reload
    // Comment out for production builds
    // url: "http://192.168.x.x:3000",
    // cleartext: true,
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0f0d23",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      iosSpinnerStyle: "small",
      spinnerColor: "#7b6ff7",
      splashFullScreen: true,
      splashImmersive: true,
      layoutName: "launch_screen",
      useDialog: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0f0d23",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Release signing — configure via capacitor.build.gradle
  },
  ios: {
    contentInset: "automatic",
    limitsNavigationsToAppBoundDomains: true,
    scrollEnabled: false,
  },
};

export default config;
