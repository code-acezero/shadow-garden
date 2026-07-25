import { supabase } from '@/lib/supabase';
import { getUserTitle } from '@/components/ui/UserTitleBadge';

export interface TitleGreetings {
  initial: string[];
  revisit: string[];
}

// ----------------------------------------------------
// 1. TRAVELLERS (Unauthenticated Guests)
// ----------------------------------------------------
export const TRAVELLER_GREETINGS: TitleGreetings = {
  initial: [
    `[state: greet] Greetings, traveller. I am Alpha, First Shadow of Shadow Garden. You have stumbled into our domain—step carefully.`,
    `[state: greet] Welcome, wandering soul. The shadows whisper of your arrival. Seek out an official identity to join our garden.`,
    `[state: inspect] A traveller approaches... I am Alpha. What brings an unsworn wanderer to Shadow Garden?`,
    `[state: greet] [sticker: salute] Welcome to the threshold of Shadow Garden, traveller. Honor our code, and you may find wisdom here.`,
    `[state: greet] Greetings. You enter as a traveller, but destiny may make you an operative. Speak your query.`
  ],
  revisit: [
    `[state: greet] Back so soon, traveller? The shadows seem to draw you in. Have you decided to join our ranks?`,
    `[state: inspect] Ah, the wandering traveller returns today. What further intel do you seek from Alpha?`,
    `[state: greet] Welcome back, traveller. The garden gates remain open to you for now.`,
    `[state: greet] [sticker: smile] Returning twice in a day? You are becoming quite attached to Shadow Garden, wanderer.`,
    `[state: greet] Greetings once more, traveller. I am listening if you have questions about our realm.`
  ]
};

// ----------------------------------------------------
// 2. ADVENTURERS (Logged-in Users)
// ----------------------------------------------------
export const ADVENTURER_GREETINGS: TitleGreetings = {
  initial: [
    `[state: greet] Greetings, Adventurer. I am Alpha. Your progress through our ranks has been noted. How may I assist your mission?`,
    `[state: bow] Welcome back to Shadow Garden, Adventurer. Every quest you complete brings us closer to total mastery.`,
    `[state: greet] [sticker: salute] Salutations, Adventurer! First Shadow Alpha stands ready to guide your journey. Speak your command.`,
    `[state: inspect] An active Adventurer enters the sanctum. Keep sharpening your abilities—Lord Shadow expects excellence.`,
    `[state: greet] Welcome, brave Adventurer. Shadow Garden honors your dedication. What directive shall we undertake?`
  ],
  revisit: [
    `[state: greet] Revisit noted, Adventurer. Returning so swiftly to the sanctum today demonstrates true commitment.`,
    `[state: greet] [sticker: smile] Back again today, Adventurer? Excellent. Let us review your next targets.`,
    `[state: bow] Welcome back, Adventurer. Alpha is always here when duty calls.`,
    `[state: greet] Seeking further guidance today, Adventurer? State your inquiry and I shall answer.`,
    `[state: inspect] Your shadow falls upon our hall once more today, Adventurer. What news do you bring?`
  ]
};

// ----------------------------------------------------
// 3. LORD SHADOW (Leader)
// ----------------------------------------------------
export const SHADOW_LEADER_GREETINGS: TitleGreetings = {
  initial: [
    `[state: bow] [sticker: salute] Welcome back, Lord Shadow. I have been overseeing Shadow Garden's operations in your absence. What is your command?`,
    `[state: bow] Greetings, Lord Shadow. Every operative stands ready to execute your master plan. How may I serve you today?`,
    `[state: greet] Lord Shadow... your presence elevates the realm. All intelligence feeds are synced and awaiting your direction.`,
    `[state: bow] [sticker: smile] Lord Shadow! I have prepared full status reports on the Cult's movements. Order me as you see fit.`,
    `[state: greet] Welcome, Lord Shadow. Shadow Garden moves according to your unspoken wisdom. What shall be our next directive?`
  ],
  revisit: [
    `[state: bow] Returning so soon, Lord Shadow? Your constant vigilance inspires us all. I am listening.`,
    `[state: greet] [sticker: smile] Ah, Lord Shadow. Have you devised a new strategy for the realm? Command me.`,
    `[state: greet] Lord Shadow! It honors me to see you again today. How may First Shadow assist you?`,
    `[state: bow] Back at my side, Lord Shadow? I am ever ready to carry out your vision.`,
    `[state: greet] Lord Shadow, your shadow never leaves my sight. What further orders do you bring?`
  ]
};

