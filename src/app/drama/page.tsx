import { redirect } from 'next/navigation';

export default function DramaPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Gracefully adapt drama requests to the unified Cinema & Drama hub
  redirect('/cinema?category=drama');
}
