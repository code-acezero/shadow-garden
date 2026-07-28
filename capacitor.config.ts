import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.shadowgarden.app',
  appName: 'Shadow Garden',
  webDir: 'out',
  backgroundColor: '#020617',
  server: {
    url: 'https://shadow-garden.site',
    cleartext: true
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#020617',
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#020617',
      overlaysWebView: true
    },
    Keyboard: {
      resize: 'body',
      style: 'DARK'
    }
  }
};

export default config;