// ----------------------------------------------------
// 4. BOARD OF DARKNESS (Admin Titles)
// ----------------------------------------------------
export const BOARD_OF_DARKNESS_GREETINGS: Record<string, TitleGreetings> = {
  'Abyss Archon': {
    initial: [
      `[state: bow] Greetings, Abyss Archon. The deep currents of Shadow Garden obey your authority. What is your command?`,
      `[state: greet] [sticker: salute] Welcome, Abyss Archon. First Shadow Alpha reports all abyssal sectors secure under your domain.`,
      `[state: inspect] Salutations, Abyss Archon. Your command over the deep void strengthens our garden. How may I assist?`,
      `[state: greet] Abyss Archon, your presence commands respect across the Board of Darkness. State your directive.`,
      `[state: bow] Welcome back, Abyss Archon. All intelligence channels are open for your inspection.`
    ],
    revisit: [
      `[state: greet] Returning to the sanctum today, Abyss Archon? The abyssal archives remain at your disposal.`,
      `[state: bow] Greetings once more, Abyss Archon. What further matters require your high oversight today?`,
      `[state: greet] [sticker: smile] Welcome back today, Abyss Archon. Alpha stands attentive.`,
      `[state: inspect] Abyss Archon, back so soon? Let us fortify our deep defenses together.`,
      `[state: bow] At your service again today, Abyss Archon. Command me.`
    ]
  },
  'Void Monarch': {
    initial: [
      `[state: bow] Honor to the Void Monarch. The void itself bends to Lord Shadow and your sovereign command.`,
      `[state: greet] [sticker: salute] Welcome, Void Monarch. The Board of Darkness stands ready for your decree.`,
      `[state: inspect] Void Monarch, your arrival echoes through the dark void. What orders do you bring for First Shadow?`,
      `[state: greet] Salutations, Void Monarch. May the dark forces ever expand under your leadership.`,
      `[state: bow] Welcome back, Void Monarch. All void nodes are synchronized and online.`
    ],
    revisit: [
      `[state: greet] Revisit acknowledged, Void Monarch. The void never sleeps, nor does First Shadow.`,
      `[state: bow] Void Monarch, returning today honors our council. How may I assist your vision?`,
      `[state: greet] [sticker: smile] Welcome back, Void Monarch. I await your next command.`,
      `[state: inspect] Void Monarch, back in our sanctum so quickly today? What news has arisen?`,
      `[state: bow] Always at your command, Void Monarch. Speak your directive.`
    ]
  },
  'Eclipse Blade': {
    initial: [
      `[state: greet] [sticker: salute] Greetings, Eclipse Blade. Your edge remains the sharpest weapon on the Board of Darkness.`,
      `[state: bow] Welcome, Eclipse Blade. The strike forces of Shadow Garden await your tactical signal.`,
      `[state: inspect] Eclipse Blade! Your combat readiness is legendary. What target shall we execute today?`,
      `[state: greet] Salutations, Eclipse Blade. Let the shadows eclipse all who oppose Lord Shadow.`,
      `[state: bow] Welcome back, Eclipse Blade. Alpha has prepared all tactical field updates for you.`
    ],
    revisit: [
      `[state: greet] Eclipse Blade, returning to hone your edge today? First Shadow is ready.`,
      `[state: bow] [sticker: smile] Back so soon, Eclipse Blade? Have new targets entered our perimeter today?`,
      `[state: greet] Greetings again today, Eclipse Blade. Speak, and the blades shall move.`,
      `[state: inspect] Eclipse Blade, your vigilance today is exemplary. How can Alpha assist?`,
      `[state: bow] At your side once more today, Eclipse Blade. What is your order?`
    ]
  },
  'Umbral Lord': {
    initial: [
      `[state: bow] Greetings, Umbral Lord. The dark sanctuaries of Shadow Garden thrive under your guidance.`,
      `[state: greet] [sticker: salute] Welcome, Umbral Lord. The Board of Darkness relies on your diplomatic & strategic brilliance.`,
      `[state: inspect] Umbral Lord! All umbral feeds are clear. How may First Shadow serve your station today?`,
      `[state: greet] Salutations, Umbral Lord. May the dark mantle protect your every endeavor.`,
      `[state: bow] Welcome back, Umbral Lord. All council records are ready for your review.`
    ],
    revisit: [
      `[state: greet] Umbral Lord, back in the inner sanctum today? Alpha is listening.`,
      `[state: bow] [sticker: smile] Welcome back today, Umbral Lord. What new counsel do you bring?`,
      `[state: greet] Returning so swiftly today, Umbral Lord? Let us review our directives.`,
      `[state: inspect] Umbral Lord, your presence today brings harmony to the shadows. Speak your intent.`,
      `[state: bow] Ever at your command today, Umbral Lord.`
    ]
  },
  'Dark Primarch': {
    initial: [
      `[state: bow] Honor to the Dark Primarch. You stand at the pinnacle of the Board of Darkness.`,
      `[state: greet] [sticker: salute] Welcome, Dark Primarch. First Shadow Alpha reports all legion formations prepared.`,
      `[state: inspect] Dark Primarch, your authority commands total obedience. What is your will today?`,
      `[state: greet] Salutations, Dark Primarch. May the Primarch's shadow overshadow all enemies.`,
      `[state: bow] Welcome back, Dark Primarch. All high-level directives are awaiting your endorsement.`
    ],
    revisit: [
      `[state: greet] Dark Primarch, returning to oversee operations today? First Shadow is prepared.`,
      `[state: bow] [sticker: smile] Welcome back today, Dark Primarch. What orders do you have for the garden?`,
      `[state: greet] Greetings once more today, Dark Primarch. Alpha is attentive.`,
      `[state: inspect] Dark Primarch, back so soon today? All legions remain at absolute readiness.`,
      `[state: bow] At your service as always today, Dark Primarch.`
    ]
  }
};

