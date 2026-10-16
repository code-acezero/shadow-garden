import { Agent } from 'undici';
import dns from 'node:dns';

// Fallback to high-reliability public resolvers (Google / Cloudflare) if local router DNS fails or times out
const resolver = new dns.promises.Resolver();
try {
  resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4', '1.0.0.1']);
} catch {}

const dnsCache = new Map<string, { address: string; family: number; expires: number }>();

function resilientLookup(hostname: string, options: any, callback: any) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  const isAll = !!(options && options.all);

  const cached = dnsCache.get(hostname);
  if (cached && Date.now() < cached.expires) {
    if (isAll) {
      return callback(null, [{ address: cached.address, family: cached.family }]);
    }
    return callback(null, cached.address, cached.family);
  }

  resolver.resolve4(hostname)
    .then(ips => {
      if (ips && ips.length > 0) {
        const ip = ips[0];
        dnsCache.set(hostname, { address: ip, family: 4, expires: Date.now() + 5 * 60 * 1000 });
        if (isAll) {
          return callback(null, [{ address: ip, family: 4 }]);
        }
        return callback(null, ip, 4);
      }
      dns.lookup(hostname, options, callback);
    })
    .catch(() => {
      dns.lookup(hostname, options, callback);
    });
}

// Bypass SSL certificate issues and DNS resolution failures for upstream scrapers and CDNs
const dispatcher = new Agent({
  connect: {
    rejectUnauthorized: false,
    lookup: resilientLookup
  }
});

export async function fetchWithCustomReferer(url: string, refererUrl: string, range?: string | null) {
  if (!url) throw new Error("URL is required");
  
  try {
    const urlObj = new URL(refererUrl);
    
    const headers: Record<string, string> = {
      "Referer": refererUrl,
      "Origin": urlObj.origin,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept": "*/*",
      "Accept-Language": "en-US,en;q=0.9",
      "Connection": "keep-alive",
    };
    if (range) headers["Range"] = range;

    const response = await (fetch as any)(url, {
      headers,
      redirect: 'follow',
      dispatcher,
    });

    return response;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
}