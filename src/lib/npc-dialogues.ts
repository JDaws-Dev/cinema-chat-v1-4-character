// RPG-style dialogue trees for NPC interactions
// Each NPC has multiple conversation starters with 3-4 player response options

export interface DialogueNode {
  speaker: string;
  portrait?: string; // emoji or short label
  text: string;
  responses?: DialogueResponse[];
}

export interface DialogueResponse {
  text: string;
  next: DialogueNode; // what the NPC says after this response
  questStart?: string; // starts a side quest with this ID when chosen
  questComplete?: string; // completes a side quest with this ID when chosen
}

export interface DialogueTree {
  id: string;
  npc: string;
  portrait: string;
  opener: DialogueNode;
}

// ── VINNY DIALOGUES ────────────────────────────────────────

const VINNY_DIALOGUES: DialogueTree[] = [
  {
    id: "vinny_greeting_1",
    npc: "Vinny",
    portrait: "V",
    opener: {
      speaker: "Vinny",
      portrait: "V",
      text: "Hey! Welcome to Friday Night Video. What can I do for ya?",
      responses: [
        {
          text: "What's good tonight?",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Oh man, where do I start? We just got a fresh batch of new releases in. Check the back wall. If you want my personal pick, grab anything with Kurt Russell in it.",
            responses: [
              { text: "Kurt Russell? Really?", next: { speaker: "Vinny", portrait: "V", text: "The Thing, Escape from New York, Big Trouble in Little China? The man is a national treasure. Trust me." } },
              { text: "I'll check the back wall.", next: { speaker: "Vinny", portrait: "V", text: "That's the move. You won't be disappointed." } },
              { text: "Got anything scary?", next: { speaker: "Vinny", portrait: "V", text: "Horror's two aisles over. We got Alien, The Shining, Poltergeist... the good stuff. Not that cheap slasher junk." } },
            ],
          },
        },
        {
          text: "Just browsing.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Take your time! The shelves are organized by genre. Pro tip: the best stuff is always eye-level. We put the duds up top where nobody looks.",
          },
        },
        {
          text: "Know anything about the challenges?",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Oh, you want to play Movie Night? Check the sign by the door. Pick a challenge and I'll give you a list of movies to find on the shelves. Find 'em all and bring 'em back to me.",
            responses: [
              { text: "Sounds fun. I'm in.", next: { speaker: "Vinny", portrait: "V", text: "That's the spirit! Head to the challenge board by the front door when you're ready." } },
              { text: "What do I win?", next: { speaker: "Vinny", portrait: "V", text: "Bragging rights. And maybe some movie props for your collection shelf. Complete enough challenges and you'll unlock the good stuff." } },
              { text: "Maybe later.", next: { speaker: "Vinny", portrait: "V", text: "No rush. The store's open all night." } },
            ],
          },
        },
        {
          text: "Nice store you got here.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Thanks! Built it with my own two hands. Well, mostly. Charlie helped with the shelves. Don't tell him I said that, his head's big enough already.",
          },
        },
      ],
    },
  },
  {
    id: "vinny_movies_1",
    npc: "Vinny",
    portrait: "V",
    opener: {
      speaker: "Vinny",
      portrait: "V",
      text: "Back again? You know, you're becoming one of my regulars. That's a compliment, by the way.",
      responses: [
        {
          text: "What's your all-time favorite movie?",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Raiders of the Lost Ark. No contest. Spielberg, Harrison Ford, that boulder scene? Come on. It doesn't get better than that.",
            responses: [
              { text: "Mine too!", next: { speaker: "Vinny", portrait: "V", text: "A person of taste! You and I are gonna get along just fine." } },
              { text: "I'm more of a Star Wars person.", next: { speaker: "Vinny", portrait: "V", text: "Can't argue with that. Empire Strikes Back is top five for sure. But Indy... Indy's got the hat." } },
              { text: "Never seen it.", next: { speaker: "Vinny", portrait: "V", text: "NEVER SEEN-- okay. Okay. We're fixing that tonight. Action aisle, second shelf, right side. Go. Now." } },
            ],
          },
        },
        {
          text: "Recommend something I haven't seen.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Alright, what kind of mood are we talking? Wanna laugh, cry, or hide behind a pillow?",
            responses: [
              { text: "Make me laugh.", next: { speaker: "Vinny", portrait: "V", text: "Groundhog Day. Bill Murray at his absolute best. You'll be quoting it for weeks." } },
              { text: "Something emotional.", next: { speaker: "Vinny", portrait: "V", text: "Field of Dreams. Bring tissues. I'm not kidding, I cry every single time. 'Hey Dad, wanna have a catch?' Gets me right here." } },
              { text: "Scare me.", next: { speaker: "Vinny", portrait: "V", text: "Alien. The original. Don't watch the sequels first, don't read anything about it, just pop it in and turn the lights off. Trust me." } },
            ],
          },
        },
        {
          text: "How's business?",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Friday nights are always slammed. Everybody wants the same five movies. If one more person asks me if we have Home Alone, I swear...",
            responses: [
              { text: "Do you have Home Alone?", next: { speaker: "Vinny", portrait: "V", text: "...I walked right into that one, didn't I. Yeah, family section. Go nuts." } },
              { text: "That's the price of fame.", next: { speaker: "Vinny", portrait: "V", text: "Ha! Fame. I run a video store. But hey, it's an honest living and I get to talk movies all day. Can't complain." } },
            ],
          },
        },
      ],
    },
  },
  {
    id: "vinny_trivia_1",
    npc: "Vinny",
    portrait: "V",
    opener: {
      speaker: "Vinny",
      portrait: "V",
      text: "Alright, pop quiz. Let's see if you actually know your movies or if you're just renting whatever's got the coolest cover.",
      responses: [
        {
          text: "Bring it on.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "What year did Back to the Future come out? And don't you dare say 2015.",
            responses: [
              { text: "1985.", next: { speaker: "Vinny", portrait: "V", text: "Nailed it! July 3rd, 1985. A great year for cinema. And for DeLoreans." } },
              { text: "1984?", next: { speaker: "Vinny", portrait: "V", text: "Close! 1985. But '84 gave us Ghostbusters and Gremlins, so no shame." } },
              { text: "I have no idea.", next: { speaker: "Vinny", portrait: "V", text: "1985, my friend. Same year as The Goonies. What a time to be alive." } },
            ],
          },
        },
        {
          text: "I don't do trivia.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Fair enough. But between you and me, trivia nights are the best part of this job. Come back when you're feeling brave.",
          },
        },
        {
          text: "Only if there's a prize.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "The prize is the smug satisfaction of knowing more about movies than everyone else in this store. Including Charlie. Especially Charlie.",
          },
        },
      ],
    },
  },
];

