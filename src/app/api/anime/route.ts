import { NextRequest, NextResponse } from 'next/server';
import { consumetClient } from '@/lib/consumet';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const id = searchParams.get('id');
  const query = searchParams.get('query');
  const page = searchParams.get('page');

  try {
    let data;

    switch (action) {
      case 'info':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        data = await consumetClient.getInfo(id);
        break;

      case 'sources':
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
        
        // Get the new parameters used by the updated consumetClient
        const server = searchParams.get('server') || 'hd-1';
        const category = searchParams.get('cat') || 'sub';

        // Cast category to the specific string literal types expected by TypeScript
        data = await consumetClient.getSources(
          id, 
          server, 
          category as 'sub' | 'dub' | 'raw'
        );
        break;

      case 'search':
        const q = query || searchParams.get('q'); // Check both 'query' and 'q'
        if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 });
        data = await consumetClient.search(q, Number(page) || 1);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error(`API Error [${action}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}