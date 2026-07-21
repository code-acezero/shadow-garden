const fs = require('fs');

const alphaPath = 'src/components/AI/AlphaWidget.tsx';
let alphaCode = fs.readFileSync(alphaPath, 'utf-8');

// 1. Add GIF_DICTIONARY
const gifDictionary = {
    happy: 'https://media.tenor.com/1vHg3ktQUWAAAAAM/anime-alpha.gif',
    angry: 'https://media.tenor.com/zcJsktSHd28AAAAM/anime-alpha.gif',
    sad: 'https://media.tenor.com/NJXqfuIys3cAAAAM/kagejitsu-kage-no-jitsuryokusha.gif',
    think: 'https://media.tenor.com/wQ6dAx9kne8AAAAM/the-eminence-in-shadow-teis.gif',
    laugh: 'https://media.tenor.com/QOvRXPjYT8QAAAAM/the-emience-in-shadow-shadow-garden.gif',
    shock: 'https://media.tenor.com/15DPtw1X1GsAAAAM/eminence-in-shadow-alpha-eminence-in-shadow.gif',
    nod: 'https://media.tenor.com/A4DlVvtejMYAAAAM/anime-alpha.gif',
    bow: 'https://media.tenor.com/l54ao_3RxWkAAAAM/anime-alpha.gif',
    combat: 'https://media.tenor.com/TN5HWx681wsAAAAM/anime-shadow-alpha.gif',
    smug: 'https://media.tenor.com/hy564OjfONgAAAAM/eminence-in-shadow-alpha.gif'
};

if (!alphaCode.includes('const GIF_DICTIONARY')) {
    alphaCode = alphaCode.replace('const ALL_STATES =', 'const GIF_DICTIONARY = ' + JSON.stringify(gifDictionary, null, 4) + ';\n\nconst ALL_STATES =');
}

// 2. State extraction logic to find GIFs
const newExtractCode = `
function extractStateAndContent(text: string, currentState: string) {
  let newState = currentState;
  let cleanText = text;
  let detectedGif = null;
  const stateRegex = /\\[state:\\s*([a-zA-Z0-9_-]+)\\]/i;
  const gifRegex = /\\[gif:\\s*([a-zA-Z0-9_-]+)\\]/i;
  
  let stateMatch = cleanText.match(stateRegex);
  if (stateMatch) {
    newState = stateMatch[1].toLowerCase().trim();
    cleanText = cleanText.replace(stateRegex, '').trim();
  }

  let gifMatch = cleanText.match(gifRegex);
  if (gifMatch) {
      const g = gifMatch[1].toLowerCase().trim();
      if ((GIF_DICTIONARY as any)[g]) {
          detectedGif = (GIF_DICTIONARY as any)[g];
      }
      cleanText = cleanText.replace(gifRegex, '').trim();
  }
  
  return { newState, cleanText, detectedGif };
}
`;

alphaCode = alphaCode.replace(/function extractStateAndContent[\s\S]*?return { newState, cleanText };\n}/, newExtractCode.trim());

// 3. Add activeGif state
alphaCode = alphaCode.replace('const [state, setState] = useState("greet");', 'const [state, setState] = useState("greet");\n  const [activeGif, setActiveGif] = useState<string | null>(null);');

// 4. Update typing effect logic
const oldTypingLogic = `
        const { newState, cleanText } = extractStateAndContent(currentContent, state);
        if (newState !== state) setState(newState);
`;
const newTypingLogic = `
        const { newState, cleanText, detectedGif } = extractStateAndContent(currentContent, state);
        if (newState !== state) setState(newState);
        if (detectedGif !== activeGif) setActiveGif(detectedGif);
`;
alphaCode = alphaCode.replace(oldTypingLogic.trim(), newTypingLogic.trim());

// 5. Inject activeGif into chat bubble
alphaCode = alphaCode.replace(
    '{displayedText}',
    '{displayedText}\n                    {activeGif && <div className="mt-4 rounded-xl overflow-hidden shadow-lg border border-orange-500/30 max-w-[200px]"><img src={activeGif} alt="Alpha Reaction" className="w-full h-auto object-cover" /></div>}'
);