// ── CHARLIE DIALOGUES ──────────────────────────────────────

const CHARLIE_DIALOGUES: DialogueTree[] = [
  {
    id: "charlie_greeting_1",
    npc: "Charlie",
    portrait: "C",
    opener: {
      speaker: "Charlie",
      portrait: "C",
      text: "Oh hey! Need help finding something? I know where everything is. Mostly.",
      responses: [
        {
          text: "What do you recommend?",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "Okay, don't tell Vinny I said this, but the sci-fi section is way better than he thinks. We just got Blade Runner back in stock.",
            responses: [
              { text: "Blade Runner is a masterpiece.", next: { speaker: "Charlie", portrait: "C", text: "THANK you. Vinny thinks it's 'too slow.' The man has no patience for atmosphere." } },
              { text: "I prefer action movies.", next: { speaker: "Charlie", portrait: "C", text: "Nothing wrong with that! Check the action aisle. We've got Die Hard, Lethal Weapon, Predator... all the classics." } },
              { text: "What else is in sci-fi?", next: { speaker: "Charlie", portrait: "C", text: "E.T., Aliens, The Terminator, Total Recall... it's stacked right now. Friday's the best day to come in before everything gets rented out." } },
            ],
          },
        },
        {
          text: "Who are you?",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "I'm Charlie! I help Vinny run the place. He does the counter, I handle the shelves. Someone's gotta keep these tapes in order.",
            responses: [
              { text: "You guys been here long?", next: { speaker: "Charlie", portrait: "C", text: "Vinny opened the store in '88. I started a year later. We were both film students who never left. No regrets." } },
              { text: "Do you like working here?", next: { speaker: "Charlie", portrait: "C", text: "Are you kidding? I get paid to talk about movies all day. This is the dream. Low-paying dream, but still." } },
            ],
          },
        },
        {
          text: "Just looking around.",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "No worries! If you need anything, I'm usually wandering the aisles. It's a small store, you can't miss me.",
          },
        },
        {
          text: "Got any hidden gems?",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "Bottom shelf, classics section. Nobody ever looks down there. That's where we keep the real good stuff. Vinny calls it the 'Charlie shelf' because I curated it myself.",
            responses: [
              { text: "I'll check it out.", next: { speaker: "Charlie", portrait: "C", text: "You won't regret it. And if you find something you love, come tell me. I live for that." } },
              { text: "What's your favorite down there?", next: { speaker: "Charlie", portrait: "C", text: "12 Angry Men. One room, twelve guys, pure cinema. It'll change how you think about movies." } },
            ],
          },
        },
      ],
    },
  },
  {
    id: "charlie_challenge_help",
    npc: "Charlie",
    portrait: "C",
    opener: {
      speaker: "Charlie",
      portrait: "C",
      text: "Working on a challenge? I can point you in the right direction. Vinny says I give too many hints, but that's just because he likes watching people struggle.",
      responses: [
        {
          text: "Yeah, I need a hint.",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "Check the genre labels on each aisle. The movies are always in their genre section. Look at the VHS spines carefully, the titles are right there.",
            responses: [
              { text: "Thanks, Charlie.", next: { speaker: "Charlie", portrait: "C", text: "Anytime! And hey, if you finish fast enough, Vinny might be impressed. He won't show it, but he will be." } },
              { text: "Can you just tell me where it is?", next: { speaker: "Charlie", portrait: "C", text: "Now where's the fun in that? I believe in you. Get in there and look with your eyes." } },
            ],
          },
        },
        {
          text: "Nah, just chatting.",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "Fair enough! I'm always down to talk. It gets quiet between the Friday rush waves.",
          },
        },
        {
          text: "The challenges are too easy.",
          next: {
            speaker: "Charlie",
            portrait: "C",
            text: "Oh really? Try the Speed Run. Sixty seconds, three movies. Let's see how easy you think it is then.",
          },
        },
      ],
    },
  },
];

