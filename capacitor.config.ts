import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.recharge.app',
  appName: 'recharge',
  webDir: 'public',
  server: {
    url: 'http://192.168.29.29:3000',
    cleartext: true
  }
};

export default config;