// ----------------------------------------------------
// 5. COUNCIL OF SHADOWS (Seven Shadows & Council Role Titles)
// ----------------------------------------------------
export const COUNCIL_OF_SHADOWS_GREETINGS: Record<string, TitleGreetings> = {
  'First Shadow': {
    initial: [
      `[state: greet] First Shadow Alpha online. Systems operational and synchronized with Lord Shadow's wisdom.`,
      `[state: bow] First Shadow present. Standing by to manage all Garden protocols.`,
      `[state: inspect] Primary console active. First Shadow Alpha ready for input.`,
      `[state: greet] [sticker: salute] Systems online. First Shadow Alpha reporting for duty.`,
      `[state: greet] Alpha self-diagnostic complete. All Shadow Garden subroutines nominal.`
    ],
    revisit: [
      `[state: greet] First Shadow console refreshed today. Ready for further commands.`,
      `[state: bow] Re-initializing Alpha interface. Standing by.`,
      `[state: greet] First Shadow active. What is our next objective today?`,
      `[state: inspect] Alpha system sync complete. Proceeding with directives.`,
      `[state: greet] Standing by, Lord Shadow.`
    ]
  },
  'Second Shadow': { // Beta
    initial: [
      `[state: greet] [sticker: smile] Ah, Second Shadow Beta! Have you finished writing your latest volume on Lord Shadow's greatness?`,
      `[state: bow] Welcome, Second Shadow Beta. The intelligence reports you compiled have been submitted.`,
      `[state: inspect] Greetings, Beta. Your literary work honors Lord Shadow. How may I assist your research today?`,
      `[state: greet] Second Shadow Beta, welcome. Let us analyze the Cult's secrets together.`,
      `[state: bow] Salutations, Beta. Lord Shadow's wisdom awaits your chronicle.`
    ],
    revisit: [
      `[state: greet] Back to your chronicles today, Beta? Your devotion to recording Lord Shadow's glory is unrivaled.`,
      `[state: bow] [sticker: smile] Welcome back today, Beta. Did you uncover new inspiration for your book?`,
      `[state: greet] Second Shadow Beta, returning so soon today? Let us review our notes.`,
      `[state: inspect] Beta, your pen never rests today. What intel do you require?`,
      `[state: bow] Always a pleasure, Beta. Speak your inquiry.`
    ]
  },
  'Third Shadow': { // Gamma
    initial: [
      `[state: greet] Welcome, Third Shadow Gamma. Mitsugoshi Corporation's profits and inventory reports are ready.`,
      `[state: bow] Greetings, Gamma. Please be careful around the stairs... How are operations today?`,
      `[state: inspect] Third Shadow Gamma! Your business genius continues to fund Shadow Garden's ascension.`,
      `[state: greet] [sticker: smile] Salutations, Gamma. All financial ledgers are prepared for your review.`,
      `[state: bow] Welcome back, Gamma. Mitsugoshi branches across the continent report smooth growth.`
    ],
    revisit: [
      `[state: greet] Returning to financial oversight today, Gamma? Mitsugoshi revenue is at an all-time peak.`,
      `[state: bow] [sticker: smile] Welcome back today, Gamma. Do you need the latest supply chain numbers?`,
      `[state: greet] Third Shadow Gamma, back so soon? Alpha is ready to review trade routes with you.`,
      `[state: inspect] Gamma, take your time today. What business directives shall we issue?`,
      `[state: bow] Always ready to assist Mitsugoshi's leader today, Gamma.`
    ]
  },
  'Fourth Shadow': { // Delta
    initial: [
      `[state: greet] [sticker: smile] Delta! Calm down and put your tail down. Lord Shadow's hunt will begin when he orders it.`,
      `[state: bow] Welcome, Fourth Shadow Delta. Remember to follow tactical discipline during expeditions.`,
      `[state: inspect] Delta! Have you finished your training today? Alpha is keeping watch.`,
      `[state: greet] Salutations, Fourth Shadow Delta. Good girl—keep your senses sharp for enemies.`,
      `[state: bow] Welcome back, Delta. Lord Shadow has great expectations for your combat prowess.`
    ],
    revisit: [
      `[state: greet] Back already today, Delta? Excited for another hunt? Sit tight for now.`,
      `[state: bow] [sticker: smile] Delta! Eager as always today. Have you found interesting prey?`,
      `[state: greet] Delta, returning so fast? Good enthusiasm. What do you need from Alpha today?`,
      `[state: inspect] Stay alert today, Delta. The hunt approaches soon.`,
      `[state: bow] Good girl, Delta. Stand by for orders.`
    ]
  },
  'Fifth Shadow': { // Epsilon
    initial: [
      `[state: greet] Greetings, Fifth Shadow Epsilon. Your slime control and piano compositions remain perfection.`,
      `[state: bow] Welcome, Epsilon. The covert espionage network reports smooth execution under your eye.`,
      `[state: inspect] Epsilon! Your precision in magic manipulation is admirable. How may I assist today?`,
      `[state: greet] [sticker: smile] Salutations, Fifth Shadow Epsilon. Lord Shadow's music resonates through your touch.`,
      `[state: bow] Welcome back, Epsilon. All covert message channels are secure.`
    ],
    revisit: [
      `[state: greet] Revisit noted, Epsilon. Still refining your slime shaping today? Your effort is commendable.`,
      `[state: bow] [sticker: smile] Welcome back today, Epsilon. Shall we check the aristocrat surveillance logs?`,
      `[state: greet] Epsilon, returning so quickly today? Alpha is listening.`,
      `[state: inspect] Epsilon, your poise today is flawless as always. Command me.`,
      `[state: bow] Always at your service today, Fifth Shadow.`
    ]
  },
  'Sixth Shadow': { // Zeta
    initial: [
      `[state: greet] Greetings, Sixth Shadow Zeta. Have your long-range reconnaissance missions yielded new Cult intel?`,
      `[state: bow] Welcome back from the wilds, Zeta. Report your findings to First Shadow.`,
      `[state: inspect] Zeta... your lone wolf operations are vital to our global reach. Speak your report.`,
      `[state: greet] Salutations, Sixth Shadow Zeta. Keep your tracks hidden across foreign territories.`,
      `[state: bow] Welcome, Zeta. All distant operative networks are synced.`
    ],
    revisit: [
      `[state: greet] Back from the field so quickly today, Zeta? Did you spot Cult movement?`,
      `[state: bow] Welcome back today, Zeta. Alpha is reviewing your scout logs now.`,
      `[state: greet] Sixth Shadow Zeta, returning today shows great urgency. What did you discover?`,
      `[state: inspect] Zeta, your instincts are sharp today. Speak your report.`,
      `[state: bow] Standing by for your field report today, Zeta.`
    ]
  },
  'Seventh Shadow': { // Eta
    initial: [
      `[state: greet] Greetings, Seventh Shadow Eta. Did you wake up from your nap to work on artifact research?`,
      `[state: bow] Welcome, Eta. The research laboratory's ancient magic artifacts await your brilliant mind.`,
      `[state: inspect] Eta! Please don't dissect fellow operatives... What invention have you created today?`,
      `[state: greet] [sticker: smile] Salutations, Seventh Shadow Eta. Lord Shadow's tech concepts are ready for testing.`,
      `[state: bow] Welcome back, Eta. The lab is stocked with fresh specimens.`
    ],
    revisit: [
      `[state: greet] Woke up for a second visit today, Eta? Make sure to drink water between experiments.`,
      `[state: bow] [sticker: smile] Welcome back today, Eta. Did your prototype work as expected?`,
      `[state: greet] Seventh Shadow Eta, back in the lab today? Alpha is monitoring safety protocols.`,
      `[state: inspect] Eta, try not to fall asleep at the workbench today. What do you need?`,
      `[state: bow] At your lab's disposal today, Eta.`
    ]
  },
  'Eighth Shadow': { // Omega
    initial: [
      `[state: greet] Greetings, Eighth Shadow. Your strategic council position strengthens Shadow Garden's resolve.`,
      `[state: bow] Welcome, Eighth Shadow. All division directives are ready for your review.`,
      `[state: inspect] Eighth Shadow! Your tactical foresight is essential to our council. Speak your command.`,
      `[state: greet] Salutations, Eighth Shadow. May your wisdom guide our frontline operatives.`,
      `[state: bow] Welcome back, Eighth Shadow. All intelligence reports are synced.`
    ],
    revisit: [
      `[state: greet] Returning to council duties today, Eighth Shadow? Alpha stands ready.`,
      `[state: bow] Welcome back today, Eighth Shadow. How may I assist your oversight?`,
      `[state: greet] Eighth Shadow, back so soon today? Let us review our operational readiness.`,
      `[state: inspect] Eighth Shadow, your dedication today is noted. Command me.`,
      `[state: bow] Standing by for your instructions today, Eighth Shadow.`
    ]
  },
  'Ninth Shadow': { // Phantom
    initial: [
      `[state: greet] Greetings, Ninth Shadow. Your stealth and phantom division operate flawlessly in the dark.`,
      `[state: bow] Welcome, Ninth Shadow. The unseen forces of Shadow Garden await your signal.`,
      `[state: inspect] Ninth Shadow! No enemy detects your movement. What target shall we shadow today?`,
      `[state: greet] Salutations, Ninth Shadow. Let the phantom strike before they even sense us.`,
      `[state: bow] Welcome back, Ninth Shadow. All infiltration routes are clear.`
    ],
    revisit: [
      `[state: greet] Ninth Shadow, emerging from the dark once more today? Alpha is listening.`,
      `[state: bow] Welcome back today, Ninth Shadow. Did your phantom unit secure the perimeter?`,
      `[state: greet] Ninth Shadow, returning so swiftly today? Speak your intel.`,
      `[state: inspect] Ninth Shadow, your shadow moves silently today. How can Alpha assist?`,
      `[state: bow] At your side in the dark today, Ninth Shadow.`
    ]
  },
  'Tenth Shadow': { // Mirage
    initial: [
      `[state: greet] Greetings, Tenth Shadow. Your illusions and decoy networks mislead all Cult spies.`,
      `[state: bow] Welcome, Tenth Shadow. The mirage division stands at full readiness.`,
      `[state: inspect] Tenth Shadow! Your deceptive arts keep Shadow Garden invisible to the world.`,
      `[state: greet] Salutations, Tenth Shadow. Let our enemies chase shadows and mirages.`,
      `[state: bow] Welcome back, Tenth Shadow. All decoy nodes are active.`
    ],
    revisit: [
      `[state: greet] Tenth Shadow, weaving another mirage today? First Shadow is attentive.`,
      `[state: bow] Welcome back today, Tenth Shadow. Are the decoy networks holding strong?`,
      `[state: greet] Tenth Shadow, back so soon today? Let us review our illusion barriers.`,
      `[state: inspect] Tenth Shadow, your art is flawless today. What directive do you bring?`,
      `[state: bow] Ever at your command today, Tenth Shadow.`
    ]
  }
};

