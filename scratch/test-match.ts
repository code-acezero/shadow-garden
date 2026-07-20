import { isRelatedAnime, getSimilarity } from '../src/lib/utils';

const testCases = [
    {
        cId: 'battle-through-the-heavens-season-5-episode-208-4k-multi-subtitles',
        cTitle: 'Battle Through the Heavens Season 5',
        tId: 'battle-through-the-heavens',
        tTitle: 'Battle Through the Heavens'
    },
    {
        cId: 'naruto-shippuden',
        cTitle: 'Naruto Shippuden',
        tId: 'naruto',
        tTitle: 'Naruto'
    },
    {
        cId: 'sword-art-online',
        cTitle: 'Sword Art Online',
        tId: 'sword-art-online-ii',
        tTitle: 'Sword Art Online II'
    }
];

testCases.forEach(tc => {
    console.log(`\nComparing:`);
    console.log(`Current: [${tc.cId}] ${tc.cTitle}`);
    console.log(`Target:  [${tc.tId}] ${tc.tTitle}`);
    console.log(`Result:  ${isRelatedAnime(tc.cId, tc.cTitle, tc.tId, tc.tTitle)}`);
    console.log(`ID Sim:  ${getSimilarity(tc.cId, tc.tId)}`);
});
