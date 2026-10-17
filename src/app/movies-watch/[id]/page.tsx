import { redirect } from 'next/navigation';

export default async function MovieWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/stream/${id}?type=movie`);
}