// ── CUSTOMER DIALOGUES (overheard / brief interactions) ────

const CUSTOMER_DIALOGUES: DialogueTree[] = [
  {
    id: "customer_browse_1",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "Hey, excuse me, do you work here? Oh wait, you don't. Sorry. This place is a maze.",
      responses: [
        {
          text: "It's not that big.",
          next: { speaker: "Customer", portrait: "?", text: "Maybe not, but I've been looking for the comedy section for ten minutes. My wife sent me here with a list and zero directions." },
        },
        {
          text: "Try asking Vinny at the counter.",
          next: { speaker: "Customer", portrait: "?", text: "The guy with the attitude? He told me to 'explore.' I think he just wants to watch me wander." },
        },
        {
          text: "What are you looking for?",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "My wife wants Sleepless in Seattle and I want anything with explosions. We're gonna need two tapes tonight.",
            responses: [
              { text: "Compromise: Speed.", next: { speaker: "Customer", portrait: "?", text: "Keanu and a bus? That's... actually perfect. Thanks, stranger." } },
              { text: "Get both. It's Friday.", next: { speaker: "Customer", portrait: "?", text: "You know what, you're right. Friday means double feature. I like the way you think." } },
            ],
          },
        },
      ],
    },
  },
  {
    id: "customer_horror_buff",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "Oh man, have you seen the new Wes Craven? This section is my happy place.",
      responses: [
        {
          text: "What would you recommend?",
          next: { speaker: "Customer", portrait: "?", text: "You HAVE to try Scream. It changed the game." },
        },
        {
          text: "Im more of a comedy person.",
          next: { speaker: "Customer", portrait: "?", text: "Comedy? In the horror aisle? Bold. Try Shaun of the Dead." },
        },
        {
          text: "Just browsing.",
          next: { speaker: "Customer", portrait: "?", text: "Same here. Could be here all night." },
        },
      ],
    },
  },
  {
    id: "customer_overwhelmed_mom",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "I need something the WHOLE family can watch. Any ideas?",
      responses: [
        {
          text: "Try the Family section.",
          next: { speaker: "Customer", portrait: "?", text: "Thats what I keep telling my kids but they want action movies!" },
        },
        {
          text: "Homeward Bound is great.",
          next: { speaker: "Customer", portrait: "?", text: "Oh that one makes me cry every time. Perfect." },
        },
        {
          text: "How about a classic?",
          next: { speaker: "Customer", portrait: "?", text: "Good idea. Maybe Wizard of Oz. Nobody argues with Oz." },
        },
      ],
    },
  },
  {
    id: "customer_indecisive_couple",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "My partner and I can NEVER agree on a movie. What do you pick on date night?",
      responses: [
        {
          text: "Something funny.",
          next: { speaker: "Customer", portrait: "?", text: "Smart. Laughing together is always a win." },
        },
        {
          text: "Let them choose.",
          next: { speaker: "Customer", portrait: "?", text: "Ha! Then Id be watching romantic dramas every Friday." },
        },
        {
          text: "Flip a coin.",
          next: { speaker: "Customer", portrait: "?", text: "Honestly? Thats not the worst idea Ive heard tonight." },
        },
      ],
    },
  },
];