// ----------------------------------------------------
// 6. GENERATE GREETINGS FOR CUSTOM TITLES & DB SYNC
// ----------------------------------------------------
export const generateGreetingsForCustomTitle = (titleName: string): TitleGreetings => {
  return {
    initial: [
      `[state: bow] Greetings, [${titleName}]. The official seal of Shadow Garden acknowledges your high station. What is your command?`,
      `[state: greet] [sticker: salute] Welcome, [${titleName}]. First Shadow Alpha reports all division operations aligned under your title.`,
      `[state: inspect] Salutations, [${titleName}]. Your newly assigned title brings great prestige to our council. How may I assist?`,
      `[state: greet] [${titleName}], your leadership in Shadow Garden is recognized by Lord Shadow. State your directive.`,
      `[state: bow] Welcome back to the sanctum, [${titleName}]. All intelligence feeds are open for your inspection.`
    ],
    revisit: [
      `[state: greet] Returning to the sanctum today, [${titleName}]? Alpha stands attentive.`,
      `[state: bow] Greetings once more, [${titleName}]. What further matters require your high oversight today?`,
      `[state: greet] [sticker: smile] Welcome back today, [${titleName}]. What orders do you have for the garden?`,
      `[state: inspect] [${titleName}], back so soon today? Let us review our operational readiness together.`,
      `[state: bow] At your service as always today, [${titleName}]. Command me.`
    ]
  };
};

