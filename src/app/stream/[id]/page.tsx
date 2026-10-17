import WatchClient from './WatchClient';

export default async function StreamWatchPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WatchClient key={id} />;
}
