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
  private static BASE_URL = "https://api.trace.moe";
  private static API_KEY = process.env.NEXT_PUBLIC_TRACE_MOE_KEY || ""; // Optional API Key

  /**
   * Search for anime scenes by Image URL
   */
  static async searchByUrl(imageUrl: string, options: MoeSearchOptions = {}): Promise<MoeSearchResponse> {
    const params = new URLSearchParams();
    params.append("url", imageUrl);
    
    if (options.cutBorders) params.append("cutBorders", "");
    if (options.anilistID) params.append("anilistID", options.anilistID.toString());
    if (options.anilistInfo) params.append("anilistInfo", "");

    const headers: HeadersInit = {};
    if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;

    try {
      const response = await fetch(`${this.BASE_URL}/search?${params.toString()}`, {
        method: "GET",
        headers: headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`MoeAPI Error ${response.status}: ${errorText}`);
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
    const formData = new FormData();
    formData.append("image", imageFile);

    const params = new URLSearchParams();
    if (options.cutBorders) params.append("cutBorders", "");
    if (options.anilistID) params.append("anilistID", options.anilistID.toString());
    if (options.anilistInfo) params.append("anilistInfo", "");

    const headers: HeadersInit = {};
    if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;

    try {
      const response = await fetch(`${this.BASE_URL}/search?${params.toString()}`, {
        method: "POST",
        body: formData,
        headers: headers,
      });

      if (!response.ok) {
        if (response.status === 413) throw new Error("Image too large (Max 25MB)");
        const errorText = await response.text();
        throw new Error(`MoeAPI Error ${response.status}: ${errorText}`);
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
    const headers: HeadersInit = {};
    if (this.API_KEY) headers["x-trace-key"] = this.API_KEY;

    try {
      const response = await fetch(`${this.BASE_URL}/me`, { headers });
      if (!response.ok) throw new Error("Failed to fetch quota");
      return await response.json();
    } catch (error) {
      console.error("MoeAPI Quota Error:", error);
      throw error;
    }
  }
}