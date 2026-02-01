import { NextRequest, NextResponse } from "next/server";
import { AnimeWorldService } from "@/lib/scrapers/world";
import { SourceExtractor } from "@/lib/scrapers/extractor";

export const runtime = "nodejs"; 
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = (searchParams.get("action") || "home").toLowerCase();
  
  const q = searchParams.get("q") || "";
  const url = searchParams.get("url") || ""; // Full URL or Slug
  const path = searchParams.get("path") || "";

  // Initialize the specific AnimeWorld service
  const service = new AnimeWorldService();

  try {
    switch (action) {
      case "home": {
        const data = await service.home();
        return json({ success: true, data });
      }

      case "search": {
        if (!q) return json({ success: false, error: "Missing q parameter" }, 400);
        const data = await service.search(q);
        return json({ success: true, data });
      }

      case "suggestions": {
        if (!q) return json({ success: false, error: "Missing q parameter" }, 400);
        const data = await service.searchSuggestions(q);
        return json({ success: true, data });
      }

      case "details": {
        if (!url) return json({ success: false, error: "Missing url parameter" }, 400);
        // Clean the URL to ensure it's just the path/slug if needed
        const data = await service.detailsBySeriesUrl(url);
        return json({ success: true, data });
      }

      case "episode": {
        if (!url) return json({ success: false, error: "Missing url parameter" }, 400);
        const data = await service.episode(url);
        return json({ success: true, data });
      }


      case "extract": {
        // We expect 'url' to be the iframe URL extracted from the previous step
        if (!url) return json({ success: false, error: "Missing iframe url parameter" }, 400);
        
        const data = await SourceExtractor.extractStream(url);
        return json({ success: true, data });
      }

      default:
        return json({ success: false, error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("AnimeWorld Route Error:", err);
    return json({ success: false, error: err.message || "Internal Server Error" }, 500);
  }
}