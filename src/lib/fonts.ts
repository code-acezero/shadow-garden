import localFont from 'next/font/local';
import { Poppins } from 'next/font/google';

// ==========================================
// THE FONT ARMORY
// Optimization: preload: false ensures lazy loading for local fonts
// ==========================================

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

export const lemonMilk = localFont({
  src: [
    {
      path: '../assets/fonts/LemonMilkRegular-X3XE2.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/LemonMilkBold-gx2B3.otf',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-lemon-milk',
  display: 'swap',
  preload: false, 
});

export const gradvis = localFont({
  src: '../assets/fonts/GradvisRegular-lxoyd.ttf',
  variable: '--font-gradvis',
  display: 'swap',
  preload: false,
});

export const above = localFont({
  src: '../assets/fonts/AboveDemoRegular-lJMd.ttf',
  variable: '--font-above',
  display: 'swap',
  preload: false,
});

export const minomu = localFont({
  src: [
    {
      path: '../assets/fonts/MinomuRegular-4BV0B.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/MinomuBold-rgXoO.otf',
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-minomu',
  display: 'swap',
  preload: false,
});