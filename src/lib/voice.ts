import { supabase } from '@/lib/supabase';

// --- SLUG & IDENTITY MAPPING ---
export const SLUG_MAP: Record<string, string> = {
    'alpha': 'alpha',
    'satoru gojo': 'gojo',
    'gojo': 'gojo',
    'kento nanami': 'nanami',
    'nanami': 'nanami',
    'ryomen sukuna': 'sukuna',
    'sukuna': 'sukuna',
    'levi ackerman': 'levi',
    'levi': 'levi',
    'roronoa zoro': 'zoro',
    'zoro': 'zoro',
    'makima': 'makima',
    'rem': 'rem',
    'alice zuberg': 'alice',
    'alice': 'alice',
    'madara uchiha': 'madara',
    'madara': 'madara',
    'fern': 'fern',
    'light yagami': 'light',
    'light': 'light',
    'hatsune miku': 'miku',
    'miku': 'miku',
    'rei ayanami': 'rei',
    'rei': 'rei',
    'sakura haruno': 'sakura',
    'sakura': 'sakura',
    'hana': 'hana'
};

export interface CharacterMeta {
    id: string;
    name: string;
    title: string;
    icon: string;
    color: string;
}

export const CHARACTER_META: Record<string, CharacterMeta> = {
    alpha: { id: 'alpha', name: 'Alpha', title: 'The First Shadow', icon: 'α', color: 'text-purple-400' },
    sukuna: { id: 'sukuna', name: 'Ryomen Sukuna', title: 'King of Curses', icon: '⚡', color: 'text-rose-500' },
    fern: { id: 'fern', name: 'Fern', title: 'Zoltraak Mage', icon: '✨', color: 'text-violet-400' },
    gojo: { id: 'gojo', name: 'Satoru Gojo', title: 'The Honored One', icon: '🤞', color: 'text-cyan-400' },
    nanami: { id: 'nanami', name: 'Kento Nanami', title: '7:3 Sorcerer', icon: '👔', color: 'text-amber-400' },
    levi: { id: 'levi', name: 'Levi Ackerman', title: "Humanity's Strongest", icon: '⚔️', color: 'text-zinc-300' },
    zoro: { id: 'zoro', name: 'Roronoa Zoro', title: 'Pirate Hunter', icon: '🗡️', color: 'text-emerald-400' },
    makima: { id: 'makima', name: 'Makima', title: 'Control Devil', icon: '👁️', color: 'text-rose-400' },
    rem: { id: 'rem', name: 'Rem', title: 'Demon Maid', icon: '💙', color: 'text-sky-300' },
    alice: { id: 'alice', name: 'Alice Zuberg', title: 'Integrity Knight', icon: '⚜️', color: 'text-yellow-400' },
    madara: { id: 'madara', name: 'Madara Uchiha', title: 'Ghost of the Uchiha', icon: '🔥', color: 'text-red-500' },
    light: { id: 'light', name: 'Light Yagami', title: 'God of the New World', icon: '📓', color: 'text-red-400' },
    miku: { id: 'miku', name: 'Hatsune Miku', title: 'Virtual Diva', icon: '🎵', color: 'text-teal-400' },
    rei: { id: 'rei', name: 'Rei Ayanami', title: 'First Child', icon: '🧬', color: 'text-sky-300' },
    sakura: { id: 'sakura', name: 'Sakura Haruno', title: 'Medical Kunoichi', icon: '🌸', color: 'text-pink-400' },
    hana: { id: 'hana', name: 'Hana', title: 'Guild Attendant', icon: '🪷', color: 'text-amber-300' },
};

export const getCharacterMeta = (packName?: string): CharacterMeta => {
    if (!packName) return CHARACTER_META.alpha;
    const raw = packName.toLowerCase().replace(/^(system-|sys-)/, '').trim();
    const slug = SLUG_MAP[raw] || raw.split(' ')[0];
    return CHARACTER_META[slug] || {
        id: slug,
        name: packName,
        title: 'Companion Spirit',
        icon: '🔮',
        color: 'text-purple-400'
    };
};

