// src/lib/moeApi.ts

export interface MoeAnilistInfo {
  id: number;
  idMal: number | null;
  title: {
    native: string | null;
    romaji: string | null;
    english: string | null;
  };
  synonyms: string[];
  isAdult: boolean;
}

export interface MoeResultItem {
  anilist: number | MoeAnilistInfo; // Returns number by default, object if anilistInfo is requested
  filename: string;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
}

export interface MoeSearchResponse {
  frameCount: number;
  error: string;
  result: MoeResultItem[];
}

export interface MoeQuotaResponse {
  id: string;
  priority: number;
  concurrency: number;
  quota: number;
  quotaUsed: number;
}

export interface MoeSearchOptions {
  cutBorders?: boolean;
  anilistID?: number;
  anilistInfo?: boolean;
}

export class MoeAPI {
  private static BASE_URL = "/api/ai/imagesearch";

  /**
   * Client-side image optimizer for fast uploading and zero memory lag
   */
  private static async optimizeImage(fileOrBlob: Blob | File): Promise<Blob> {
    if (typeof window === 'undefined') return fileOrBlob;
    // If under 800KB, send directly
    if (fileOrBlob.size < 800 * 1024) return fileOrBlob;

    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(fileOrBlob);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1280;
        let { width, height } = img;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(fileOrBlob);
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          resolve(blob || fileOrBlob);
        }, 'image/jpeg', 0.88);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(fileOrBlob);
      };
      img.src = url;
    });
  }

  /**
   * Search for anime scenes by Image URL
   */
  static async searchByUrl(imageUrl: string, options: MoeSearchOptions = {}): Promise<MoeSearchResponse> {
    const params = new URLSearchParams();
    params.append("url", imageUrl);
    
    if (options.cutBorders) params.append("cutBorders", "");
    if (options.anilistID) params.append("anilistID", options.anilistID.toString());
    if (options.anilistInfo !== false) params.append("anilistInfo", "");

    try {
      const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || `Image search error: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("MoeAPI Search By URL Error:", error);
      throw error;
    }
  }

  /**
   * Search for anime scenes by uploading an image file (Blob/File)
   */
  static async searchByImage(imageFile: Blob | File, options: MoeSearchOptions = {}): Promise<MoeSearchResponse> {
    const optimizedBlob = await this.optimizeImage(imageFile);
    const formData = new FormData();
    formData.append("image", optimizedBlob);

    const params = new URLSearchParams();
    if (options.cutBorders) params.append("cutBorders", "");
    if (options.anilistID) params.append("anilistID", options.anilistID.toString());
    if (options.anilistInfo !== false) params.append("anilistInfo", "");

    try {
      const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) throw new Error("Image too large (Max 25MB)");
        const errorJson = await response.json().catch(() => null);
        throw new Error(errorJson?.error || `Image search error: HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("MoeAPI Search By Image Error:", error);
      throw error;
    }
  }

  /**
   * Check your API usage quota
   */
  static async getQuota(): Promise<MoeQuotaResponse> {
    try {
      const response = await fetch(`${this.BASE_URL}?action=quota`);
      if (!response.ok) throw new Error("Failed to fetch quota");
      return await response.json();
    } catch (error) {
      console.error("MoeAPI Quota Error:", error);
      throw error;
    }
  }
}