import { redirect } from 'next/navigation';

export default async function DramaWatchRedirect({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams();
  if (sp) {
    Object.entries(sp).forEach(([key, val]) => {
      if (typeof val === 'string') qs.set(key, val);
      else if (Array.isArray(val)) val.forEach(v => qs.append(key, v));
    });
  }
  const query = qs.toString();
  redirect(`/stream/${id}${query ? `?${query}` : ''}`);
}