// ── CUSTOMER SIDE QUEST DIALOGUES ─────────────────────────

const CUSTOMER_QUEST_DIALOGUES: DialogueTree[] = [
  {
    id: "quest_help_me_find_it",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "I'm looking for that movie with the guy... you know, the one with the car chase? It's on the tip of my tongue.",
      responses: [
        {
          text: "I'll help you look!",
          questStart: "help_me_find_it",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Really? You're a lifesaver. I think it was in the Action section. Grab something from there and bring it back to me — I'll know it when I see it!",
          },
        },
        {
          text: "Try asking at the counter.",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "I already did. The counter guy just shrugged. Some help he is.",
          },
        },
        {
          text: "Good luck with that.",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Yeah... I might be here a while.",
          },
        },
      ],
    },
  },
  {
    id: "quest_date_night",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "My partner wants a romance but I want horror. Can you find something we'd both enjoy?",
      responses: [
        {
          text: "Let me check the Comedy section.",
          questStart: "date_night_dilemma",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Comedy? That's actually genius — we both like to laugh. Go check the Comedy section and let me know what you find!",
          },
        },
        {
          text: "Just watch both.",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Double feature? On a Friday? ...Actually that's not a bad idea.",
          },
        },
        {
          text: "Horror is always the answer.",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Ha! I wish my partner agreed with you.",
          },
        },
      ],
    },
  },
  {
    id: "quest_kids_pick",
    npc: "Kid",
    portrait: "K",
    opener: {
      speaker: "Kid",
      portrait: "K",
      text: "My mom said I can only get a Family movie but I REALLY want to see that scary one. Can you help me convince her?",
      responses: [
        {
          text: "Your mom's right — Family section has great stuff!",
          questStart: "kids_pick_family",
          next: {
            speaker: "Kid",
            portrait: "K",
            text: "Ughhh fine. But only if you go find me something REALLY cool from the Family section. Deal?",
          },
        },
        {
          text: "What scary movie?",
          next: {
            speaker: "Kid",
            portrait: "K",
            text: "The one with the clown on the cover! My friend Tommy said it's SO cool. But mom said absolutely not.",
            responses: [
              {
                text: "Yeah, listen to your mom on this one.",
                questStart: "kids_pick_family",
                next: {
                  speaker: "Kid",
                  portrait: "K",
                  text: "Everyone always says that! Fine — go grab me something from Family. But it better be good!",
                },
              },
              {
                text: "Maybe when you're older.",
                next: {
                  speaker: "Kid",
                  portrait: "K",
                  text: "That's what EVERYONE says. Being a kid is the worst.",
                },
              },
            ],
          },
        },
        {
          text: "Sorry kid, can't help you there.",
          next: {
            speaker: "Kid",
            portrait: "K",
            text: "Aw man. Nobody ever takes my side.",
          },
        },
      ],
    },
  },
  {
    id: "quest_trivia_bet",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "Hey, I bet you $5 you can't name the director of Jaws. Go on, take a guess.",
      responses: [
        {
          text: "Steven Spielberg.",
          questComplete: "trivia_bet",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "No way... you actually knew that? Alright, fair's fair. Here's your five bucks. You really know your movies!",
          },
        },
        {
          text: "Ridley Scott?",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Ha! It's Spielberg! Steven Spielberg. Better luck next time, kid.",
          },
        },
        {
          text: "I don't gamble.",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Smart. But just so you know, it's Spielberg. The answer is always Spielberg.",
          },
        },
      ],
    },
  },
  {
    id: "quest_return_run",
    npc: "Customer",
    portrait: "?",
    opener: {
      speaker: "Customer",
      portrait: "?",
      text: "Oh no, I forgot to return my tape and it's overdue! I can't go back out there — can you take it to the return slot for me?",
      responses: [
        {
          text: "Sure, I'll run it over.",
          questStart: "return_run",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "You're a lifesaver! Just take it to the video return window outside. The one with the big yellow sign. I owe you one!",
          },
        },
        {
          text: "That's not really my job...",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "I know, I know. But the late fees here are brutal! Vinny charges by the HOUR on Fridays.",
          },
        },
        {
          text: "How overdue is it?",
          next: {
            speaker: "Customer",
            portrait: "?",
            text: "Let's just say I've had it since last Friday. Vinny's gonna kill me. Please help!",
            responses: [
              {
                text: "Alright, I'll do it.",
                questStart: "return_run",
                next: {
                  speaker: "Customer",
                  portrait: "?",
                  text: "Thank you SO much! The video return window is outside — look for the yellow sign!",
                },
              },
              {
                text: "You're on your own.",
                next: {
                  speaker: "Customer",
                  portrait: "?",
                  text: "Fair enough. Guess I'll face Vinny's wrath myself...",
                },
              },
            ],
          },
        },
      ],
    },
  },
];

