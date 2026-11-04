import { Metadata } from 'next';
import PortalExperimentClient from './PortalExperimentClient';

export const metadata: Metadata = {
  title: 'Floating Island – Shrine Gate to Mana Portal | Shadow Garden',
  description: 'Interactive 3D celestial floating island and mana portal realm experiment',
};

export default function PortalExperimentPage() {
  return <PortalExperimentClient />;
}
