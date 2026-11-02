import { Metadata } from 'next';
import PortalExperimentClient from './PortalExperimentClient';

export const metadata: Metadata = {
  title: 'Portal Experiment Lab | Shadow Garden',
  description: 'Interactive 3D portal and world experiment sandbox',
};

export default function PortalExperimentPage() {
  return <PortalExperimentClient />;
}