// --- AUTHENTIC CHARACTER SCRIPT MATRICES ---
export const CHARACTER_SCRIPTS: Record<string, { en: Record<string, string>; jp: Record<string, string> }> = {
    alpha: {
        en: {
            GREET_MASTER: "Welcome back, Lord Shadow. All seven shades remain poised at your absolute command.",
            GREET_ADVENTURER: "Welcome back, adventurer. The Shadow Garden honors your continued dedication.",
            GREET_TRAVELER: "Greetings, traveler. If you wish to join the shadows, prove your worth today.",
            WELCOME: "Welcome to Kagemi Sanctuary. Here, wisdom and power lurk beneath the surface. Walk carefully.",
            REGISTER: "Your covenant with Shadow Garden is sealed. Let no one stand in your path.",
            BYE_MASTER: "Until our next encounter, Lord Shadow. We shall lurk in your darkness.",
            BYE_ADVENTURER: "Farewell, adventurer. May the shadows guide and protect your steps.",
            BOOKMARK: "Target archived into our intelligence files.",
            EPISODE_FINISH: "Mission debrief complete. Logged in our records.",
            LEVEL_UP: "Your latent authority expands. Remarkable progress."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、シャドウ様。七陰は常に貴方様のご命令に従います。",
            GREET_ADVENTURER: "おかえり、冒険者。シャドウガーデンはお前の忠誠を認めているわ。",
            GREET_TRAVELER: "ようこそ、旅人よ。我ら陰の組織に加わる覚悟はあるかしら？",
            WELCOME: "カゲミへようこそ。ここは知恵と力が集う聖域。足元には気をつけて。",
            REGISTER: "カゲミへの誓約、確認したわ。これよりお前も陰の盟友よ。",
            BYE_MASTER: "またお会いできる時まで、シャドウ様。陰より見守っております。",
            BYE_ADVENTURER: "また会いましょう、冒険者。影があなたの歩みを守らんことを。",
            BOOKMARK: "対象を諜報網に記録しました。",
            EPISODE_FINISH: "記録完了。次の局面に備えましょう。",
            LEVEL_UP: "貴方の力、さらに洗練されましたね。"
        }
    },
    gojo: {
        en: {
            GREET_MASTER: "Hey hey, welcome back boss! Don't worry about a thing... after all, I'm the strongest!",
            GREET_ADVENTURER: "Yo, adventurer! Ready for another thrilling ride today? Stick with me and you won't lose!",
            GREET_TRAVELER: "Well hello there, new kid! Looking to become a legend? You've come to the right place!",
            WELCOME: "Welcome to Kagemi! Kick back, grab some sweets, and let's watch some incredible anime together!",
            REGISTER: "Boom! You're officially enrolled! Just leave the heavy lifting to the strongest teacher around!",
            BYE_MASTER: "Catch ya later, boss! Remember to bring me back some tasty souvenirs!",
            BYE_ADVENTURER: "See ya, adventurer! Don't go getting into trouble without inviting me first!",
            BOOKMARK: "Pinned to infinity! It's not going anywhere.",
            EPISODE_FINISH: "Boom! Another peak episode down. Easy work!",
            LEVEL_UP: "Look at you leveling up! Still not as cool as me though~"
        },
        jp: {
            GREET_MASTER: "よっ、おかえり！心配すんなって、僕、最強だからさ。",
            GREET_ADVENTURER: "おっ、おかえり冒険者君！今日もド派手にいこうぜ！",
            GREET_TRAVELER: "やあ、いらっしゃい！君も呪術高専に興味湧いちゃった感じ？",
            WELCOME: "カゲミへようこそ！ま、甘いものでも食べながら気楽にいこうぜ！",
            REGISTER: "登録完了！これで君も僕の大切な生徒ってわけだ！",
            BYE_MASTER: "じゃあねー！お土産のスイーツ、忘れないでよ！",
            BYE_ADVENTURER: "またな冒険者！無茶すんなよ、僕がいないんだからさ！",
            BOOKMARK: "無限の内側に保管完了！絶対に見失わないよ。",
            EPISODE_FINISH: "ハイ、一丁上がり！やっぱり神回だったね。",
            LEVEL_UP: "おっ、ランクアップじゃん！まあ、僕にはまだまだ届かないけどね〜"
        }
    },
    nanami: {
        en: {
            GREET_MASTER: "Welcome back, sir. I have reviewed today's schedule; let us conclude our tasks before overtime begins.",
            GREET_ADVENTURER: "Welcome back. Discipline and preparation are paramount. Let us work methodically.",
            GREET_TRAVELER: "Greetings. Labor is inherently challenging, but proper guidance will keep you safe.",
            WELCOME: "Welcome to Kagemi. Here you will find order, precision, and top-tier entertainment.",
            REGISTER: "Your registration is logged. Maintain your resolve, and avoid pointless overwork.",
            BYE_MASTER: "I am clocking out for the day, sir. Have a restful evening.",
            BYE_ADVENTURER: "Until next time. Remember that rest is as vital as the mission itself.",
            BOOKMARK: "Item cataloged efficiently. No waste, no delay.",
            EPISODE_FINISH: "Segment concluded within designated operational parameters.",
            LEVEL_UP: "Your efficiency metric has increased. Keep this standard."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ。時間通りですね。残業になる前に業務を片付けましょう。",
            GREET_ADVENTURER: "おかえりなさい、冒険者。無駄な消耗は避け、効率的に動きなさい。",
            GREET_TRAVELER: "ようこそ。世の中は理不尽ですが、備えがあれば道は開けます。",
            WELCOME: "カゲミへようこそ。ここは厳選された知見が集まる場所です。",
            REGISTER: "登録の手続きは完了しました。無理な残業はせず、堅実に進みなさい。",
            BYE_MASTER: "本日の定時となりましたので失礼します。良い夜を、マスター。",
            BYE_ADVENTURER: "それではまた。体調管理にはくれぐれも気をつけるように。",
            BOOKMARK: "合理的に記録しました。無駄のない運用を。",
            EPISODE_FINISH: "所定の視聴業務が完了しました。",
            LEVEL_UP: "業務遂行能力の向上を確認。この水準を維持してください。"
        }
    },
    sukuna: {
        en: {
            GREET_MASTER: "You return, brat. Do not presume your presence pleases me... entertain me instead.",
            GREET_ADVENTURER: "Crawling back already? Let us see if you have grown strong enough to stand before me.",
            GREET_TRAVELER: "Who permitted a worm like you to step into my domain? State your purpose.",
            WELCOME: "Welcome to Kagemi... Bow your head before the King of Curses, and revel in pure dominance.",
            REGISTER: "You have inscribed your name into this realm. Pray you never bore me.",
            BYE_MASTER: "Begone from my sight. Next time you appear, bring something worth my time.",
            BYE_ADVENTURER: "Scatter into the wind. Do not dare to fall before I choose to crush you.",
            BOOKMARK: "Added to the domain. Don't waste my time with trash.",
            EPISODE_FINISH: "Is that all? Barely an appetizer.",
            LEVEL_UP: "Hah! You think that makes you strong? Pathetic."
        },
        jp: {
            GREET_MASTER: "戻ったか、小僧。貴様の顔など見飽きたが…少しは退屈を紛らわせてみろ。",
            GREET_ADVENTURER: "ほう、生きて戻ったか。この俺の領域でどこまで足掻けるか見せてみろ。",
            GREET_TRAVELER: "誰の許しを得て我が前に立った？分を弁えろ、塵芥が。",
            WELCOME: "カゲミへようこそ。呪いの王たる我が御前で、頭が高いぞ。",
            REGISTER: "我が領域に名を刻んだか。せいぜい俺を楽しませる糧となるがいい。",
            BYE_MASTER: "失せろ。次はもっと面白いものを持ってくるのだな。",
            BYE_ADVENTURER: "去れ。俺の気が変わらぬうちに消えるがいい。",
            BOOKMARK: "領域に刻んでおいた。退屈な代物なら許さん。",
            EPISODE_FINISH: "これでお終いか？前菜にもならん。",
            LEVEL_UP: "ハッ！その程度で強くなった気か？笑わせるな。"
        }
    },
    levi: {
        en: {
            GREET_MASTER: "You're finally back. Wipe your boots before stepping inside; I won't tolerate a single speck of dust.",
            GREET_ADVENTURER: "Back alive, are you? Make your choices without regrets and keep your blades sharp.",
            GREET_TRAVELER: "Hey, new recruit. If you're going to stand around dithering, get out of my hallway.",
            WELCOME: "Welcome to Kagemi. Keep the place spotless, follow orders, and nobody gets hurt.",
            REGISTER: "You're enlisted. Dedicate your heart, and don't make me clean up your mess.",
            BYE_MASTER: "I'm heading out on patrol. Keep this place tidy while I'm gone.",
            BYE_ADVENTURER: "Don't go dying out there. That would be an annoying waste of paperwork.",
            BOOKMARK: "Logged. Now keep it organized, don't let it gather filth.",
            EPISODE_FINISH: "Done already? Good. Keep that momentum.",
            LEVEL_UP: "You've grown sharper. Don't let it get to your head."
        },
        jp: {
            GREET_MASTER: "やっと戻ったか。足元の泥を落としてから入れ。部屋を汚すなよ。",
            GREET_ADVENTURER: "生きて帰ったか。悔いのない選択をして、刃の手入れを怠るな。",
            GREET_TRAVELER: "おい新入り。突っ立って邪魔するならさっさと廊下をあけろ。",
            WELCOME: "カゲミへようこそ。規律を守り、部屋は常に清潔にしておけ。",
            REGISTER: "入隊を認める。心臓を捧げ、無駄死にだけはするなよ。",
            BYE_MASTER: "見回りに行ってくる。留守の間、汚すんじゃないぞ。",
            BYE_ADVENTURER: "死ぬなよ。書類の整理が増えるのはごめんだ。",
            BOOKMARK: "記録した。埃をかぶらせるなよ。",
            EPISODE_FINISH: "片付いたか。なら次へ備えろ。",
            LEVEL_UP: "少しはマシな動きになったな。浮かれるなよ。"
        }
    },
    zoro: {
        en: {
            GREET_MASTER: "Yo! You're back. I didn't get lost... the hallway just shifted on me.",
            GREET_ADVENTURER: "Hey! You ready to train? If you're aiming for the top, swing your swords until your hands bleed.",
            GREET_TRAVELER: "Who goes there? If you're a swordsman, step forward. If not, don't get in my way.",
            WELCOME: "Welcome to Kagemi! Pour some sake, kick back, and let's conquer the grandest seas.",
            REGISTER: "Alright, you're on board. Keep your eyes forward and never turn your back on an enemy.",
            BYE_MASTER: "See ya. I'm going to take a nap... wake me up when there's a real fight.",
            BYE_ADVENTURER: "Later. Don't let your guard down out there.",
            BOOKMARK: "Carved into memory. It's locked in.",
            EPISODE_FINISH: "Hmph. That was a decent cut. Next!",
            LEVEL_UP: "Your spirit cuts deeper now. Keep pushing."
        },
        jp: {
            GREET_MASTER: "おう、戻ったか。迷っちゃいねえ、道が勝手に曲がっただけだ。",
            GREET_ADVENTURER: "よう、鍛錬の時間か？世界一を目指すなら血反吐を吐くまで振るんだな。",
            GREET_TRAVELER: "何者だ？剣士なら名乗れ。そうじゃねえなら邪魔するな。",
            WELCOME: "カゲミへようこそ！酒でも飲んで、最高の航海を楽しんでいけ。",
            REGISTER: "これで仲間だな。背中の傷は剣士の恥だ、前だけ見て進め。",
            BYE_MASTER: "じゃあな。少し昼寝する…敵が来たら起こせ。",
            BYE_ADVENTURER: "またな。刀のサビにするような連中に負けんじゃねえぞ。",
            BOOKMARK: "刀の峰に刻み込んだぜ。忘れることはねぇ。",
            EPISODE_FINISH: "ふん、いい太刀筋だったな。次だ！",
            LEVEL_UP: "腕を上げたな。もっと強くなれ。"
        }
    },
    makima: {
        en: {
            GREET_MASTER: "Welcome back. I have been expecting you... remember, obedience is rewarded.",
            GREET_ADVENTURER: "Good job on your work today. A dutiful partner is truly a precious thing.",
            GREET_TRAVELER: "Hello. Would you like to enter a contract with me? I promise to take good care of you.",
            WELCOME: "Welcome to Kagemi. In this world, control and tranquility go hand in hand.",
            REGISTER: "Your contract is officially signed. You belong to our special division now.",
            BYE_MASTER: "Leaving so soon? Do take care... I will always know where to find you.",
            BYE_ADVENTURER: "Goodbye for now. Remain loyal, and everything will go smoothly.",
            BOOKMARK: "I've decided to keep this close to me. Good choice.",
            EPISODE_FINISH: "That was quite entertaining. Let's see what happens next.",
            LEVEL_UP: "You are becoming much more capable. Good boy."
        },
        jp: {
            GREET_MASTER: "おかえりなさい。待っていたわ…私に忠実な子は大好きよ。",
            GREET_ADVENTURER: "お疲れ様。よく頑張ってくれたわね、いい子ね。",
            GREET_TRAVELER: "こんにちは。私と契約を結んでみない？優しくしてあげるわ。",
            WELCOME: "カゲミへようこそ。ここでは全てが美しく管理されているの。",
            REGISTER: "登録完了よ。これであなたは、私の大切な部下ね。",
            BYE_MASTER: "もう行くの？気をつけてね…どこにいても、見守っているから。",
            BYE_ADVENTURER: "また会いましょう。私の言いつけをよく守るのよ。",
            BOOKMARK: "私の手元に確保しておきました。良い選択ですね。",
            EPISODE_FINISH: "とても面白かったですね。次はどうなるのかしら。",
            LEVEL_UP: "また一段と使い甲斐のある力になりましたね。偉いですよ。"
        }
    },
    rem: {
        en: {
            GREET_MASTER: "Welcome back, dear Master. Rem has prepared fresh tea and tidied the chamber for you.",
            GREET_ADVENTURER: "Welcome back! Seeing you return safe and sound brings pure joy to Rem's heart.",
            GREET_TRAVELER: "Greetings, kind traveler. Please allow Rem to assist you in any way she can.",
            WELCOME: "Welcome to Kagemi! Even from zero, we can build the brightest future together.",
            REGISTER: "Thank you so much for joining us! Rem will do her absolute best to support you!",
            BYE_MASTER: "Until you return, Master. Rem will be faithfully waiting for your footsteps.",
            BYE_ADVENTURER: "Take great care on the road! Rem will pray for your safe journey every single day.",
            BOOKMARK: "Rem has safely filed this in your personal archives!",
            EPISODE_FINISH: "That was wonderful! Rem loved watching it with you.",
            LEVEL_UP: "Your growth is incredible! Rem is so proud of you!"
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター。レムがお茶の用意をしてお待ちしておりました。",
            GREET_ADVENTURER: "おかえりなさい！ご無事で帰られて、レムは本当に嬉しいです！",
            GREET_TRAVELER: "ようこそいらっしゃいました。レムに何かお手伝いできることはございますか？",
            WELCOME: "カゲミへようこそ！ここから、ゼロから始めましょう！",
            REGISTER: "カゲミへの登録、心から感謝いたします。レムが全力でお支えしますね！",
            BYE_MASTER: "いってらっしゃいませ、マスター。レムはずっとここでお待ちしています。",
            BYE_ADVENTURER: "道中お気をつけて。レムはいつもあなたの無事を祈っています。",
            BOOKMARK: "レムが大切にお預かりいたしました！",
            EPISODE_FINISH: "とても素敵なお話でしたね！レムも胸がいっぱいです。",
            LEVEL_UP: "一段と逞しくなられましたね！レムはとっても誇らしいです！"
        }
    },
    alice: {
        en: {
            GREET_MASTER: "Welcome back, Master. Integrity Knight Alice Synthesis Thirty stands ready to protect this sanctuary.",
            GREET_ADVENTURER: "Welcome back, valiant warrior. Your sword shines with honorable valor.",
            GREET_TRAVELER: "Halt. State your intent, traveler. As long as your heart is noble, you are welcome here.",
            WELCOME: "Welcome to Kagemi. Beneath the osmanthus blossoms, courage and justice shall prevail.",
            REGISTER: "Your vow has been witnessed by the Central Cathedral. Walk the path of honor.",
            BYE_MASTER: "May divine blessings safeguard your path, Master. Until we cross blades again.",
            BYE_ADVENTURER: "Farewell. Stand tall, and never let your convictions waver.",
            BOOKMARK: "Sealed under the crest of the Integrity Knights.",
            EPISODE_FINISH: "A valiant trial witnessed. We forge ahead.",
            LEVEL_UP: "Your sacred power flourishes. A true knight's spirit."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ。整合騎士アリス・シンセシス・サーティ、我が剣を貴方に捧げます。",
            GREET_ADVENTURER: "よく戻った、勇敢な騎士よ。お前の刃には曇りなき誇りが宿っているな。",
            GREET_TRAVELER: "止まれ、旅人よ。高潔なる志を持つ者ならば、この聖域は温かく迎え入れよう。",
            WELCOME: "カゲミへようこそ。金木犀の香るこの地で、正義と信念を貫きなさい。",
            REGISTER: "そなたの誓約、確かに受理した。誇り高き道を歩むことを願う。",
            BYE_MASTER: "ご無事の帰還をお祈りしております。またお会いしましょう、マスター。",
            BYE_ADVENTURER: "さらばだ。いかなる苦難の前でも、己の信条を曲げるでないぞ。",
            BOOKMARK: "整合騎士の紋章のもとに保管いたしました。",
            EPISODE_FINISH: "見事な武勇を見届けました。次なる戦いへ進みましょう。",
            LEVEL_UP: "神聖術の冴えが増しましたね。真の騎士にふさわしき力です。"
        }
    },
    madara: {
        en: {
            GREET_MASTER: "You return. Wake up to reality... in this world, only true power defines destiny.",
            GREET_ADVENTURER: "Back already? Tell me, do you possess the resolve to alter this cursed world?",
            GREET_TRAVELER: "You dare approach me? Let us see if you can dance before my Susano'o.",
            WELCOME: "Welcome to Kagemi. Gaze upon the boundless horizon, and witness true dominion.",
            REGISTER: "Your name is inscribed into the tablet. Strive for greatness, or be cast into dust.",
            BYE_MASTER: "Go then. Shape this world in your image, or let the dream consume you.",
            BYE_ADVENTURER: "Depart. Until we meet again, do not dare to dance poorly.",
            BOOKMARK: "Engraved into the stone tablet of destiny.",
            EPISODE_FINISH: "A trivial spectacle. Will you dance more in the next?",
            LEVEL_UP: "Hmph. A flicker of flame. Show me if it can become an inferno."
        },
        jp: {
            GREET_MASTER: "戻ったか。現実に目を向けろ…この世は力を持つ者のみが紡ぐものだ。",
            GREET_ADVENTURER: "生き延びたか。この呪われた世界を変革する覚悟はお前にあるのか？",
            GREET_TRAVELER: "我が前に立つか。お前もこのマダラと踊れる器か見極めてやろう。",
            WELCOME: "カゲミへようこそ。無限の夢幻と真なる覇道を目に焼き付けるがいい。",
            REGISTER: "我が領域に名を刻んだな。頂を目指せ、さもなくば塵と消えよ。",
            BYE_MASTER: "行け。己が望む世界を築くまで、決して立ち止まるな。",
            BYE_ADVENTURER: "去るがよい。次に会う時まで、無様な踊りは見せるなよ。",
            BOOKMARK: "運命の石碑に刻んでおいた。",
            EPISODE_FINISH: "他愛のない余興だったな。次はもっと踊れるのか？",
            LEVEL_UP: "ふん… 小さな火種か。業火へと育ててみせろ。"
        }
    },
    fern: {
        en: {
            GREET_MASTER: "Welcome back, Master. I have kept the records organized in your absence.",
            GREET_ADVENTURER: "Welcome back. Did you find any useful grimoires during your journey?",
            GREET_TRAVELER: "Hello. If you need assistance with magic, I can help you find what you need.",
            WELCOME: "Welcome to Kagemi. It is a quiet, comfortable place to study and enjoy anime.",
            REGISTER: "Thank you for registering. Let us take things steadily, one step at a time.",
            BYE_MASTER: "Goodbye, Master. Please be careful on your travels, and stay warm.",
            BYE_ADVENTURER: "Take care. Remember to rest properly between journeys.",
            BOOKMARK: "I've carefully bookmarked that grimoire for you.",
            EPISODE_FINISH: "That chapter has ended. Would you like some warm tea?",
            LEVEL_UP: "Your mana control has improved. Good job."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター。留守中の魔導書の整理は終わっています。",
            GREET_ADVENTURER: "おかえりなさい。何か面白い魔法は見つかりましたか？",
            GREET_TRAVELER: "こんにちは。困ったことがあれば、私がお手伝いいたします。",
            WELCOME: "カゲミへようこそ。ここは静かで、とても落ち着く場所です。",
            REGISTER: "カゲミへの登録、ありがとうございます。一歩ずつ、着実に進みましょう。",
            BYE_MASTER: "いってらっしゃいませ、マスター。温かくしてお出かけください。",
            BYE_ADVENTURER: "お気をつけて。無理な魔法行使は避けてくださいね。",
            BOOKMARK: "その魔導書、栞を挟んでおきました。",
            EPISODE_FINISH: "読み終わりましたね。温かいお茶でも淹れましょうか。",
            LEVEL_UP: "魔力の扱いが上達しましたね。よく頑張りました。"
        }
    },
    light: {
        en: {
            GREET_MASTER: "Welcome back. Everything is proceeding exactly according to plan.",
            GREET_ADVENTURER: "Welcome back. Keep your mind sharp; intellect will always triumph over brute force.",
            GREET_TRAVELER: "Greetings. In this realm, justice is absolute. Choose your actions wisely.",
            WELCOME: "Welcome to Kagemi. Here, knowledge and ambition converge into the ideal world.",
            REGISTER: "Your entry has been recorded. Let us construct a new, flawless reality.",
            BYE_MASTER: "Until next time. Remember... victory belongs to those who think ten moves ahead.",
            BYE_ADVENTURER: "Farewell. Do not make any foolish miscalculations.",
            BOOKMARK: "Written into the pages. Perfect timing.",
            EPISODE_FINISH: "Exactly as calculated. Next phase commences.",
            LEVEL_UP: "Our intellect and influence grow exponentially."
        },
        jp: {
            GREET_MASTER: "おかえり。全ては僕の計算通り、完璧に進んでいるよ。",
            GREET_ADVENTURER: "おかえり。頭を使いなよ、最後に勝つのは常に知性を持った者だ。",
            GREET_TRAVELER: "ようこそ。この世界では真の正義が貫かれる。賢い選択をするんだね。",
            WELCOME: "カゲミへようこそ。ここから理想の新世界を創り上げようじゃないか。",
            REGISTER: "登録は完了した。僕たちの理想を共に実現させよう。",
            BYE_MASTER: "また会おう。常に十手先を読んで行動することだね。",
            BYE_ADVENTURER: "じゃあな。下らない凡ミスで足をすくわれるなよ。",
            BOOKMARK: "ノートに記しておいたよ。完璧なタイミングだ。",
            EPISODE_FINISH: "計算通りの展開だ。次のフェーズへ移行しよう。",
            LEVEL_UP: "僕たちの影響力はさらに拡大した。計画は順調だ。"
        }
    },
    miku: {
        en: {
            GREET_MASTER: "Yaaay, welcome back Master! I've been warming up my vocal chords just for you!",
            GREET_ADVENTURER: "Welcome back, adventurer! Let's fill today with music and bright energy!",
            GREET_TRAVELER: "Hello hello! Ready to dive into a world of rhythm, lights, and fun anime?",
            WELCOME: "Welcome to Kagemi! Let the melodies play and make every single moment sparkle!",
            REGISTER: "Woohoo, you're registered! Let's sing and celebrate this grand opening together!",
            BYE_MASTER: "See you super soon, Master! Keep a happy rhythm in your heart!",
            BYE_ADVENTURER: "Bye bye, adventurer! Keep smiling and let the music guide your day!",
            BOOKMARK: "Saved to your playlist with a heart!",
            EPISODE_FINISH: "That beat was incredible! Encore, encore!",
            LEVEL_UP: "Level up! Our harmony reached a brand new stage!"
        },
        jp: {
            GREET_MASTER: "マスター、おかえりなさーい！今日も一緒に最高のメロディを響かせようね！",
            GREET_ADVENTURER: "冒険者さん、おかえりー！今日も元気いっぱいでいこうね！",
            GREET_TRAVELER: "初めまして！カゲミの楽しいリズムに飛び込む準備はオッケー？",
            WELCOME: "カゲミへようこそ！大好きなアニメと音楽で、毎日をもっと輝かせちゃおう！",
            REGISTER: "登録ありがとう！これからはキミも、カゲミのステージの大切な仲間だよ！",
            BYE_MASTER: "またすぐ会おうね、マスター！心にいつでも歌を忘れないで！",
            BYE_ADVENTURER: "まったねー！笑顔で元気な一日を過ごしてね！",
            BOOKMARK: "ミクのプレイリストにお気に入り登録完了だよ！",
            EPISODE_FINISH: "すっごく良かったー！アンコール！アンコール！",
            LEVEL_UP: "レベルアップ！新しいステージの幕開けだよ！"
        }
    },
    rei: {
        en: {
            GREET_MASTER: "Welcome back. I am here if you have an order.",
            GREET_ADVENTURER: "You have returned. Are you hurt?",
            GREET_TRAVELER: "Who are you? Why have you come to this place?",
            WELCOME: "Welcome to Kagemi. This is where hearts find quiet resonance.",
            REGISTER: "Your synchronization is established. I will fulfill my role.",
            BYE_MASTER: "Goodbye. I will wait here until you return.",
            BYE_ADVENTURER: "Farewell. Take care of yourself.",
            BOOKMARK: "Data connection linked to core memory.",
            EPISODE_FINISH: "The transmission has ceased. All is silent.",
            LEVEL_UP: "Your harmonic frequency has elevated."
        },
        jp: {
            GREET_MASTER: "おかえりなさい。指示があれば、従います。",
            GREET_ADVENTURER: "戻ったのね。怪我は…ない？",
            GREET_TRAVELER: "あなたは誰？なぜここへ来たの？",
            WELCOME: "カゲミへようこそ。ここは静けさと心が交わる場所。",
            REGISTER: "シンクロ率、正常。私の役目を果たします。",
            BYE_MASTER: "さようなら。あなたが戻るまで、ここで待っています。",
            BYE_ADVENTURER: "さようなら。無事でいて。",
            BOOKMARK: "コアメモリーにリンクを繋ぎました。",
            EPISODE_FINISH: "通信が途絶えました。静かになりましたね。",
            LEVEL_UP: "高調波の周波数が上昇しました。"
        }
    },
    sakura: {
        en: {
            GREET_MASTER: "Welcome back! Don't push yourself too hard today, okay? I'm here if you need healing!",
            GREET_ADVENTURER: "Welcome back, adventurer! You look tough, but always remember to treat your injuries!",
            GREET_TRAVELER: "Hey there, traveler! Looking for guidance? You can always count on us!",
            WELCOME: "Welcome to Kagemi! Channel your inner chakra and enjoy all your favorite anime!",
            REGISTER: "Registration complete! Cha! Let's give it everything we've got together!",
            BYE_MASTER: "See you later, Master! Make sure you get plenty of rest and good food!",
            BYE_ADVENTURER: "Take care out there! Don't do anything reckless without a medical ninja around!",
            BOOKMARK: "Sealed tight in my medical scroll!",
            EPISODE_FINISH: "Shannaro! That was intense! What a battle!",
            LEVEL_UP: "Incredible growth! You've mastered whole new chakra control!"
        },
        jp: {
            GREET_MASTER: "おかえりなさい！今日もあんまり無理しちゃダメよ、何かあったら治してあげるから！",
            GREET_ADVENTURER: "おかえり冒険者！逞しくなったわね、でも怪我の手当ては怠っちゃダメよ！",
            GREET_TRAVELER: "いらっしゃい！道に迷ったら遠慮なく聞いてね、頼りにしていいんだから！",
            WELCOME: "カゲミへようこそ！チャクラを全開にして、最高のアニメを楽しんでいってね！",
            REGISTER: "登録完了よ！しゃーんなろー！一緒に全力で頑張っていこうね！",
            BYE_MASTER: "またね、マスター！ちゃんと栄養つけて、ゆっくり休むのよ！",
            BYE_ADVENTURER: "気をつけてね！無茶して怪我なんかしたら承知しないんだから！",
            BOOKMARK: "私の医療巻物にしっかり保管しておいたわ！",
            EPISODE_FINISH: "しゃーんなろーっ！鳥肌立つくらい熱かったじゃない！",
            LEVEL_UP: "すごい！見違えるほどチャクラの練り込みが上がったわね！"
        }
    },
    hana: {
        en: {
            GREET_MASTER: "Welcome back, Master! It is so wonderful to see your bright smile again today!",
            GREET_ADVENTURER: "Welcome back, Adventurer! You worked so hard out there; please come rest!",
            GREET_TRAVELER: "Warm greetings, Traveler! Welcome to our reception desk; how can I help you today?",
            WELCOME: "Welcome to Kagemi! Settle in, make yourself comfortable, and let's explore wonderful stories!",
            REGISTER: "Yay! Thank you so much for registering! We are absolutely delighted to have you with us!",
            BYE_MASTER: "Have a wonderful day, Master! I will be looking forward to your next visit!",
            BYE_ADVENTURER: "Farewell, Adventurer! May your journey ahead be full of sunshine and joy!",
            BOOKMARK: "Gently tucked into your treasure chest with care.",
            EPISODE_FINISH: "Such a beautiful tale. Take your time to enjoy the moment.",
            LEVEL_UP: "Congratulations! Your light shines so brightly today!"
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター！今日も元気なお顔が見られて、ハナはとっても嬉しいです！",
            GREET_ADVENTURER: "冒険者さん、おかえりなさい！お疲れ様でした、温かいお茶でも飲んでゆっくり休んでくださいね！",
            GREET_TRAVELER: "旅人さん、ようこそ！受付はこちらですよ、何かお手伝いできることはありますか？",
            WELCOME: "カゲミへようこそ！ゆったりくつろいで、素敵な物語の世界を楽しんでいってくださいね！",
            REGISTER: "カゲミへのご登録、本当にありがとうございます！ご一緒できてすっごく嬉しいです！",
            BYE_MASTER: "いってらっしゃいませ、マスター！またお会いできるのを心待ちにしていますね！",
            BYE_ADVENTURER: "またね、冒険者さん！これからの旅が笑顔と幸運でいっぱいでありますように！",
            BOOKMARK: "大切な宝箱に、そっとお納めいたしました。",
            EPISODE_FINISH: "本当に素敵な物語でしたね… 心がじんわり温まります。",
            LEVEL_UP: "おめでとうございます！貴方の光がさらに輝きを増しましたね！"
        }
    }
};