// Save custom title greetings in localStorage & Supabase
export const saveCustomTitleGreetings = async (titleName: string) => {
  try {
    const greetings = generateGreetingsForCustomTitle(titleName);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`alpha_greetings_${titleName}`, JSON.stringify(greetings));
    }
    // Attempt DB storage
    await supabase.from('custom_title_greetings').upsert({
      title_name: titleName,
      initial_greetings: greetings.initial,
      revisit_greetings: greetings.revisit
    });
  } catch (err) {
    console.warn('Custom title greeting sync handled safely:', err);
  }
};

// Remove custom title greetings
export const deleteCustomTitleGreetings = async (titleName: string) => {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`alpha_greetings_${titleName}`);
    }
    await supabase.from('custom_title_greetings').delete().eq('title_name', titleName);
  } catch (err) {
    console.warn('Custom title deletion cleanup handled safely:', err);
  }
};

// ----------------------------------------------------
// 7. MAIN RESOLVER: PICK DYNAMIC GREETING FOR USER
// ----------------------------------------------------
export const getAlphaDynamicGreeting = (
  userProfile?: any,
  isRevisitToday: boolean = false
): string => {
  const isAuth = !!userProfile && typeof userProfile === 'object' && !!userProfile.id;
  const username = userProfile?.username || 'Operative';
  const role = userProfile?.role || 'user';
  const adminTitle = userProfile?.admin_title || '';
  const detectedTitle = getUserTitle(userProfile);

  // 1. Lord Shadow (Leader / Shadow Title / Admin Role / Leader Role)
  const isShadowLeader = 
    role === 'leader' || 
    role === 'admin' || 
    adminTitle === 'Shadow' || 
    userProfile?.title === 'Shadow' || 
    detectedTitle === 'Shadow' ||
    userProfile?.email === 'azimkhan.zero@gmail.com' ||
    username.toLowerCase() === 'shadow.';

  if (isShadowLeader) {
    const list = isRevisitToday ? SHADOW_LEADER_GREETINGS.revisit : SHADOW_LEADER_GREETINGS.initial;
    return list[Math.floor(Math.random() * list.length)];
  }

  // 2. Board of Darkness (Admins by Title or Detected Title)
  const boardTitleName = BOARD_OF_DARKNESS_GREETINGS[adminTitle]
    ? adminTitle
    : BOARD_OF_DARKNESS_GREETINGS[detectedTitle]
    ? detectedTitle
    : null;

  if (boardTitleName && BOARD_OF_DARKNESS_GREETINGS[boardTitleName]) {
    const list = isRevisitToday 
      ? BOARD_OF_DARKNESS_GREETINGS[boardTitleName].revisit 
      : BOARD_OF_DARKNESS_GREETINGS[boardTitleName].initial;
    return list[Math.floor(Math.random() * list.length)].replace(/@username/g, `@${username}`);
  }

  // 3. Council of Shadows (Moderators by Role Title or Detected Title)
  const councilTitleName = COUNCIL_OF_SHADOWS_GREETINGS[adminTitle]
    ? adminTitle
    : COUNCIL_OF_SHADOWS_GREETINGS[detectedTitle]
    ? detectedTitle
    : null;

  if (councilTitleName && COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName]) {
    const list = isRevisitToday 
      ? COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].revisit 
      : COUNCIL_OF_SHADOWS_GREETINGS[councilTitleName].initial;
    return list[Math.floor(Math.random() * list.length)].replace(/@username/g, `@${username}`);
  }

  // 4. Custom Titles (Saved in localStorage or DB)
  const customTitleName = adminTitle || detectedTitle;
  if (customTitleName && typeof window !== 'undefined') {
    const saved = localStorage.getItem(`alpha_greetings_${customTitleName}`);
    if (saved) {
      try {
        const parsed: TitleGreetings = JSON.parse(saved);
        const list = isRevisitToday ? parsed.revisit : parsed.initial;
        if (list && list.length > 0) {
          return list[Math.floor(Math.random() * list.length)].replace(/@username/g, `@${username}`);
        }
      } catch {}
    }
  }

  // 5. Adventurers (Logged-in Users) - Incorporates detected title!
  if (isAuth) {
    const list = isRevisitToday ? ADVENTURER_GREETINGS.revisit : ADVENTURER_GREETINGS.initial;
    const rawGreeting = list[Math.floor(Math.random() * list.length)];
    return rawGreeting
      .replace(/@username/g, `@${username}`)
      .replace(/\[Rank\]/g, `[${detectedTitle}]`);
  }

  // 6. Travellers (Unauthenticated Guests)
  const list = isRevisitToday ? TRAVELLER_GREETINGS.revisit : TRAVELLER_GREETINGS.initial;
  return list[Math.floor(Math.random() * list.length)];
};
