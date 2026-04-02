/**
 * era-npc-scripts.ts — Era-specific NPC conversation scripts.
 *
 * Replaces the generic CONVERSATION_TOPICS from npc-behavior.ts when
 * an era is selected. Each era has 8 conversation topics with era-appropriate
 * movie references, slang, and cultural context.
 */

import type { ConversationTopic } from './npc-behavior';
import { CONVERSATION_TOPICS } from './npc-behavior';

// ═══════════════════════════════════════════════════════════════
// §1 — LATE 80s (1987–1989)
// ═══════════════════════════════════════════════════════════════

const LATE_80S_TOPICS: ConversationTopic[] = [
  {
    id: 'late80s-movie-rec',
    label: 'Movie recommendation',
    lines: [
      "Dude, have you rented Die Hard yet? It just came out on tape.",
      "Is it any good? I heard it's just another action flick.",
      "No way, man. Bruce Willis is totally awesome in it. Best action movie this year, easy.",
      "Alright, I'm sold. If it's not rad, I'm blaming you.",
    ],
    minDuration: 8,
  },
  {
    id: 'late80s-weekend',
    label: 'Weekend plans',
    lines: [
      "Got any plans this weekend? I'm thinking movie marathon.",
      "Totally. I grabbed Rain Man and The Princess Bride. Double feature, baby.",
      "Gnarly combo. I'll bring the popcorn if you've got the VCR hooked up right.",
      "I just got a new four-head. Picture's crystal clear, dude.",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-late-fees',
    label: 'Late fees complaint',
    lines: [
      "Vinny just nailed me with a two dollar late fee. Can you believe that?",
      "Two bucks? That's like half a new rental. Bummer, dude.",
      "I totally forgot to rewind Dirty Dancing. My sister watched it three times.",
      "Everybody and their mom is renting that one. No wonder it was late.",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-genre-debate',
    label: 'Genre debate',
    lines: [
      "Action movies are king right now. Top Gun, Lethal Weapon, Predator... come on.",
      "Pssh. Horror is where it's at. Nightmare on Elm Street is totally tubular.",
      "Freddy Krueger gives me the creeps, man. I'd rather watch Maverick any day.",
      "You just can't handle it. That's the whole point of horror, bro.",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-laundry',
    label: 'Laundromat small talk',
    lines: [
      "These dryers take forever. I could've watched all of Batman by now.",
      "The new Batman? With Jack Nicholson? That movie is so sick.",
      "Nicholson as the Joker is totally genius casting. Best villain ever.",
      "I need to rewatch it. Maybe I'll rent it again after my clothes are done.",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-pizza',
    label: 'Pizza place small talk',
    lines: [
      "This pizza reminds me of the one in that Ninja Turtles cartoon. Cowabunga.",
      "Ha! My kid is obsessed with that show. Everything is 'radical' now.",
      "Hey, at least the lingo is bodacious. Better than whatever my parents say.",
      "Fair point. Pass me another slice, would ya?",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "I just bought a rewinder shaped like a sports car. Saves wear on the VCR.",
      "Those things actually work? I thought it was just a gimmick.",
      "Works great, man. Plus it looks totally rad sitting on top of my TV.",
      "I still just rewind by hand. Old school, baby.",
    ],
    minDuration: 10,
  },
  {
    id: 'late80s-regular',
    label: 'Being a regular',
    lines: [
      "Vinny had The Princess Bride saved behind the counter for me. Guy's a legend.",
      "He does that for you? I gotta start coming here more often.",
      "Every Friday, man. He knows my taste better than I do at this point.",
      "That's what a real video store is about. Not some chain, you know?",
    ],
    minDuration: 10,
  },
];

// ═══════════════════════════════════════════════════════════════
// §2 — EARLY 90s (1990–1993)
// ═══════════════════════════════════════════════════════════════

const EARLY_90S_TOPICS: ConversationTopic[] = [
  {
    id: 'early90s-movie-rec',
    label: 'Movie recommendation',
    lines: [
      "You gotta rent Terminator 2. The special effects are insane.",
      "The liquid metal guy? I saw the trailer. That looks unreal.",
      "It's not just effects though. Arnie actually acts in this one. No joke.",
      "Alright, I'm in. Hasta la vista, boring Friday night.",
    ],
    minDuration: 8,
  },
  {
    id: 'early90s-weekend',
    label: 'Weekend plans',
    lines: [
      "What are you up to this weekend? I need plans.",
      "Home Alone is on tape now. Getting the kids together for a watch party.",
      "That movie is hilarious. The paint can scene had me dying in the theater.",
      "I'll bring sodas. Just don't let the kids try any of those booby traps.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-late-fees',
    label: 'Late fees complaint',
    lines: [
      "I owe three bucks in late fees because Jurassic Park was checked out for a week.",
      "That's because everybody in town is trying to rent it. The waitlist is crazy.",
      "Vinny said I was number fourteen on the list. Fourteen! For one tape.",
      "They need to order more copies. This is getting ridiculous.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-genre-debate',
    label: 'Genre debate',
    lines: [
      "Silence of the Lambs proved thrillers are the best genre. Fight me.",
      "That movie freaked me out. I couldn't eat fava beans for a month.",
      "See, that's good filmmaking. A movie that sticks with you like that.",
      "I'll take Aladdin over nightmares, thanks. At least Genie makes me laugh.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-laundry',
    label: 'Laundromat small talk',
    lines: [
      "I spilled Gatorade all over my Starter jacket. That's why I'm here on a Friday.",
      "Oh no, not the Starter jacket. Those things are expensive.",
      "Tell me about it. If this stain doesn't come out, I'm toast.",
      "Try some OxiClean on it. My mom swears by that stuff.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-pizza',
    label: 'Pizza place small talk',
    lines: [
      "Did you catch the Bulls game last night? Jordan was unreal.",
      "Three-peat, baby! Nobody's stopping that team.",
      "I taped the whole game. Gonna watch the highlights after my pizza.",
      "Smart move. This pizza and Jordan highlights? Perfect Friday night.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "I've got like two hundred tapes at home now. Running out of shelf space.",
      "Same here. I built a whole rack in the living room just for movies.",
      "My wife says if I bring home one more tape, she's gonna snap.",
      "Just tell her it's an investment. These'll be worth something someday.",
    ],
    minDuration: 10,
  },
  {
    id: 'early90s-regular',
    label: 'Being a regular',
    lines: [
      "Vinny gave me a heads-up when Jurassic Park came in. I was first on the list.",
      "No way! I've been waiting two weeks. How'd you pull that off?",
      "I've been coming here since they opened. Loyalty has its perks.",
      "I gotta step up my game. Maybe I'll start renting on Tuesdays too.",
    ],
    minDuration: 10,
  },
];

// ═══════════════════════════════════════════════════════════════
// §3 — MID 90s (1994–1996)
// ═══════════════════════════════════════════════════════════════

const MID_90S_TOPICS: ConversationTopic[] = [
  {
    id: 'mid90s-movie-rec',
    label: 'Movie recommendation',
    lines: [
      "Pulp Fiction just hit the shelves. Have you seen it yet?",
      "Not yet. I heard it's kind of weird though. Like, nonlinear or whatever.",
      "It's Tarantino, man. The dialogue alone is worth the rental. Trust me.",
      "Alright, I'll grab it. But if it's too out there, I'm coming back for Forrest Gump.",
    ],
    minDuration: 8,
  },
  {
    id: 'mid90s-weekend',
    label: 'Weekend plans',
    lines: [
      "Any plans this weekend? I'm trying to find something the whole family can watch.",
      "Toy Story just came out on tape. My kids are begging for it.",
      "A cartoon made by computers? That's wild. Is it actually good?",
      "Dude, it's incredible. You'll like it more than your kids, I guarantee it.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-late-fees',
    label: 'Late fees complaint',
    lines: [
      "I had Shawshank Redemption for a week and didn't even mean to. It just sits there calling you back.",
      "I watched it twice in one night. No shame.",
      "Vinny charged me four bucks in late fees but said he understood.",
      "Some movies are worth the late fee. Shawshank is definitely one of them.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-genre-debate',
    label: 'Genre debate',
    lines: [
      "Independence Day is the best popcorn movie ever made. Will Smith is the man.",
      "It's fun, sure, but Forrest Gump is a masterpiece. There's a difference.",
      "Not everything has to be deep. Sometimes you just want aliens and explosions.",
      "Fair, but I cried during Forrest Gump. You can't make me cry with an alien movie.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-laundry',
    label: 'Laundromat small talk',
    lines: [
      "I got pizza grease all over my flannel. Figures.",
      "Flannel and pizza grease, name a more iconic duo.",
      "At least it wasn't my new JNCO jeans. Those things are impossible to wash.",
      "How do you even fit those in a machine? They're like parachutes.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-pizza',
    label: 'Pizza place small talk',
    lines: [
      "You ever notice this place feels like something out of a Tarantino movie?",
      "Ha, yeah. Two people talking about nothing over pizza. Very Pulp Fiction.",
      "Royale with cheese, am I right?",
      "See, now I want to rewatch it. You just cost me another three bucks.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "You know they're starting to sell these things called DVDs now?",
      "DVDs? Like those little shiny discs? No way that catches on.",
      "The picture is supposedly way better. No tracking issues.",
      "I don't care. There's something about popping in a tape that just feels right.",
    ],
    minDuration: 10,
  },
  {
    id: 'mid90s-regular',
    label: 'Being a regular',
    lines: [
      "Vinny set aside Pulp Fiction for me before it even hit the shelf. What a guy.",
      "He knows all the regulars by name. It's like Cheers but for movies.",
      "That's why I'll never go to Blockbuster. They don't know you there.",
      "Exactly. This place has soul. You can't franchise that.",
    ],
    minDuration: 10,
  },
];

// ═══════════════════════════════════════════════════════════════
// §4 — LATE 90s (1997–1999)
// ═══════════════════════════════════════════════════════════════

const LATE_90S_TOPICS: ConversationTopic[] = [
  {
    id: 'late90s-movie-rec',
    label: 'Movie recommendation',
    lines: [
      "Have you seen The Matrix yet? It completely blew my mind.",
      "The one with Keanu? I keep hearing about it but haven't rented it yet.",
      "You need to watch it on the biggest TV you can find. The bullet time stuff is unreal.",
      "Alright, I'll grab it tonight. If it's as good as you say, I owe you one.",
    ],
    minDuration: 8,
  },
  {
    id: 'late90s-weekend',
    label: 'Weekend plans',
    lines: [
      "What are you getting into this weekend?",
      "My girlfriend wants to rewatch Titanic. Again. That's three hours of my life.",
      "Dude, just go with it. At least the ship parts are cool.",
      "I guess. I'll sneak Fight Club for after she falls asleep.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-late-fees',
    label: 'Late fees complaint',
    lines: [
      "I got hit with late fees on The Sixth Sense. I kept it an extra day because of the twist.",
      "You rewatched it immediately, didn't you? Everyone does that.",
      "I had to! Once you know the ending, the whole movie changes. Every single scene.",
      "Worth the late fee. Vinny even said he did the same thing.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-genre-debate',
    label: 'Genre debate',
    lines: [
      "The Matrix is sci-fi, action, AND philosophy all in one. Genre debates are over.",
      "Please. Big Lebowski is funnier than anything else this decade. Comedy wins.",
      "The Dude is great, but Neo literally dodges bullets. In slow motion.",
      "The Dude abides, man. That's all I need. Way more chill than bullet dodging.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-laundry',
    label: 'Laundromat small talk',
    lines: [
      "I spilled Mountain Dew on my cargo pants. These pockets hold everything except dignity.",
      "Ha! At least you didn't get Surge on them. That stuff stains forever.",
      "True. I've got my Discman in one pocket and three tapes in the other while I wait.",
      "Living the dream, man. The late nineties are peak civilization.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-pizza',
    label: 'Pizza place small talk',
    lines: [
      "Did you hear they're worried about Y2K? Like, computers might shut down at midnight.",
      "My dad is stockpiling water bottles. I think he's overreacting.",
      "I just hope the video store's computer doesn't lose my rental history.",
      "Vinny keeps paper records anyway. Old school always wins.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "DVDs are taking over, man. They've got a whole section now.",
      "I don't trust them. What if they scratch? At least tapes are solid.",
      "The bonus features are cool though. Director commentary and deleted scenes.",
      "I'll stick with VHS until they pry the tape from my cold, dead hands.",
    ],
    minDuration: 10,
  },
  {
    id: 'late90s-regular',
    label: 'Being a regular',
    lines: [
      "Vinny says the store might have to start carrying more DVDs. Times are changing.",
      "As long as he keeps the VHS section, I'm happy. This place is an institution.",
      "He told me he'll never get rid of the tapes. Said it's not who he is.",
      "That's why Vinny is the best. Loyalty to the format. Respect.",
    ],
    minDuration: 10,
  },
];

// ═══════════════════════════════════════════════════════════════
// §5 — PRESENT DAY
// ═══════════════════════════════════════════════════════════════

const PRESENT_TOPICS: ConversationTopic[] = [
  {
    id: 'present-movie-rec',
    label: 'Movie recommendation',
    lines: [
      "I can't find anything good on streaming. There's too much stuff and none of it's great.",
      "That's why I come here. Vinny actually curates this place. It's like a museum.",
      "He recommended something last week that I never would've found on an algorithm.",
      "See? A human recommendation beats an algorithm every single time.",
    ],
    minDuration: 8,
  },
  {
    id: 'present-weekend',
    label: 'Weekend plans',
    lines: [
      "Any weekend plans? I'm thinking about doing a throwback movie night.",
      "Oh totally. I'm going full retro. VHS tapes, no phones, actual popcorn on the stove.",
      "That sounds amazing. Remember when that was just called a normal Friday?",
      "Now it's an event. We really took those days for granted.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-late-fees',
    label: 'Late fees complaint',
    lines: [
      "I'm paying ten bucks a month for three streaming services and I still come here.",
      "At least here, you actually watch what you rent. Streaming is just endless scrolling.",
      "I spent forty minutes last night scrolling and then just went to bed.",
      "Should've come here instead. Vinny would've had you out the door in five minutes with the perfect pick.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-genre-debate',
    label: 'Genre debate',
    lines: [
      "Everything now is sequels and reboots. Where's the original stuff?",
      "That's why I rewatch the classics. The nineties had it figured out.",
      "Remember when a movie could just be a movie? Not a cinematic universe?",
      "Exactly. Give me a standalone story with a beginning, middle, and end. That's all I ask.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-laundry',
    label: 'Laundromat small talk',
    lines: [
      "You know, it's kind of nice being here without my phone for once.",
      "Right? I left mine in the car on purpose. Just vibing with the dryer sounds.",
      "Remember when we used to just... sit places? Without scrolling?",
      "This laundromat is basically a digital detox. I should come here more often.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-pizza',
    label: 'Pizza place small talk',
    lines: [
      "This place hasn't changed since I was a kid. Same booths, same pizza smell.",
      "That's the appeal. Everything else changes. This stays the same.",
      "I brought my daughter here last week. She said it was like stepping into a movie.",
      "She's not wrong. This whole strip mall is a time capsule. I hope it never changes.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-nostalgia',
    label: 'VHS nostalgia',
    lines: [
      "I found a box of old VHS tapes in my parents' garage. Felt like finding buried treasure.",
      "Were they labeled? The best ones are the mystery tapes with handwritten labels.",
      "One of them was a recording of Saturday morning cartoons. Commercials and everything.",
      "That's priceless. You can't stream that. That's a moment in time on magnetic tape.",
    ],
    minDuration: 10,
  },
  {
    id: 'present-regular',
    label: 'Being a regular',
    lines: [
      "Vinny remembers every movie I've ever rented. No algorithm does that.",
      "He recommended something for my mood last week. Nailed it. How does he do that?",
      "Decades of practice. This place is his life's work.",
      "We gotta keep coming here. Places like this don't exist anymore.",
    ],
    minDuration: 10,
  },
];

// ═══════════════════════════════════════════════════════════════
// §6 — ERA MAP & PUBLIC API
// ═══════════════════════════════════════════════════════════════

const ERA_TOPICS: Record<string, ConversationTopic[]> = {
  late80s: LATE_80S_TOPICS,
  early90s: EARLY_90S_TOPICS,
  mid90s: MID_90S_TOPICS,
  late90s: LATE_90S_TOPICS,
  present: PRESENT_TOPICS,
};

/**
 * Get era-specific conversation topics for NPC-NPC conversations.
 * Falls back to the generic CONVERSATION_TOPICS if the era is unrecognized.
 */
export function getEraConversationTopics(eraId: string): ConversationTopic[] {
  return ERA_TOPICS[eraId] ?? CONVERSATION_TOPICS;
}