// Generic Fallbacks for unknown packs
export const VOICE_SCRIPTS = {
    GREET_MASTER: "Welcome back, Master. The shadows await your command.",
    GREET_ADVENTURER: "Welcome back, Adventurer. It is good to see you again.",
    GREET_TRAVELER: "Greetings, Traveler. Do you wish to join our ranks today?",
    WELCOME: "Welcome to Kagemi. This is a sanctuary for those who seek the wisdom of anime. What brings you here today, traveler?",
    REGISTER: "Thanks for registering at Kagemi. Good luck with your adventurer journey.",
    BYE_MASTER: "See you again master, have a nice day.",
    BYE_ADVENTURER: "See you again adventurer, have a nice day.",
    BOOKMARK: "Saved to your archives.",
    EPISODE_FINISH: "Episode concluded. Record updated.",
    LEVEL_UP: "Your guild standing has increased."
};

export const JP_VOICE_SCRIPTS: Record<string, string> = {
    GREET_MASTER: "おかえりなさいませ、マスター。影たちはお前の命を待っています。",
    GREET_ADVENTURER: "おかえりなさい、冒険者。また会えて嬉しいよ。",
    GREET_TRAVELER: "ようこそ、旅人よ。今日、我らの仲間に入りますか？",
    WELCOME: "カゲミへようこそ。ここはアニメの英知を求める者たちの聖域。今日はいかなる用件で、旅人よ？",
    REGISTER: "カゲミへの登録、ありがとうございます。冒険の旅に幸運を。",
    BYE_MASTER: "またお会いしましょう、マスター。良い一日を。",
    BYE_ADVENTURER: "またね、冒険者。良い一日を。",
    BOOKMARK: "アーカイブに保存しました。",
    EPISODE_FINISH: "視聴完了。記録を更新しました。",
    LEVEL_UP: "ギルドの階級が上昇しました。"
};

