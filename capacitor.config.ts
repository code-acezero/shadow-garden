import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'site.shadowgarden.app',
  appName: 'Shadow Garden',
  webDir: 'out',
  backgroundColor: '#020617',
  server: {
    url: 'https://shadow-garden.site',
    cleartext: false,
    // Allow the WebView to handle all navigation internally — prevents
    // Android from intercepting links and opening them in Chrome.
    allowNavigation: [
      'shadow-garden.site',
      '*.shadow-garden.site',
      'supabase.co',
      '*.supabase.co'
    ]
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#020617',
    captureInput: true,
    webContentsDebuggingEnabled: false,
    // Keep the WebView alive in background — prevents frozen blank screen
    // when returning from Chrome or other apps
    loggingBehavior: 'none'
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
