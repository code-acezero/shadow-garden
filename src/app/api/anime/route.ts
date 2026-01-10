import { NextRequest, NextResponse } from 'next/server';
import { consumetClient } from '@/lib/consumet';

/**
 * Shadow Garden API Bridge
 * Reverted to original stable logic.
 * Handles server-side fetching to bypass CORS and referer restrictions.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Extract Parameters
  const action = searchParams.get('action');
  const id = searchParams.get('id'); // Episode ID or Anime ID
  const query = searchParams.get('query') || searchParams.get('q');
  const page = searchParams.get('page') || '1';
  
  // Streaming Parameters
  const server = searchParams.get('server') || 'hd-1';
  const category = searchParams.get('cat') || 'sub';

  try {
    let data;

    switch (action) {
      case 'info':
        /**
         * Fetches detailed anime metadata using original provider IDs.
         */
        if (!id) {
          return NextResponse.json({ error: 'ID required for info' }, { status: 400 });
        }
        data = await consumetClient.getInfo(id);
        break;

      case 'sources':
        /**
         * Fetches streaming links. 
         * FIXED: Removed the 4th argument (animeId) to match your stable consumet.ts definition.
         */
        if (!id) {
          return NextResponse.json({ error: 'Episode ID required for sources' }, { status: 400 });
        }
        
        data = await consumetClient.getSources(
          id, 
          server, 
          category as 'sub' | 'dub' | 'raw'
        );
        break;

      case 'search':
        /**
         * Standard search using the metadata provider.
         */
        if (!query) {
          return NextResponse.json({ error: 'Query string required for search' }, { status: 400 });
        }
        data = await consumetClient.search(query, Number(page));
        break;

      case 'home':
        /**
         * Fetches homepage content (Spotlight, Trending, etc.)
         */
        data = await consumetClient.getHomePageData();
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action', 
          message: `Action "${action}" is not supported.` 
        }, { status: 400 });
    }

    // Check if data exists
    if (!data) {
      return NextResponse.json({ 
        error: 'Not Found', 
        message: 'The requested data could not be found.' 
      }, { status: 404 });
    }

    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error(`❌ API Route Error [${action}]:`, error.message);

    return NextResponse.json({ 
      error: 'Internal Server Error', 
      details: error.message 
    }, { status: 500 });
  }
}