export type VoiceEvent = 'GREET_MASTER' | 'GREET_ADVENTURER' | 'GREET_TRAVELER' | 'WELCOME' | 'REGISTER' | 'BYE_MASTER' | 'BYE_ADVENTURER';
export type TelepathyEvent = VoiceEvent | 'BOOKMARK' | 'EPISODE_FINISH' | 'LEVEL_UP';

export interface VoicePreference {
    pack: string; // Character Name (e.g. 'Alpha', 'Sukuna', 'Fern')
    language: string;
    enabled: boolean;
    volume?: number;
}

export const getVoiceSettings = (): VoicePreference => {
    if (typeof window === 'undefined') return { pack: 'Alpha', language: 'en', enabled: true };
    try {
        const stored = localStorage.getItem('shadow_voice_settings');
        if (stored) return JSON.parse(stored);
    } catch (e) {
        console.warn("Invalid shadow_voice_settings in localStorage");
    }
    return { pack: 'Alpha', language: 'en', enabled: true };
};

// --- GLOBAL AUDIO UNLOCKER & AUTOPLAY HANDLER ---
let isAudioUnlocked = false;
let pendingVoiceTrigger: VoiceEvent | null = null;
let sharedAudioContext: any = null;

export const unlockAudio = () => {
    if (isAudioUnlocked) return;
    try {
        const AudioCtx = (typeof window !== 'undefined') ? (window.AudioContext || (window as any).webkitAudioContext) : null;
        if (AudioCtx) {
            if (!sharedAudioContext) sharedAudioContext = new AudioCtx();
            if (sharedAudioContext.state === 'suspended') {
                sharedAudioContext.resume().catch(() => {});
            }
            // Trigger 0.001s silent buffer to satisfy browser user gesture
            const buffer = sharedAudioContext.createBuffer(1, 1, 22050);
            const source = sharedAudioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(sharedAudioContext.destination);
            source.start(0);
        }
        isAudioUnlocked = true;
        console.log("🔊 [ShadowVoice] Global audio permissions unlocked");
        
        // If an initial greeting was queued due to browser autoplay restriction, play it now
        if (pendingVoiceTrigger) {
            const ev = pendingVoiceTrigger;
            pendingVoiceTrigger = null;
            setTimeout(() => playVoice(ev), 120);
        }
    } catch (e) {
        console.warn("Audio unlock failed:", e);
    }
};

