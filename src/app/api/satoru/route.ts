import { NextRequest, NextResponse } from "next/server";
import { SatoruService } from "@/lib/scrapers/satoru";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data: any, status = 200) {
    return NextResponse.json(data, { status });
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const action = (searchParams.get("action") || "home").toLowerCase();
    const id = searchParams.get("id");

    try {
        // 1. WATCH PAGE DATA
        if (action === "watch") {
            if (!id) return json({ error: "Missing id" }, 400);
            const data = await SatoruService.getWatchInfo(id);
            return json({ success: true, data });
        }

        // 2. SERVER DATA (Based on your provided service)
        if (action === "servers") {
            const epId = searchParams.get("episodeId");
            if (!epId) return json({ error: "Missing episodeId" }, 400);
            const data = await SatoruService.getServers(epId);
            return json({ success: true, data });
        }

        // 3. ANIME INFO (Existing)
        if (action === "info") {
            if (!id) return json({ error: "Missing id" }, 400);
            const data = await SatoruService.getInfo(id);
            return json({ success: true, data });
        }

        // 4. HOME (Existing)
        if (action === "home") {
            const data = await SatoruService.getHome();
            return json({ success: true, data });
        }

        return json({ error: "Invalid action" }, 400);

    } catch (e: any) {
        console.error("Satoru API Error:", e?.message);
        return json({ success: false, error: e?.message || "Internal Server Error" }, 500);
    }
}