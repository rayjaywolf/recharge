import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recharge.app',
  appName: 'recharge',
  webDir: 'public',
  server: {
    url: 'https://recharge-lilac.vercel.app',
    cleartext: true
  }
};

export default config;
