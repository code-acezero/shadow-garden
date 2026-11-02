import { NextResponse } from 'next/server';

export const revalidate = 300; // Cache for 5 minutes

const FALLBACK_NEWS = [
  {
    id: 101,
    title: "Chainsaw Man – The Movie: Reze Arc New Teaser & Worldwide Release Schedule",
    body: "MAPPA has released an exhilarating new visual and theatrical trailer for Chainsaw Man – The Movie: Reze Arc, confirming international releases across theaters in North America, Europe, and Asia.",
    createdAt: Math.floor(Date.now() / 1000) - 3600 * 4,
    replyCount: 142,
    viewCount: 18500,
    user: {
      name: "ChainsawDaily",
      avatar: { large: "https://s4.anilist.co/file/anilistcdn/character/large/b130102-pU8xK2rS3k7B.png" }
    },
    categories: [{ name: "Anime" }]
  },
  {
    id: 102,
    title: "Solo Leveling Season 2: Arise from the Shadow - Episode Schedule Announced",
    body: "A-1 Pictures officially confirms the broadcast timeline for Solo Leveling Season 2, exploring the Jeju Island arc with elevated animation production values.",
    createdAt: Math.floor(Date.now() / 1000) - 3600 * 12,
    replyCount: 98,
    viewCount: 14200,
    user: {
      name: "ShadowMonarch",
      avatar: { large: "https://s4.anilist.co/file/anilistcdn/character/large/b142988-XQ61s7W17jH6.png" }
    },
    categories: [{ name: "Anime" }]
  },
  {
    id: 103,
    title: "Demon Slayer: Infinity Castle Arc Film Trilogy Details & Staff Keynote",
    body: "Ufotable delivers a special behind-the-scenes breakdown for the upcoming Infinity Castle movie trilogy, highlighting revolutionary digital background rendering techniques.",
    createdAt: Math.floor(Date.now() / 1000) - 3600 * 24,
    replyCount: 215,
    viewCount: 29400,
    user: {
      name: "UfotableArchive",
      avatar: { large: "https://s4.anilist.co/file/anilistcdn/character/large/b126071-G2w6xY7m47K2.png" }
    },
    categories: [{ name: "Anime" }]
  },
  {
    id: 104,
    title: "Jujutsu Kaisen Season 3: The Culling Game Arc Production Underway",
    body: "Following the climax of Shibuya Incident, MAPPA confirms active production on the Culling Game arc with director statements on choreography.",
    createdAt: Math.floor(Date.now() / 1000) - 3600 * 36,
    replyCount: 340,
    viewCount: 45000,
    user: {
      name: "SorcererIntel",
      avatar: { large: "https://s4.anilist.co/file/anilistcdn/character/large/b127993-9qGf91mC1u3Q.png" }
    },
    categories: [{ name: "Anime" }]
  }
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const threadId = searchParams.get('id');

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    if (threadId) {
      const query = `
        query ($id: Int) {
          Thread(id: $id) {
            id
            title
            body
            createdAt
            replyCount
            viewCount
            user {
              name
              avatar { large }
            }
            categories { name }
          }
        }
      `;
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ query, variables: { id: parseInt(threadId, 10) } }),
        signal: controller.signal,
        next: { revalidate: 300 }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data.data?.Thread) {
          return NextResponse.json({ thread: data.data.Thread });
        }
      }

      // Check fallback
      const found = FALLBACK_NEWS.find(t => t.id.toString() === threadId) || FALLBACK_NEWS[0];
      return NextResponse.json({ thread: found });
    }

    // Fetch list of news threads
    const query = `
      query {
        Page(page: 1, perPage: 12) {
          threads(sort: ID_DESC) {
            id
            title
            body
            createdAt
            replyCount
            viewCount
            user {
              name
              avatar { large }
            }
            categories { name }
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query }),
      signal: controller.signal,
      next: { revalidate: 300 }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.data?.Page?.threads && data.data.Page.threads.length > 0) {
        return NextResponse.json({ threads: data.data.Page.threads });
      }
    }

    return NextResponse.json({ threads: FALLBACK_NEWS });
  } catch (err) {
    // Return fallback news gracefully without error
    if (threadId) {
      const found = FALLBACK_NEWS.find(t => t.id.toString() === threadId) || FALLBACK_NEWS[0];
      return NextResponse.json({ thread: found });
    }
    return NextResponse.json({ threads: FALLBACK_NEWS });
  }
}

