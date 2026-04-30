import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.prayerforge.app',
  appName: 'My Prayer Book',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    // SplashScreen and other plugins can be configured here
  },
};

export default config;
