import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });
import { fetchDonghuaApi, dpi } from './src/lib/dpi';

async function test() {
  try {
    const id = 'battle-through-the-heavens-season-5-episode-208-4k-multi-subtitles';
    const info = await fetchDonghuaApi(`/info/${encodeURIComponent(id)}`);
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.error(e);
  }
}
test();
