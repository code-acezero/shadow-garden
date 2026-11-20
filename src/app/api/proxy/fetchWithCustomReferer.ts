import { Agent } from 'undici';
import dns from 'node:dns';

const dnsCache = new Map<string, { address: string; family: number; expires: number }>();

async function dohResolve(hostname: string): Promise<string | null> {
  // Query Cloudflare DoH directly via IP 1.1.1.1 to avoid needing DNS to resolve the DNS server itself
  try {
    const res = await fetch(`https://1.1.1.1/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(2500)
    });
    const json: any = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const aRecord = json.Answer.find((a: any) => a.type === 1);
      return aRecord ? aRecord.data : json.Answer[0].data;
    }
  } catch {}

  try {
    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(hostname)}&type=A`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(2500)
    });
    const json: any = await res.json();
    if (json.Answer && json.Answer.length > 0) {
      const aRecord = json.Answer.find((a: any) => a.type === 1);
      return aRecord ? aRecord.data : json.Answer[0].data;
    }
  } catch {}

  return null;
}

export function resilientLookup(hostname: string, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const isAll = !!(options && options.all);

  // Fast path for loopback / local addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1' || hostname === '0.0.0.0') {
    return dns.lookup(hostname, options, callback);
  }

  // Check in-memory cache
  const cached = dnsCache.get(hostname);
  if (cached && Date.now() < cached.expires) {
    if (isAll) {
      return callback(null, [{ address: cached.address, family: cached.family }]);
    }
    return callback(null, cached.address, cached.family);
  }

  // DoH resolution first (guaranteed immune to ISP UDP 53 blocking)
  dohResolve(hostname)
    .then(dohIp => {
      if (dohIp) {
        dnsCache.set(hostname, { address: dohIp, family: 4, expires: Date.now() + 15 * 60 * 1000 });
        if (isAll) {
          return callback(null, [{ address: dohIp, family: 4 }]);
        }
        return callback(null, dohIp, 4);
      }
      dns.lookup(hostname, options, callback);
    })
    .catch(() => {
      dns.lookup(hostname, options, callback);
    });
}

// Bypass SSL certificate issues and DNS resolution failures for upstream scrapers and CDNs
export const resilientDispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
    lookup: resilientLookup
  }
});

export async function fetchWithCustomReferer(url: string, refererUrl?: string, range?: string | null) {
  if (!url) throw new Error("URL is required");

  try {
    const isMangaDex = url.includes('mangadex.org') || (refererUrl && refererUrl.includes('mangadex.org'));
    const headers: Record<string, string> = {
      "User-Agent": isMangaDex
        ? "Kagemi/4.0"
        : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Connection": "keep-alive",
    };
    if (refererUrl) {
      try {
        const urlObj = new URL(refererUrl);
        headers["Referer"] = refererUrl;
        if (!isMangaDex) {
          headers["Origin"] = urlObj.origin;
        }
      } catch {}
    }
    if (range) headers["Range"] = range;

    const response = await (fetch as any)(url, {
      headers,
      redirect: 'follow',
      dispatcher: resilientDispatcher,
    });

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}
