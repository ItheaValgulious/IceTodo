import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fireinice.icetodo',
  appName: 'ice-todo',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    allowNavigation: ['http://124.222.61.175:12049/*'], // 替换为你的服务地址
  }
};

export default config;