// ── PUBLIC API ──────────────────────────────────────────────

const ALL_DIALOGUES: Record<string, DialogueTree[]> = {
  vinny: VINNY_DIALOGUES,
  charlie: CHARLIE_DIALOGUES,
  customer: CUSTOMER_DIALOGUES,
};

const usedDialogues = new Set<string>();

export function getRandomDialogue(npc: string): DialogueTree {
  const pool = ALL_DIALOGUES[npc] || VINNY_DIALOGUES;
  // Prefer unseen dialogues
  const unseen = pool.filter(d => !usedDialogues.has(d.id));
  const pick = unseen.length > 0
    ? unseen[Math.floor(Math.random() * unseen.length)]
    : pool[Math.floor(Math.random() * pool.length)];
  usedDialogues.add(pick.id);
  return pick;
}

/** Get a random customer side quest dialogue (filters out completed quests) */
export function getRandomQuestDialogue(completedQuests: string[]): DialogueTree | null {
  const available = CUSTOMER_QUEST_DIALOGUES.filter(d => {
    // Extract quest IDs from this dialogue tree's responses
    const questIds = extractQuestIds(d.opener);
    // Skip if ALL quests in this dialogue are already completed
    return questIds.length === 0 || !questIds.every(id => completedQuests.includes(id));
  });
  if (available.length === 0) return null;
  const unseen = available.filter(d => !usedDialogues.has(d.id));
  const pool = unseen.length > 0 ? unseen : available;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  usedDialogues.add(pick.id);
  return pick;
}

/** Recursively extract all questStart/questComplete IDs from a dialogue node */
function extractQuestIds(node: DialogueNode): string[] {
  const ids: string[] = [];
  if (node.responses) {
    for (const resp of node.responses) {
      if (resp.questStart) ids.push(resp.questStart);
      if (resp.questComplete) ids.push(resp.questComplete);
      ids.push(...extractQuestIds(resp.next));
    }
  }
  return ids;
}
