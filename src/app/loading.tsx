import { BreathingLoader } from '@/components/ui/BreathingLoader';

export default function Loading() {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-transparent pointer-events-none z-[9999]">
        <BreathingLoader />
    </div>
  );
}