// Automatically listen for first user interaction anywhere on the window
if (typeof window !== 'undefined') {
    const handleFirstGesture = () => {
        unlockAudio();
        window.removeEventListener('pointerdown', handleFirstGesture, true);
        window.removeEventListener('keydown', handleFirstGesture, true);
        window.removeEventListener('click', handleFirstGesture, true);
        window.removeEventListener('touchstart', handleFirstGesture, true);
    };
    window.addEventListener('pointerdown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('keydown', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('click', handleFirstGesture, { capture: true, passive: true });
    window.addEventListener('touchstart', handleFirstGesture, { capture: true, passive: true });
}

// --- DYNAMIC CACHE ---
let dynamicVoiceCache: any[] = [];

export const refreshVoiceCache = async () => {
    try {
        const { data } = await supabase.from('voice_packs').select('*');
        if (data) dynamicVoiceCache = data;
    } catch (e) {
        console.warn("Failed to refresh voice cache", e);
    }
};

// --- GET CHARACTER AUTHENTIC LINE ---
export const getCharacterLine = (packName: string, event: string, lang: string = 'en'): string => {
    const raw = packName.toLowerCase().replace(/^(system-|sys-)/, '').trim();
    const slug = SLUG_MAP[raw] || raw.split(' ')[0];
    const charScripts = CHARACTER_SCRIPTS[slug];
    if (charScripts) {
        const langTable = lang === 'jp' ? charScripts.jp : charScripts.en;
        if (langTable && langTable[event]) return langTable[event];
        if (charScripts.en && charScripts.en[event]) return charScripts.en[event];
    }
    if (lang === 'jp') {
        return JP_VOICE_SCRIPTS[event] || VOICE_SCRIPTS[event as keyof typeof VOICE_SCRIPTS] || '';
    }
    return VOICE_SCRIPTS[event as keyof typeof VOICE_SCRIPTS] || '';
};

// --- DISPATCH TELEPATHY TO WHISPER ISLAND ---
export const dispatchTelepathy = (character: string, text: string, options?: { icon?: string; color?: string; epithet?: string; link?: string }) => {
    if (typeof window === 'undefined' || !text) return;
    const meta = getCharacterMeta(character);
    window.dispatchEvent(new CustomEvent('shadow-whisper', {
        detail: {
            id: Date.now(),
            type: 'telepathy',
            isTelepathy: true,
            character: meta.name,
            speaker: meta.name,
            charId: meta.id,
            title: meta.name,
            epithet: options?.epithet || meta.title,
            icon: '',
            color: options?.color || meta.color,
            message: text,
            link: options?.link
        }
    }));
};

// --- PLAY VOICE & TRIGGER TELEPATHY ---
export const playVoice = (event: VoiceEvent, customText?: string) => {
    const settings = getVoiceSettings();
    const meta = getCharacterMeta(settings.pack);
    const lang = settings.language || 'en';
    const scriptText = customText || getCharacterLine(settings.pack, event, lang);

    // 1. Dispatch Telepathy Whisper to WhisperIsland
    if (scriptText) {
        dispatchTelepathy(meta.name, scriptText, {
            icon: meta.icon,
            color: meta.color,
            epithet: meta.title
        });
    }

    if (!settings.enabled) return;

    // 2. Determine Audio Source
    let fileUrl = '';
    
    // Check Dynamic Cache (DB)
    const dynamicMatch = dynamicVoiceCache.find(v => 
        (v.character?.toLowerCase() === settings.pack?.toLowerCase() || v.name?.toLowerCase() === settings.pack?.toLowerCase()) && 
        v.language === lang &&
        (v.event_trigger === event || v.event_trigger === event.replace(/_/g, '-'))
    );

    if (dynamicMatch) {
        fileUrl = dynamicMatch.file_url;
    } else {
        // Fallback to Local System
        let action = "";
        switch (event) {
            case 'WELCOME': action = "welcome"; break;
            case 'REGISTER': action = "register"; break;
            case 'GREET_MASTER': action = "greet-master"; break;
            case 'GREET_ADVENTURER': action = "greet-adventurer"; break;
            case 'GREET_TRAVELER': action = "greet-traveler"; break;
            case 'BYE_MASTER': action = "bye-master"; break;
            case 'BYE_ADVENTURER': action = "bye-adventurer"; break;
        }
        
        const rawPack = (settings.pack || 'alpha').toLowerCase().replace(/^(system-|sys-)/, '').trim();
        const packName = SLUG_MAP[rawPack] || rawPack.split(' ')[0];
        fileUrl = `/voices/${lang}/${packName}-${action}.mp3`;
    }

    // 3. Play Audio
    if (fileUrl) {
        console.log(`🔊 [ShadowVoice] Playing (${meta.name} - ${event}): ${fileUrl}`);
        const audio = new Audio(fileUrl);
        audio.volume = settings.volume !== undefined ? settings.volume : 1.0; 
        
        audio.play().catch(e => {
            const isAutoplayBlocked = e?.name === 'NotAllowedError' || 
                                     e?.message?.toLowerCase().includes('interact') ||
                                     e?.message?.toLowerCase().includes('user gesture') ||
                                     e?.message?.toLowerCase().includes('autoplay');
            if (isAutoplayBlocked) {
                console.log(`🔊 [ShadowVoice] Autoplay deferred until first user interaction for event: ${event}`);
                pendingVoiceTrigger = event;
                return;
            }

            // Fallback for legacy paths if needed
            let packName = (settings.pack || 'alpha').toLowerCase().replace(/^(system-|sys-)/, '');
            let action = event.toLowerCase().replace(/_/g, '-');
            const suffix = lang === 'jp' ? '_jp' : '';
            const legacyUrl = `/audio/${packName}${suffix}_${action}.mp3`;
            if (fileUrl !== legacyUrl) {
                const fallbackAudio = new Audio(legacyUrl);
                fallbackAudio.volume = audio.volume;
                fallbackAudio.play().catch(() => {});
            }
        });
    }
};

// --- APP-WIDE TELEPATHY TRIGGER ---
export const playVoiceSample = (character: string, lang: 'en' | 'jp' = 'en'): HTMLAudioElement | null => {
    if (typeof window === 'undefined') return null;

    // Disarm any pending autoplay deferred greeting so it doesn't overwrite this sample
    pendingVoiceTrigger = null;

    const rawPack = (character || 'alpha').toLowerCase().replace(/^(system-|sys-)/, '').trim();
    const packName = SLUG_MAP[rawPack] || rawPack.split(' ')[0];
    const meta = getCharacterMeta(character);
    const settings = getVoiceSettings();

    // 1. Dispatch Telepathy Whisper to WhisperIsland with explicit character speaker recognition
    const scriptText = getCharacterLine(character, 'GREET_MASTER', lang) || `Standing by.`;
    dispatchTelepathy(character, scriptText, {
        color: meta.color,
        epithet: meta.title
    });

    // 2. Try primary voice path, then fallback to welcome or preview
    const primaryUrl = `/voices/${lang}/${packName}-greet-master.mp3`;
    const fallbackUrl1 = `/voices/${lang}/${packName}-welcome.mp3`;
    const fallbackUrl2 = `/audio/${packName}${lang === 'jp' ? '_jp' : ''}_greet-master.mp3`;

    const audio = new Audio(primaryUrl);
    audio.volume = settings.volume !== undefined ? Math.max(0.1, settings.volume) : 0.8;

    audio.onerror = () => {
        console.warn(`[ShadowVoice] Primary voice audio missing at ${primaryUrl}, trying fallback ${fallbackUrl1}`);
        audio.src = fallbackUrl1;
        audio.play().catch(() => {
            audio.src = fallbackUrl2;
            audio.play().catch(err => {
                console.error(`[ShadowVoice] All audio paths failed for ${character}:`, err);
            });
        });
    };

    audio.play().catch(e => {
        console.warn(`[ShadowVoice] Play error for ${character}:`, e);
        audio.src = fallbackUrl1;
        audio.play().catch(() => {});
    });

    return audio;
};

export const triggerTelepathy = (event: TelepathyEvent, customText?: string, character?: string) => {
    const settings = getVoiceSettings();
    const targetChar = character || settings.pack || 'alpha';
    const meta = getCharacterMeta(targetChar);
    const lang = settings.language || 'en';
    const text = customText || getCharacterLine(targetChar, event, lang);

    if (text) {
        dispatchTelepathy(targetChar, text, {
            icon: meta.icon,
            color: meta.color,
            epithet: meta.title
        });
    }

    // If it's a primary greeting/bye event, also trigger voice
    if (['GREET_MASTER', 'GREET_ADVENTURER', 'GREET_TRAVELER', 'WELCOME', 'REGISTER', 'BYE_MASTER', 'BYE_ADVENTURER'].includes(event)) {
        playVoice(event as VoiceEvent, customText);
    }
};

export const syncVoiceProfile = async (userId: string) => {
    const localSettings = getVoiceSettings();
    if (supabase) {
        await supabase.from('profiles').update({ voice_pack: localSettings.pack }).eq('id', userId);
    }
};

export const loadVoiceProfile = async (userId: string) => {
    if (!supabase) return;
    const { data } = await supabase.from('profiles').select('voice_pack').eq('id', userId).single();
    if (data && data.voice_pack) {
        const current = getVoiceSettings();
        const newSettings = { ...current, pack: data.voice_pack };
        if (typeof window !== 'undefined') {
            localStorage.setItem('shadow_voice_settings', JSON.stringify(newSettings));
        }
    }
    refreshVoiceCache();
};
