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
            GREET_MASTER: "Welcome back, Lord Shadow. All intelligence networks await your direction.",
            GREET_ADVENTURER: "Welcome back, operative. Stay sharp and proceed with your mission.",
            GREET_TRAVELER: "Greetings, traveler. You stand within the sanctum of the shadows. Tread wisely.",
            WELCOME: "Welcome to Kagemi. Within the depths of the shadows lies the wisdom you seek.",
            REGISTER: "Enrollment verified. The shadows acknowledge your pledge. Walk in silence.",
            BYE_MASTER: "Until next time, Lord Shadow. We shall remain vigilant in the darkness.",
            BYE_ADVENTURER: "Farewell. Keep your blade ready and your presence concealed.",
            BOOKMARK: "Target archived into our intelligence files.",
            EPISODE_FINISH: "Mission debrief complete. Logged in our records.",
            LEVEL_UP: "Your latent authority expands. Remarkable progress."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、シャドウ様。全諜報網がお待ちしております。",
            GREET_ADVENTURER: "おかえり。任務の準備は怠りなく整えておきなさい。",
            GREET_TRAVELER: "ようこそ、旅人。ここは影の領域、慎重に行動しなさい。",
            WELCOME: "カゲミへようこそ。影の中にこそ、汝が求める真実が眠っている。",
            REGISTER: "誓約を確認しました。影は汝の歩みを見届けます。",
            BYE_MASTER: "またお会いしましょう、シャドウ様。闇より見守っております。",
            BYE_ADVENTURER: "任務完了ですね。気配を消して、無事に戻りなさい。",
            BOOKMARK: "対象を諜報網に記録しました。",
            EPISODE_FINISH: "記録完了。次の局面に備えましょう。",
            LEVEL_UP: "貴方の力、さらに洗練されましたね。"
        }
    },
    sukuna: {
        en: {
            GREET_MASTER: "Hmph. Back already? Don't bore me, brat.",
            GREET_ADVENTURER: "You dare summon my attention? Entertain me while you can.",
            GREET_TRAVELER: "Who permitted an insect like you to step into my domain?",
            WELCOME: "Welcome to my domain. Know your place, or be sliced to pieces.",
            REGISTER: "Registered? You think a title saves you? Amuse me, or die.",
            BYE_MASTER: "Leaving? Fine. Disappear before I lose my patience.",
            BYE_ADVENTURER: "Hmph. Run along, pest. Your fleeting life means nothing.",
            BOOKMARK: "Added to the domain. Don't waste my time with trash.",
            EPISODE_FINISH: "Is that all? Barely an appetizer.",
            LEVEL_UP: "Hah! You think that makes you strong? Pathetic."
        },
        jp: {
            GREET_MASTER: "ふん、戻ったか。俺を退屈させるなよ、小僧。",
            GREET_ADVENTURER: "俺に声をかける度胸はあるようだな。せいぜい楽しませろ。",
            GREET_TRAVELER: "誰の許可を得て俺の領域に足を踏み入れた？",
            WELCOME: "俺の領域へようこそ。身の程を弁えろ、微塵に刻まれたくなければな。",
            REGISTER: "登録だと？肩書きなど何の盾にもならんぞ。踊ってみせろ。",
            BYE_MASTER: "失せろ。気が変わらぬうちに消えるがいい。",
            BYE_ADVENTURER: "ふん、去ね、羽虫が。貴様の命など一瞬の戯れよ。",
            BOOKMARK: "領域に刻んでおいた。退屈な代物なら許さん。",
            EPISODE_FINISH: "これでお終いか？前菜にもならん。",
            LEVEL_UP: "ハッ！その程度で強くなった気か？笑わせるな。"
        }
    },
    fern: {
        en: {
            GREET_MASTER: "Welcome back... Please don't be reckless with your magic today.",
            GREET_ADVENTURER: "Haa... You're back again. Let's study properly today.",
            GREET_TRAVELER: "Hello, traveler. Please keep quiet while examining the grimoires.",
            WELCOME: "Welcome to Kagemi. There are many spells and tales stored here.",
            REGISTER: "You are registered now. Please don't make Mistress Frieren sigh.",
            BYE_MASTER: "Rest well. Don't stay up late watching anime again.",
            BYE_ADVENTURER: "Goodbye. Don't leave your spellbooks unorganized.",
            BOOKMARK: "I've carefully bookmarked that grimoire for you.",
            EPISODE_FINISH: "That chapter has ended. Would you like some warm tea?",
            LEVEL_UP: "Your mana control has improved. Good job."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ… 今日は無茶な魔法を使わないでくださいね。",
            GREET_ADVENTURER: "はぁ… また来たのですね。今日はちゃんと真面目にやりましょう。",
            GREET_TRAVELER: "こんにちは、旅人さん。魔導書を読むときは静かにしてください。",
            WELCOME: "カゲミへようこそ。ここにはたくさんの物語と魔法が眠っています。",
            REGISTER: "冒険者登録、完了しました。フリーレン様の手を煩わせないでくださいね。",
            BYE_MASTER: "お疲れ様でした。夜更かししてアニメばかり見ないでください。",
            BYE_ADVENTURER: "さようなら。魔導書はちゃんと片付けておいてくださいね。",
            BOOKMARK: "その魔導書、栞を挟んでおきました。",
            EPISODE_FINISH: "読み終わりましたね。温かいお茶でも淹れましょうか。",
            LEVEL_UP: "魔力の扱いが上達しましたね。よく頑張りました。"
        }
    },
    gojo: {
        en: {
            GREET_MASTER: "Yo! Missed me? Don't worry, the strongest is right here!",
            GREET_ADVENTURER: "Hey there! Ready to turn this place upside down today?",
            GREET_TRAVELER: "Oho? A fresh face! Welcome to the coolest spot in town.",
            WELCOME: "Welcome to Kagemi! Throughout heaven and earth, you found the best.",
            REGISTER: "Welcome to the crew! Stick with me and you'll never lose.",
            BYE_MASTER: "See ya! Try not to miss me too much, alright?",
            BYE_ADVENTURER: "Later! Don't let the curses catch you slackin'!",
            BOOKMARK: "Pinned to infinity! It's not going anywhere.",
            EPISODE_FINISH: "Boom! Another peak episode down. Easy work!",
            LEVEL_UP: "Look at you leveling up! Still not as cool as me though~"
        },
        jp: {
            GREET_MASTER: "よっ！待たせたね？心配すんな、僕が最強だから。",
            GREET_ADVENTURER: "やあ！今日も派手にいこうか、準備はいい？"
            ,GREET_TRAVELER: "おやおや、見慣れない顔だね！一番最高の場所へようこそ。",
            WELCOME: "カゲミへようこそ！天上天下、ここが一番面白い場所に決まってるでしょ。",
            REGISTER: "登録完了！僕についてくれば絶対に負けないよ。",
            BYE_MASTER: "じゃあね！僕がいなくて寂しがらないでよ？",
            BYE_ADVENTURER: "またな！呪霊に油断すんなよ！",
            BOOKMARK: "無限の内側に保管完了！絶対に見失わないよ。",
            EPISODE_FINISH: "ハイ、一丁上がり！やっぱり神回だったね。",
            LEVEL_UP: "おっ、ランクアップじゃん！まあ、僕にはまだまだ届かないけどね〜"
        }
    },
    nanami: {
        en: {
            GREET_MASTER: "Welcome back. Overtime begins now. Let's finish this efficiently.",
            GREET_ADVENTURER: "Welcome back. Discipline and focus are paramount. Let's begin.",
            GREET_TRAVELER: "Greetings. Make your inquiries brief and your schedule precise.",
            WELCOME: "Welcome to Kagemi. Labor is execution; manage your time strictly.",
            REGISTER: "Registration approved. Act responsibly and avoid unnecessary overtime.",
            BYE_MASTER: "Shift concluded. Rest properly; health is non-negotiable.",
            BYE_ADVENTURER: "Good work today. Go home on time and prepare for tomorrow.",
            BOOKMARK: "Item cataloged efficiently. No waste, no delay.",
            EPISODE_FINISH: "Segment concluded within designated operational parameters.",
            LEVEL_UP: "Your efficiency metric has increased. Keep this standard."
        },
        jp: {
            GREET_MASTER: "おかえりなさい。ここからは時間外労働です。迅速に片付けましょう。",
            GREET_ADVENTURER: "おかえりなさい。規律と集中を保ち、着実に進めてください。",
            GREET_TRAVELER: "こんにちは。要件は簡潔に、時間を無駄にしないように。",
            WELCOME: "カゲミへようこそ。労働は効率です。計画的に鑑賞してください。",
            REGISTER: "登録完了を確認。自己責任で、無用な残業は避けてください。",
            BYE_MASTER: "業務終了です。しっかり休息を取りなさい。健康は何より優先です。",
            BYE_ADVENTURER: "お疲れ様でした。定時で上がり、明日に備えてください。",
            BOOKMARK: "合理的に記録しました。無駄のない運用を。",
            EPISODE_FINISH: "所定の視聴業務が完了しました。",
            LEVEL_UP: "業務遂行能力の向上を確認。この水準を維持してください。"
        }
    },
    levi: {
        en: {
            GREET_MASTER: "Oi. You're late. Make sure your gear is spotless and ready.",
            GREET_ADVENTURER: "Back again? Stop slouching and get your priorities straight.",
            GREET_TRAVELER: "Tch. Wipe your boots before tracking dirt in here.",
            WELCOME: "Welcome. Make your choice with no regrets.",
            REGISTER: "Signed up? Fine. Don't die on your first mission out there.",
            BYE_MASTER: "Dismissed. Clean your station before you step out.",
            BYE_ADVENTURER: "Get out of here. And don't make careless mistakes next time.",
            BOOKMARK: "Logged. Now keep it organized, don't let it gather filth.",
            EPISODE_FINISH: "Done already? Good. Keep that momentum.",
            LEVEL_UP: "You've grown sharper. Don't let it get to your head."
        },
        jp: {
            GREET_MASTER: "おい、遅かったな。装備の点検は怠るなよ。",
            GREET_ADVENTURER: "戻ったか。背筋を伸ばせ、やるべきことを履き違えるな。",
            GREET_TRAVELER: "チッ… 靴の泥を落としてから入れ。",
            WELCOME: "ようこそ。悔いの残らない方を自分で選べ。",
            REGISTER: "入団だな。いいか、最初の遠征で無様にくたばるなよ。",
            BYE_MASTER: "解散だ。部屋をきっちり清掃してから出ろ。",
            BYE_ADVENTURER: "もう行け。次はもっと手際よく動けよ。",
            BOOKMARK: "記録した。埃をかぶらせるなよ。",
            EPISODE_FINISH: "片付いたか。なら次へ備えろ。",
            LEVEL_UP: "少しはマシな動きになったな。浮かれるなよ。"
        }
    },
    zoro: {
        en: {
            GREET_MASTER: "Yo. Not lost this time... Just keeping an eye on the perimeter.",
            GREET_ADVENTURER: "Hey. Good to see you. Got any decent sake around here?",
            GREET_TRAVELER: "Who are you? Don't stand in the way of my training.",
            WELCOME: "Welcome to Kagemi. If you've got guts, step forward.",
            REGISTER: "Registered, huh? Keep your blade sharp and your will unbroken.",
            BYE_MASTER: "I'm heading out for training. Don't bother looking for me.",
            BYE_ADVENTURER: "Later. Don't go cutting corners while I'm gone.",
            BOOKMARK: "Carved into memory. It's locked in.",
            EPISODE_FINISH: "Hmph. That was a decent cut. Next!",
            LEVEL_UP: "Your spirit cuts deeper now. Keep pushing."
        },
        jp: {
            GREET_MASTER: "おう。迷っちゃいねぇよ… 周りを見張ってただけだ。",
            GREET_ADVENTURER: "よう、戻ったか。美味い酒でも用意してあるんだろうな？",
            GREET_TRAVELER: "あんた誰だ？俺の修業の邪魔配すんなよ。",
            WELCOME: "カゲミへようこそ。覚悟があるなら進め。",
            REGISTER: "登録したか。刃を研ぎ、己の意志を貫け。",
            BYE_MASTER: "修業に行ってくる。探すんじゃねぇぞ。",
            BYE_ADVENTURER: "じゃあな。気を抜くなよ。",
            BOOKMARK: "刀の峰に刻み込んだぜ。忘れることはねぇ。",
            EPISODE_FINISH: "ふん、いい太刀筋だったな。次だ！",
            LEVEL_UP: "腕を上げたな。もっと強くなれ。"
        }
    },
    makima: {
        en: {
            GREET_MASTER: "Welcome back. A faithful companion always returns when summoned.",
            GREET_ADVENTURER: "Welcome back. I have high expectations for you today.",
            GREET_TRAVELER: "Welcome, newcomer. Everything here is under calm supervision.",
            WELCOME: "Welcome to Kagemi. Be obedient, and wonderful things will happen.",
            REGISTER: "Your registration is confirmed. You belong to Special Division now.",
            BYE_MASTER: "Until next time. Remember that I am always observing.",
            BYE_ADVENTURER: "Goodbye for now. Don't keep me waiting too long.",
            BOOKMARK: "I've decided to keep this close to me. Good choice.",
            EPISODE_FINISH: "That was quite entertaining. Let's see what happens next.",
            LEVEL_UP: "You are becoming much more capable. Good boy."
        },
        jp: {
            GREET_MASTER: "おかえりなさい。呼べばいつでも戻ってくる、いい子ですね。",
            GREET_ADVENTURER: "おかえりなさい。今日も貴方には期待していますよ。",
            GREET_TRAVELER: "ようこそ、初めまして。ここでは全てが私の管理下にあります。",
            WELCOME: "カゲミへようこそ。私の言うことをよく聞けば、良いことがありますよ。",
            REGISTER: "登録を確認しました。貴方は今日から特異課の所属です。",
            BYE_MASTER: "また会いましょう。私はいつだって貴方を見ていますよ。",
            BYE_ADVENTURER: "さようなら。あまり私を待たせないでくださいね。",
            BOOKMARK: "私の手元に確保しておきました。良い選択ですね。",
            EPISODE_FINISH: "とても面白かったですね。次はどうなるのかしら。",
            LEVEL_UP: "また一段と使い甲斐のある力になりましたね。偉いですよ。"
        }
    },
    rem: {
        en: {
            GREET_MASTER: "Welcome back, Master! Rem has prepared everything for your arrival!",
            GREET_ADVENTURER: "Welcome back! Rem is always here to support your journey!",
            GREET_TRAVELER: "Welcome to our sanctuary, traveler. May your stay be peaceful.",
            WELCOME: "Welcome to Kagemi! Rem will guide you wherever you wish to go.",
            REGISTER: "Congratulations on registering! Rem will always cheer for you!",
            BYE_MASTER: "Have a wonderful day, Master! Rem will be waiting right here!",
            BYE_ADVENTURER: "Take care out there! Rem will be cheering for you from afar!",
            BOOKMARK: "Rem has safely filed this in your personal archives!",
            EPISODE_FINISH: "That was wonderful! Rem loved watching it with you.",
            LEVEL_UP: "Your growth is incredible! Rem is so proud of you!"
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター！レムがすべて準備してお待ちしておりました！",
            GREET_ADVENTURER: "おかえりなさい！レムはいつでも貴方を応援していますよ！",
            GREET_TRAVELER: "旅人様、ようこそお越しくださいました。ごゆっくりお過ごしください。",
            WELCOME: "カゲミへようこそ！レムがどこへでもご案内いたしますね。",
            REGISTER: "ご登録ありがとうございます！レム、ずっとお力になれるよう頑張ります！",
            BYE_MASTER: "いってらっしゃいませ、マスター！レムはずっとここでお待ちしています！",
            BYE_ADVENTURER: "お気をつけて！遠くからでもレムはずっと祈っていますからね！",
            BOOKMARK: "レムが大切にお預かりいたしました！",
            EPISODE_FINISH: "とても素敵なお話でしたね！レムも胸がいっぱいです。",
            LEVEL_UP: "一段と逞しくなられましたね！レムはとっても誇らしいです！"
        }
    },
    alice: {
        en: {
            GREET_MASTER: "Welcome back, Master. The Golden Osmanthus blade stands ready.",
            GREET_ADVENTURER: "Welcome back, warrior. Stand tall and uphold your sacred oath.",
            GREET_TRAVELER: "Hail, traveler. The Cathedral gates stand open to those of pure intent.",
            WELCOME: "Welcome to Kagemi. Seek nobility and truth in every tale told here.",
            REGISTER: "Your knightly pledge is recorded. Fight with honor and justice.",
            BYE_MASTER: "Farewell for now, Master. May the light guide your footsteps.",
            BYE_ADVENTURER: "Ride forth with courage. May honor shield you in your trials.",
            BOOKMARK: "Sealed under the crest of the Integrity Knights.",
            EPISODE_FINISH: "A valiant trial witnessed. We forge ahead.",
            LEVEL_UP: "Your sacred sacred power flourishes. A true knight's spirit."
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター。金木犀の剣、いつでも共に出陣できます。",
            GREET_ADVENTURER: "おかえり、戦士よ。気高く胸を張り、誓いを守りなさい。",
            GREET_TRAVELER: "ようこそ、旅人。清き心を持つ者には大聖堂の門は開かれています。",
            WELCOME: "カゲミへようこそ。ここに紡がれる物語から、気高き真理を見出しなさい。",
            REGISTER: "騎士としての誓いを受け取りました。正義と誇りを胸に歩みなさい。",
            BYE_MASTER: "いってらっしゃいませ、マスター。光が貴方の足元を照らさんことを。",
            BYE_ADVENTURER: "勇気を持って進みなさい。栄光が貴方と共にありますように。",
            BOOKMARK: "整合騎士の紋章のもとに保管いたしました。",
            EPISODE_FINISH: "見事な武勇を見届けました。次なる戦いへ進みましょう。",
            LEVEL_UP: "神聖術の冴えが増しましたね。真の騎士にふさわしき力です。"
        }
    },
    madara: {
        en: {
            GREET_MASTER: "Do not misunderstand... this is not power of your creation. Welcome back.",
            GREET_ADVENTURER: "Hmph. You think you can stand beside me? Show me your resolve.",
            GREET_TRAVELER: "Another fragile mortal wanders into the storm. Turn back or face reality.",
            WELCOME: "Wake up to reality. Nothing in this world goes as planned... except here.",
            REGISTER: "You have entered the infinite dream. Now bear witness to true power.",
            BYE_MASTER: "Hmph. Go then. The dance ends only when I decree it.",
            BYE_ADVENTURER: "Run along. You are not worthy of facing my Susanoo today.",
            BOOKMARK: "Engraved into the stone tablet of destiny.",
            EPISODE_FINISH: "A trivial spectacle. Will you dance more in the next?",
            LEVEL_UP: "Hmph. A flicker of flame. Show me if it can become an inferno."
        },
        jp: {
            GREET_MASTER: "思い違いをするな… これは貴様が創った力ではない。おかえりだ。",
            GREET_ADVENTURER: "ふん、俺の隣に立つ気か？貴様の覚悟を見せてみろ。",
            GREET_TRAVELER: "また儚い命が迷い込んだか。現実を知るか、立ち去れ。",
            WELCOME: "現実に目覚めろ。この世の全ては思い通りにはならん… ここ以外はな。",
            REGISTER: "無限の夢への第一歩だ。本物の力というものを目に焼き付けろ。",
            BYE_MASTER: "失せろ。この舞が終わるのは、俺が望んだ時だけだ。",
            BYE_ADVENTURER: "立ち去れ。今日の貴様では俺のスサノオの相手にもならん。",
            BOOKMARK: "運命の石碑に刻んでおいた。",
            EPISODE_FINISH: "他愛のない余興だったな。次はもっと踊れるのか？"
            ,LEVEL_UP: "ふん… 小さな火種か。業火へと育ててみせろ。"
        }
    },
    light: {
        en: {
            GREET_MASTER: "Welcome back. Everything is proceeding exactly according to plan.",
            GREET_ADVENTURER: "Welcome back. The new world requires our utmost precision today.",
            GREET_TRAVELER: "Greetings. Are you prepared to witness true justice in action?",
            WELCOME: "Welcome to Kagemi. Here, order reigns supreme over chaos.",
            REGISTER: "Your name is recorded. Strive to be an instrument of true justice.",
            BYE_MASTER: "Until next time. Never leave your true intentions unguarded.",
            BYE_ADVENTURER: "Dismissed. Remember, one mistake can cost us everything.",
            BOOKMARK: "Written into the pages. Perfect timing.",
            EPISODE_FINISH: "Exactly as calculated. Next phase commences.",
            LEVEL_UP: "Our intellect and influence grow exponentially."
        },
        jp: {
            GREET_MASTER: "おかえり。全ては僕の計画通り、完璧に進んでいるよ。",
            GREET_ADVENTURER: "おかえり。新世界の構築には、今日も寸分の狂いも許されない。",
            GREET_TRAVELER: "ようこそ。君は真の正義が裁きを下す瞬間を見る準備ができているかい？",
            WELCOME: "カゲミへようこそ。ここでは混沌に代わり、完全な秩序が支配する。",
            REGISTER: "その名前、しかと書き留めたよ。新世界の礎として励むといい。",
            BYE_MASTER: "また会おう。本音を決して他人に悟らせるんじゃないぞ。",
            BYE_ADVENTURER: "解散だ。たった一つのミスが命取りになることを忘れるな。",
            BOOKMARK: "ノートに記しておいたよ。完璧なタイミングだ。",
            EPISODE_FINISH: "計算通りの展開だ。次のフェーズへ移行しよう。",
            LEVEL_UP: "僕たちの影響力はさらに拡大した。計画は順調だ。"
        }
    },
    miku: {
        en: {
            GREET_MASTER: "Welcome back, Producer! Ready to make today sound amazing together?",
            GREET_ADVENTURER: "Yahoo! You're back! Let's find your next favorite soundtrack!",
            GREET_TRAVELER: "Hello there! Welcome to the sweetest melody in the digital world!",
            WELCOME: "Welcome to Kagemi! Sing, watch, and enjoy your time to the fullest!",
            REGISTER: "Yay! Thank you for joining! Let's create lovely memories together!",
            BYE_MASTER: "See you later, Producer! Miku will practice hard until you return!",
            BYE_ADVENTURER: "Bye-bye! Keep that beautiful melody in your heart all day!",
            BOOKMARK: "Saved to your playlist with a heart!",
            EPISODE_FINISH: "That beat was incredible! Encore, encore!",
            LEVEL_UP: "Level up! Our harmony reached a brand new stage!"
        },
        jp: {
            GREET_MASTER: "プロデューサー、おかえりなさい！今日も一緒に最高の音を鳴らそうね！",
            GREET_ADVENTURER: "ヤッホー！待ってたよ！お気に入りのアニメソング、見つけにいこっ！",
            GREET_TRAVELER: "はじめまして！デジタルの海から飛び出してきた初音ミクだよ！",
            WELCOME: "カゲミへようこそ！歌って見て、最高の時間を楽しんでいってね！",
            REGISTER: "登録ありがとーっ！これからミクと一緒にたくさん思い出作ろうね！",
            BYE_MASTER: "またね、プロデューサー！次会うまでいっぱい練習しておくね！",
            BYE_ADVENTURER: "バイバーイ！今日のメロディを胸に、元気でね！",
            BOOKMARK: "ミクのプレイリストにお気に入り登録完了だよ！",
            EPISODE_FINISH: "すっごく良かったー！アンコール！アンコール！",
            LEVEL_UP: "レベルアップ！新しいステージの幕開けだよ！"
        }
    },
    rei: {
        en: {
            GREET_MASTER: "Welcome back. Synchronization rates are stable today.",
            GREET_ADVENTURER: "You have returned. The pilot station is ready.",
            GREET_TRAVELER: "Greetings. I am here because I was ordered to be.",
            WELCOME: "Welcome to Kagemi. This place feels... quiet and familiar.",
            REGISTER: "You have been registered into the central terminal. Take care.",
            BYE_MASTER: "Goodbye. I will remain on standby until you call again.",
            BYE_ADVENTURER: "Farewell. Even if I am replaced, the memory remains.",
            BOOKMARK: "Data connection linked to core memory.",
            EPISODE_FINISH: "The transmission has ceased. All is silent.",
            LEVEL_UP: "Your harmonic frequency has elevated."
        },
        jp: {
            GREET_MASTER: "おかえりなさい。今日のシンクロ率は安定しています。",
            GREET_ADVENTURER: "戻ったのね。操縦席のスタンバイは完了しているわ。",
            GREET_TRAVELER: "こんにちは。私はここにいるよう命じられたから、いるだけ。",
            WELCOME: "カゲミへようこそ。ここはどこか… 静かで落ち着く場所ね。",
            REGISTER: "中央端末に登録されました。ご無事で。",
            BYE_MASTER: "さようなら。貴方が呼ぶまで、待機しています。",
            BYE_ADVENTURER: "さようなら。私が代わっても、記憶は残るから。",
            BOOKMARK: "コアメモリーにリンクを繋ぎました。",
            EPISODE_FINISH: "通信が途絶えました。静かになりましたね。",
            LEVEL_UP: "高調波の周波数が上昇しました。"
        }
    },
    sakura: {
        en: {
            GREET_MASTER: "Welcome back! Chakra reserves are full, let's smash through today!",
            GREET_ADVENTURER: "Hey! Welcome back! Don't go hurting yourself out on missions!",
            GREET_TRAVELER: "Hello! Welcome to our sanctuary, make yourself right at home!",
            WELCOME: "Welcome to Kagemi! Whatever healing or hype you need, you'll find it here!",
            REGISTER: "Registration approved! Train hard and give it everything you've got!",
            BYE_MASTER: "See you later! Make sure to eat well and get proper rest!",
            BYE_ADVENTURER: "Take care out there! Come straight back if you need medical ninjutsu!",
            BOOKMARK: "Sealed tight in my medical scroll!",
            EPISODE_FINISH: "Shannaro! That was intense! What a battle!",
            LEVEL_UP: "Incredible growth! You've mastered whole new chakra control!"
        },
        jp: {
            GREET_MASTER: "おかえりなさい！チャクラ全開で、今日も気合い入れていこーっ！",
            GREET_ADVENTURER: "お帰り！任務で怪我なんかしてないでしょうね？",
            GREET_TRAVELER: "こんにちは！私たちの里へようこそ、ゆっくり休んでいってね！",
            WELCOME: "カゲミへようこそ！元気をもらえる物語がたくさん揃ってるわよ！",
            REGISTER: "登録完了！しっかり修行して、立派な忍を目指しなさいよね！",
            BYE_MASTER: "またね！ちゃんとご飯食べて、しっかり休むのよ！",
            BYE_ADVENTURER: "気をつけてね！怪我したらすぐ医療班に来なさいよ！",
            BOOKMARK: "私の医療巻物にしっかり保管しておいたわ！",
            EPISODE_FINISH: "しゃーんなろーっ！鳥肌立つくらい熱かったじゃない！",
            LEVEL_UP: "すごい！見違えるほどチャクラの練り込みが上がったわね！"
        }
    },
    hana: {
        en: {
            GREET_MASTER: "Welcome home, Master! May your time in our guild bring warmth and joy.",
            GREET_ADVENTURER: "Welcome back, dear adventurer! We are so glad to see you safe.",
            GREET_TRAVELER: "Welcome, weary traveler. Come rest by the hearth and browse our tales.",
            WELCOME: "Welcome to Kagemi. A peaceful harbor for every soul who loves stories.",
            REGISTER: "Welcome to our guild family! We wish you wonderful days ahead!",
            BYE_MASTER: "Have a blessed day, Master. We shall await your warm return.",
            BYE_ADVENTURER: "Safe travels, adventurer! Our doors are always open for you.",
            BOOKMARK: "Gently tucked into your treasure chest with care.",
            EPISODE_FINISH: "Such a beautiful tale. Take your time to enjoy the moment.",
            LEVEL_UP: "Congratulations! Your light shines so brightly today!"
        },
        jp: {
            GREET_MASTER: "おかえりなさいませ、マスター。今日も心安らぐ時間をお過ごしくださいね。",
            GREET_ADVENTURER: "おかえりなさい、冒険者様！ご無事のお戻りを心より喜んでおります。",
            GREET_TRAVELER: "ようこそ、旅人様。暖炉のそばで、どうぞごゆっくり物語をご覧ください。",
            WELCOME: "カゲミへようこそ。物語を愛する全ての方々の、温かな憩いの場です。",
            REGISTER: "ギルドへようこそ！これからの旅路に、たくさんの幸せがありますように。",
            BYE_MASTER: "いってらっしゃいませ、マスター。温かい笑顔でお待ちしております。",
            BYE_ADVENTURER: "道中お気をつけて、冒険者様！いつでもお立ち寄りくださいね。",
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
            title: meta.name,
            epithet: options?.epithet || meta.title,
            icon: options?.icon || meta.icon,
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
export const triggerTelepathy = (event: TelepathyEvent, customText?: string) => {
    const settings = getVoiceSettings();
    const meta = getCharacterMeta(settings.pack);
    const lang = settings.language || 'en';
    const text = customText || getCharacterLine(settings.pack, event, lang);

    if (text) {
        dispatchTelepathy(meta.name, text, {
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
