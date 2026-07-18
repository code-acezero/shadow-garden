import { Metadata } from 'next';
import DonghuaHomeClient from '@/components/Donghua/DonghuaHomeClient';

export const metadata: Metadata = {
  title: 'Donghua | Shadow Garden',
  description: 'Access the forbidden library of Chinese Animation.',
};

export default function DonghuaPage() {
  return <DonghuaHomeClient />;
}
