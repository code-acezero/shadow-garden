export const processImage = (file: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 1. Force 500x500 dimensions
        const MAX_WIDTH = 500;
        const MAX_HEIGHT = 500;
        canvas.width = MAX_WIDTH;
        canvas.height = MAX_HEIGHT;

        // 2. Calculate "Cover" fit (Center Crop)
        const ratio = Math.max(MAX_WIDTH / img.width, MAX_HEIGHT / img.height);
        const centerShift_x = (MAX_WIDTH - img.width * ratio) / 2;
        const centerShift_y = (MAX_HEIGHT - img.height * ratio) / 2;

        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
                img, 
                0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
            );
        }

        // 3. Export as compressed JPEG/PNG
        canvas.toBlob((blob) => {
            if (blob) {
                const newFile = new File([blob], file.name, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });
                resolve(newFile);
            } else {
                reject(new Error('Canvas is empty'));
            }
        }, 'image/jpeg', 0.85); // 85% Quality
      };
    };
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Safely resolves post image URLs.
 * Free image hosts like ImgBB (i.ibb.co) regularly block direct hotlinking from browsers,
 * returning 503 or CORS errors. Routing them through wsrv.nl (Cloudflare-backed image proxy)
 * guarantees fast, reliable global caching, CORS bypass, and 100% uptime.
 */
export function getOptimizedImageUrl(rawUrl: string | undefined | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  
  // If already proxied, return as-is
  if (trimmed.startsWith('https://wsrv.nl/') || trimmed.startsWith('https://images.weserv.nl/')) {
    return trimmed;
  }
  
  // Known hosts with aggressive hotlink restrictions or 503 errors
  if (trimmed.includes('i.ibb.co') || trimmed.includes('ibb.co')) {
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}`;
  }
  
  return trimmed;
}
