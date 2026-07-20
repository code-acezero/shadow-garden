import { omni } from '../src/lib/omni';

async function run() {
  const home = await omni.drama.getHome();
  console.log('SECTIONS:', home?.sections?.length);
  home?.sections?.forEach(s => console.log(' -', s.title, s.items?.length));
}

run();
