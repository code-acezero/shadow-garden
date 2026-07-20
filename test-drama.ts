import { omni } from '../src/lib/omni';

async function run() {
  const korean = await omni.drama.search('korean');
  console.log('KOREAN:', korean.items.length);
  
  const chinese = await omni.drama.search('chinese');
  console.log('CHINESE:', chinese.items.length);
}

run();