// 6. Fix Alpha Overlay Layout!
const oldLayout = `
            {/* Left Side (Desktop: Image Search / Mobile: Image Search on Top) */}
            <div className="w-full md:w-1/2 h-full flex items-start md:items-center justify-center p-4 md:p-8 pointer-events-auto z-40 order-1 md:order-1">
                <AnimatePresence>
                    {isImageSearchOpen && <ImageSearchPanel onClose={() => setIsImageSearchOpen(false)} onScanComplete={handleScanComplete} />}
                </AnimatePresence>
            </div>

            {/* Right Side (Alpha & Speech) */}
            <div className="w-full md:w-1/2 h-full relative order-2 md:order-2 flex flex-col justify-end">
                
                {/* Alpha Sprite Overlay */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                    <div className="absolute bottom-0 left-[-40px] md:left-auto md:right-[-40px] h-[65vh] md:h-[95vh] z-10 scale-[0.9] origin-bottom pointer-events-none">
                        {ALL_STATES.map(st => (
                            <img
                                key={st}
                                src={\`/images/alpha/alpha-\${st}.png\`}
                                alt={\`Alpha \${st}\`}
                                className={\`absolute bottom-0 left-0 md:left-auto md:right-0 h-full w-auto object-contain object-bottom drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-opacity duration-500 ease-in-out \${state === st ? 'opacity-100 z-20' : 'opacity-0 z-10'}\`}
                                onError={(e) => { 
                                    if(st === state) (e.currentTarget.src = \`/images/alpha/alpha-relax.png\`);
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Speech Bubble Area */}
                <div className="absolute bottom-[20%] md:bottom-auto md:top-1/4 right-4 md:right-[35%] w-[90%] md:w-[450px] z-20 pointer-events-auto">
`;

const newLayout = `
            {/* Left Side (Desktop: Alpha Sprite, Mobile: Alpha Sprite Bottom Left) */}
            <div className="absolute bottom-0 left-[-20px] md:left-10 h-[50vh] md:h-[85vh] w-[250px] md:w-[400px] z-10 origin-bottom pointer-events-none flex justify-center">
                {ALL_STATES.map(st => (
                    <img
                        key={st}
                        src={\`/images/alpha/alpha-\${st}.png\`}
                        alt={\`Alpha \${st}\`}
                        className={\`absolute bottom-0 left-0 h-full w-full object-contain object-bottom drop-shadow-[0_0_25px_rgba(0,0,0,0.8)] transition-opacity duration-500 ease-in-out \${state === st ? 'opacity-100 z-20' : 'opacity-0 z-10'}\`}
                        onError={(e) => { 
                            if(st === state) (e.currentTarget.src = \`/images/alpha/alpha-relax.png\`);
                        }}
                    />
                ))}
            </div>

            {/* Content Area (Desktop: Chat Center, ImageSearch Right | Mobile: ImageSearch Top, Chat Middle) */}
            <div className="absolute inset-0 z-20 flex flex-col md:flex-row pointer-events-none">
                
                {/* Spacer for Desktop Alpha Sprite */}
                <div className="hidden md:block md:w-1/3 h-full flex-shrink-0" />

                {/* Center / Chat Bubble */}
                <div className="w-full md:w-1/3 h-full flex flex-col items-center justify-center pt-[50vh] md:pt-0 pb-20 md:pb-0 px-4 pointer-events-none relative z-30 order-2 md:order-1">
                    <div className="w-full max-w-[450px] pointer-events-auto ml-auto md:ml-0 md:-translate-x-12">
`;
alphaCode = alphaCode.replace(oldLayout.trim(), newLayout.trim());

// 7. Fix Image Search Panel rendering area
const oldSearchArea = `
                    </AnimatePresence>
                </div>
            </div>
`;
const newSearchArea = `
                    </AnimatePresence>
                </div>
                </div>

                {/* Right Side / Image Search */}
                <div className="w-full md:w-1/3 h-[50vh] md:h-full flex items-start md:items-center justify-center p-4 md:p-8 pointer-events-auto z-40 order-1 md:order-2">
                    <AnimatePresence>
                        {isImageSearchOpen && <ImageSearchPanel onClose={() => setIsImageSearchOpen(false)} onScanComplete={handleScanComplete} />}
                    </AnimatePresence>
                </div>

            </div>
`;
alphaCode = alphaCode.replace(oldSearchArea.trim(), newSearchArea.trim());

fs.writeFileSync('src/components/AI/AlphaWidget.tsx', alphaCode);
console.log("AlphaWidget UI rewrite complete!");
