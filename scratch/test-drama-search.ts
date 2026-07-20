import { omni } from '../src/lib/omni';

async function test() {
  const res = await omni.drama.search('love');
  console.log(JSON.stringify(res, null, 2));
}
test();
