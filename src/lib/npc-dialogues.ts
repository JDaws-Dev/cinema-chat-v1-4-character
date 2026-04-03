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

// ── TONY DIALOGUES (Pizza Palace clerk) ──────────────────

const TONY_DIALOGUES: DialogueTree[] = [
  {
    id: "tony_greeting_1",
    npc: "Tony",
    portrait: "T",
    opener: {
      speaker: "Tony",
      portrait: "T",
      text: "Hey, welcome to Pizza Palace! Best slice in the strip mall, guaranteed. What can I get ya?",
      responses: [
        {
          text: "What do you recommend?",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "Pepperoni. Always pepperoni. I've been making pies since I was fourteen and nothing beats a classic pepperoni slice straight out of the oven.",
            responses: [
              { text: "Pepperoni it is.", next: { speaker: "Tony", portrait: "T", text: "Coming right up! You won't regret it. I put a little extra cheese on there for the Friday crowd." } },
              { text: "What about something fancier?", next: { speaker: "Tony", portrait: "T", text: "Fancy? This ain't a French restaurant. But I do a mean sausage and mushroom if you're feeling adventurous." } },
              { text: "How long have you worked here?", next: { speaker: "Tony", portrait: "T", text: "Worked here? I built this place! Well, my uncle started it, and I took over. Going on fifteen years now. This oven is older than most of my customers." } },
            ],
          },
        },
        {
          text: "Busy night?",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "Friday nights are always crazy. Everybody rents a movie next door and then comes in here for a pie. I'm not complaining — keeps the lights on and the dough spinning.",
            responses: [
              { text: "You and Vinny must do good business together.", next: { speaker: "Tony", portrait: "T", text: "Oh yeah, me and Vinny go way back. He sends people over here, I tell people to rent from him. Everybody wins. That's how a strip mall's supposed to work." } },
              { text: "I can see why. Smells amazing.", next: { speaker: "Tony", portrait: "T", text: "That's the good olive oil. My aunt ships it from the old country. Secret ingredient, but I just told you, so keep it between us." } },
              { text: "Must be tiring.", next: { speaker: "Tony", portrait: "T", text: "Nah, I love it. Standing on my feet all night making pizza for good people? There's worse ways to spend a Friday." } },
            ],
          },
        },
        {
          text: "Just looking at the menu.",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "Take your time. But between you and me, you can't go wrong with anything on there. I wouldn't serve it if I wouldn't eat it myself.",
          },
        },
      ],
    },
  },
  {
    id: "tony_movies_1",
    npc: "Tony",
    portrait: "T",
    opener: {
      speaker: "Tony",
      portrait: "T",
      text: "You know, soon as I close up tonight, I'm heading next door to grab a movie. Nothing beats pizza and a movie after a long shift.",
      responses: [
        {
          text: "What are you watching tonight?",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "I've had my eye on this action flick all week. Something with car chases and explosions. After eight hours of rolling dough, I need something loud.",
            responses: [
              { text: "Action is the best genre.", next: { speaker: "Tony", portrait: "T", text: "Finally, someone who gets it! Give me a good action movie, a cold drink, and a leftover slice, and that's a perfect Friday night." } },
              { text: "Ever watch anything quieter?", next: { speaker: "Tony", portrait: "T", text: "Quieter? I fall asleep in five minutes if it's not loud enough. Last time I tried a drama I woke up on the couch at 3 AM with the menu screen looping." } },
              { text: "You rent from Vinny?", next: { speaker: "Tony", portrait: "T", text: "Always. Vinny's the only guy I trust with movie picks. Plus he gives me a discount for keeping him fed. Fair trade if you ask me." } },
            ],
          },
        },
        {
          text: "What's your favorite genre?",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "Action, no question. The bigger the explosions, the better. I grew up on all those classics. There's nothing like a good chase scene to wind down after work.",
            responses: [
              { text: "Any favorites?", next: { speaker: "Tony", portrait: "T", text: "Too many to count. But if I had to pick one to watch forever, it'd be Die Hard. Perfect movie. Don't even try to argue with me on that." } },
              { text: "I would have guessed cooking shows.", next: { speaker: "Tony", portrait: "T", text: "Ha! I get enough cooking in real life. When I sit down I want to see stuff blowing up, not someone julienning onions." } },
            ],
          },
        },
        {
          text: "Don't you get tired of this strip mall?",
          next: {
            speaker: "Tony",
            portrait: "T",
            text: "Tired of it? This is my whole world, pal. Pizza Palace, Vinny's shop, Earl's laundromat. Everything I need is right here on this block. Why would I go anywhere else?",
          },
        },
      ],
    },
  },
];

// ── EARL DIALOGUES (Laundromat attendant) ────────────────

const EARL_DIALOGUES: DialogueTree[] = [
  {
    id: "earl_greeting_1",
    npc: "Earl",
    portrait: "E",
    opener: {
      speaker: "Earl",
      portrait: "E",
      text: "Well hey there. Welcome to the laundromat. Machines are all working today, which is something of a miracle.",
      responses: [
        {
          text: "How do the machines work?",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "Quarters in the slot, dial to the right, press the button. Same as they've always worked. If one starts making a funny noise, just give it a tap on the side. They respond to a gentle touch.",
            responses: [
              { text: "Sounds like you know them pretty well.", next: { speaker: "Earl", portrait: "E", text: "I've been fixing these machines longer than most people have been alive. Each one's got its own personality. Number four likes to rattle, but she gets the job done." } },
              { text: "Any machines I should avoid?", next: { speaker: "Earl", portrait: "E", text: "Number seven runs a little hot. Good for towels, bad for anything you care about. Stick with three or five — those are my reliable ones." } },
              { text: "Thanks for the tip.", next: { speaker: "Earl", portrait: "E", text: "Anytime. That's what I'm here for. Well, that and reading my magazines." } },
            ],
          },
        },
        {
          text: "How long have you been here?",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "Longer than the machines, longer than the strip mall, longer than just about everything on this block. I was here when they poured the parking lot. Watched the whole neighborhood grow up.",
            responses: [
              { text: "That's incredible.", next: { speaker: "Earl", portrait: "E", text: "It's just life. You stay in one place long enough, you become part of the furniture. And I mean that in the best way." } },
              { text: "You must have seen a lot of changes.", next: { speaker: "Earl", portrait: "E", text: "Shops come and go, but people stay the same. Everybody needs clean clothes. That's job security right there." } },
              { text: "Don't you get bored?", next: { speaker: "Earl", portrait: "E", text: "Bored? Never. I've got my magazines, my regulars, and the hum of the machines. It's peaceful. Most people spend their whole lives looking for peace, and here I am sitting in it." } },
            ],
          },
        },
        {
          text: "Nice place.",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "It does the job. Clean, warm, and the fluorescent lights never go out. Plus I keep a stack of magazines by the chairs if you need something to read while you wait. Help yourself.",
          },
        },
      ],
    },
  },
  {
    id: "earl_stories_1",
    npc: "Earl",
    portrait: "E",
    opener: {
      speaker: "Earl",
      portrait: "E",
      text: "You know, you hear a lot of stories working in a place like this. The machines spin, people talk, and I just listen.",
      responses: [
        {
          text: "What's the weirdest thing someone left in a machine?",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "A bowling trophy. Full-size, gold-plated, wedged right in the drum. The woman came back three days later like nothing happened. Said she forgot it was in her gym bag.",
            responses: [
              { text: "No way.", next: { speaker: "Earl", portrait: "E", text: "I couldn't make this stuff up if I tried. I've also found a harmonica, two wallets, and a love letter that was never sent. That last one stuck with me." } },
              { text: "Did the machine survive?", next: { speaker: "Earl", portrait: "E", text: "Machine five has a dent in the drum to this day. Still works though. Like I said, they're tough old girls." } },
              { text: "That's amazing.", next: { speaker: "Earl", portrait: "E", text: "Every machine in here has a story if you listen close enough. The spin cycle covers up a lot, but not everything." } },
            ],
          },
        },
        {
          text: "Any regulars I should know about?",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "There's one fella who comes in every Friday like clockwork. Same time, same machine, same detergent. Been doing it for years. We nod at each other. That's our whole relationship.",
            responses: [
              { text: "That's kind of nice.", next: { speaker: "Earl", portrait: "E", text: "It is. You don't always need words. Sometimes a nod is worth more than a conversation. He knows I'm here, I know he's here. That's enough." } },
              { text: "Does he ever talk?", next: { speaker: "Earl", portrait: "E", text: "Once. He said 'machine three is making a noise.' I fixed it. He nodded. That was our deepest conversation in five years." } },
            ],
          },
        },
        {
          text: "You seem pretty relaxed about everything.",
          next: {
            speaker: "Earl",
            portrait: "E",
            text: "Patience. That's the secret. Everything in here takes time. The wash cycle, the dry cycle, getting a stain out. You can't rush any of it. Life's the same way if you think about it.",
            responses: [
              { text: "That's actually really wise.", next: { speaker: "Earl", portrait: "E", text: "Wise? I'm just a guy who watches machines spin all day. But if something useful came out of it, well, that's a bonus." } },
              { text: "I could use more patience.", next: { speaker: "Earl", portrait: "E", text: "Everybody could. Sit down, watch a cycle go. You'd be surprised how much you figure out when you stop trying to figure things out." } },
              { text: "I bet you've got more where that came from.", next: { speaker: "Earl", portrait: "E", text: "I've got enough wisdom to fill a dryer. But I'll save some for next time. Can't give it all away in one visit." } },
            ],
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
    portrait: "C",
    opener: {
      speaker: "Customer",
      portrait: "C",
      text: "Okay, we need help. She wants Romance. I want Action. We've been standing here for twenty minutes and we're about to just go home.",
      responses: [
        {
          text: "I'll find something you'll both love.",
          questStart: "date_night_dilemma",
          next: {
            speaker: "Customer",
            portrait: "C",
            text: "Really? You'd do that? Check Romance for her, Action for me, then maybe Comedy or Thriller for a compromise. Come back when you've got something!",
          },
        },
        {
          text: "Comedy is usually the safe bet.",
          questStart: "date_night_dilemma",
          next: {
            speaker: "Customer",
            portrait: "C",
            text: "You know what, that's smart. But check the other sections too — I want to feel like we explored our options. Report back!",
          },
        },
        {
          text: "Just flip a coin.",
          next: {
            speaker: "Customer",
            portrait: "C",
            text: "We tried that. She said best two out of three. Then three out of five. We're still here.",
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
  {
    id: "quest_family_movie_night",
    npc: "Customer",
    portrait: "P",
    opener: {
      speaker: "Customer",
      portrait: "P",
      text: "I need to plan the perfect family movie night. The kids want something fun, I want something I won't fall asleep during. Can you help me pick?",
      responses: [
        {
          text: "I'll check Family and Comedy for you.",
          questStart: "family_movie_night",
          next: {
            speaker: "Customer",
            portrait: "P",
            text: "You're a saint. Browse the Family section, maybe Comedy too for backups, and come tell me what looks good. I'll be here — I'm not going anywhere with these kids.",
          },
        },
        {
          text: "Just get the animated one. Kids always love those.",
          next: {
            speaker: "Customer",
            portrait: "P",
            text: "Which animated one? There's like twelve of them. That's the problem! I need someone to narrow it down for me.",
          },
        },
        {
          text: "Good luck with that.",
          next: {
            speaker: "Customer",
            portrait: "P",
            text: "Thanks for nothing! ...I'm kidding. Sort of.",
          },
        },
      ],
    },
  },
  {
    id: "quest_critics_challenge",
    npc: "Customer",
    portrait: "X",
    opener: {
      speaker: "Customer",
      portrait: "X",
      text: "I've been to every video store in town. None of them have anything worth watching. Prove me wrong.",
      responses: [
        {
          text: "Challenge accepted. I'll build you a list.",
          questStart: "critics_challenge",
          next: {
            speaker: "Customer",
            portrait: "X",
            text: "Fine. Browse Drama, Classics, Sci-Fi, and Thriller. If you can find something genuinely excellent in each, I'll admit this store isn't a complete waste of time.",
          },
        },
        {
          text: "Maybe the problem is your taste, not the store.",
          next: {
            speaker: "Customer",
            portrait: "X",
            text: "...Excuse me? I have a subscription to three film journals. But fine — impress me. I dare you.",
            responses: [
              {
                text: "I'll take that dare.",
                questStart: "critics_challenge",
                next: {
                  speaker: "Customer",
                  portrait: "X",
                  text: "Drama, Classics, Sci-Fi, Thriller. Four genres. Find something excellent in each. Then we'll talk.",
                },
              },
              {
                text: "Not worth my time.",
                next: {
                  speaker: "Customer",
                  portrait: "X",
                  text: "That's what I thought.",
                },
              },
            ],
          },
        },
      ],
    },
  },
  {
    id: "quest_scare_me",
    npc: "Customer",
    portrait: "T",
    opener: {
      speaker: "Customer",
      portrait: "T",
      text: "My friends say I'm impossible to scare. I've seen every horror movie twice and I didn't even flinch. Find me something that'll actually keep me up tonight.",
      responses: [
        {
          text: "I know just the sections. Give me a minute.",
          questStart: "scare_me",
          next: {
            speaker: "Customer",
            portrait: "T",
            text: "Check Horror obviously, but also Thriller — sometimes the psychological stuff is scarier than the slasher stuff. Come back with your best shot!",
          },
        },
        {
          text: "Nothing scares you? Not even late fees?",
          next: {
            speaker: "Customer",
            portrait: "T",
            text: "Ha! Okay, Vinny's late fees are pretty terrifying. But seriously — find me something good. Horror and Thriller sections. I'll wait.",
            responses: [
              {
                text: "Alright, I'm on it.",
                questStart: "scare_me",
                next: {
                  speaker: "Customer",
                  portrait: "T",
                  text: "Now we're talking! Go check Horror and Thriller and bring me your scariest pick.",
                },
              },
            ],
          },
        },
        {
          text: "I don't do horror.",
          next: {
            speaker: "Customer",
            portrait: "T",
            text: "...Seriously? You work in a video store and you don't do horror? That's the scariest thing I've heard all night.",
          },
        },
      ],
    },
  },
];

// ── CHARLIE TRIVIA ───────────────────────────────────────────

const TRIVIA_QUESTIONS = [
  { q: "What year was Jaws released?", a: "1975", wrong: ["1973", "1977", "1979"] },
  { q: "Who directed The Godfather?", a: "Francis Ford Coppola", wrong: ["Martin Scorsese", "Steven Spielberg", "Brian De Palma"] },
  { q: "What's the highest grossing film of the 80s?", a: "E.T.", wrong: ["Star Wars", "Indiana Jones", "Back to the Future"] },
  { q: "Who played the Terminator?", a: "Arnold Schwarzenegger", wrong: ["Sylvester Stallone", "Bruce Willis", "Chuck Norris"] },
  { q: "What was the first Pixar movie?", a: "Toy Story", wrong: ["A Bug's Life", "Finding Nemo", "Monsters Inc"] },
  { q: "Who directed Jurassic Park?", a: "Steven Spielberg", wrong: ["James Cameron", "Ridley Scott", "George Lucas"] },
  { q: "What year was The Matrix released?", a: "1999", wrong: ["1997", "1998", "2000"] },
  { q: "Who played Forrest Gump?", a: "Tom Hanks", wrong: ["Robin Williams", "Jim Carrey", "Bill Murray"] },
];

export function generateTriviaDialogue(): DialogueTree {
  const q = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
  const options = [q.a, ...q.wrong].sort(() => Math.random() - 0.5);

  return {
    id: "charlie_trivia",
    npc: "Charlie",
    portrait: "C",
    opener: {
      speaker: "Charlie",
      portrait: "C",
      text: `Pop quiz! ${q.q}`,
      responses: options.map(opt => ({
        text: opt,
        questComplete: opt === q.a ? "trivia_correct" : undefined,
        next: {
          speaker: "Charlie",
          portrait: "C",
          text: opt === q.a
            ? "That's right! You know your movies. Here's some XP for that."
            : `Nope! It's ${q.a}. Better luck next time!`,
        }
      }))
    }
  };
}

// ── VINNY REPUTATION-AWARE DIALOGUE ──────────────────────────

import { getVinnyReputation } from "./game-state";

/** Movies Vinny can recommend — title must match shelf titles for tracking */
const VINNY_RECOMMENDATIONS = [
  "Groundhog Day", "Field of Dreams", "Alien", "The Thing",
  "Escape from New York", "Big Trouble in Little China",
  "Raiders of the Lost Ark", "Die Hard",
];

export function getVinnyRecommendation(): string {
  return VINNY_RECOMMENDATIONS[Math.floor(Math.random() * VINNY_RECOMMENDATIONS.length)];
}

export function generateVinnyRepDialogue(recommendedMovie: string): DialogueTree {
  const rep = getVinnyReputation();
  let repLine: string;
  if (rep.followed > rep.ignored) {
    repLine = "You've got great taste! Always trust my picks.";
  } else if (rep.ignored > rep.followed * 2) {
    repLine = "You never take my recommendations! What's wrong with my taste?";
  } else {
    repLine = "So, gonna trust me this time?";
  }

  return {
    id: "vinny_recommendation",
    npc: "Vinny",
    portrait: "V",
    opener: {
      speaker: "Vinny",
      portrait: "V",
      text: `${repLine} Tonight I'd say you gotta check out ${recommendedMovie}. Absolute classic.`,
      responses: [
        {
          text: `I'll grab ${recommendedMovie}!`,
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Now that's what I like to hear. You won't regret it.",
          },
        },
        {
          text: "I'll think about it.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Don't think too long — someone else might snag it.",
          },
        },
        {
          text: "Not really my thing.",
          next: {
            speaker: "Vinny",
            portrait: "V",
            text: "Your loss! But hey, there's plenty more where that came from.",
          },
        },
      ],
    },
  };
}

// ── RELATIONSHIP-AWARE GREETINGS ─────────────────────────────

const RELATIONSHIP_GREETINGS: Record<string, { repeat: string[]; regular: string[] }> = {
  customer: {
    repeat: [
      "Hey, I remember you!",
      "Oh hey, you're that person from before!",
      "Wait, didn't I see you earlier?",
    ],
    regular: [
      "My favorite person to talk to! Got any recommendations for ME this time?",
      "You again! At this point we should exchange numbers.",
      "Hey, my movie buddy! What are we watching tonight?",
    ],
  },
  charlie: {
    repeat: [
      "Hey, welcome back! Still browsing?",
      "Oh hey, I remember you! Good to see a fellow movie nerd.",
    ],
    regular: [
      "My favorite customer! I saved a recommendation just for you.",
      "You're here more than I am! Got any picks for me this time?",
      "The usual? Just kidding, I know you like variety.",
    ],
  },
  vinny: {
    repeat: [
      "Back so soon? Can't stay away, huh?",
      "Hey, I know that face. Welcome back.",
    ],
    regular: [
      "The VIP returns! What'll it be tonight?",
      "My number one customer! I set aside something special for you.",
      "At this point I should put your name on a shelf. What are we watching?",
    ],
  },
};

/** Get a relationship-aware greeting prefix for an NPC type, or null if first meeting (level 0) */
export function getRelationshipGreeting(npcType: string, relationshipLevel: number): string | null {
  const greetings = RELATIONSHIP_GREETINGS[npcType];
  if (!greetings) return null;
  if (relationshipLevel >= 3 && greetings.regular.length > 0) {
    return greetings.regular[Math.floor(Math.random() * greetings.regular.length)];
  }
  if (relationshipLevel >= 1 && greetings.repeat.length > 0) {
    return greetings.repeat[Math.floor(Math.random() * greetings.repeat.length)];
  }
  return null; // First meeting — use normal dialogue
}

// ── PUBLIC API ──────────────────────────────────────────────

const ALL_DIALOGUES: Record<string, DialogueTree[]> = {
  vinny: VINNY_DIALOGUES,
  charlie: CHARLIE_DIALOGUES,
  customer: CUSTOMER_DIALOGUES,
  tony: TONY_DIALOGUES,
  earl: EARL_DIALOGUES,
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

/** Get a random dialogue tree for a named NPC (Tony or Earl) */
export function getNamedNpcDialogue(npcType: "tony" | "earl"): DialogueTree {
  const pool = ALL_DIALOGUES[npcType];
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

// ── Tier-aware Vinny greetings ──────────────────────────────

const VINNY_TIER_GREETINGS: Record<string, string[]> = {
  Bronze: [
    "Hey, new face! Welcome to Friday Night Video.",
    "First time here? Take a look around — we got something for everyone.",
  ],
  Silver: [
    "Welcome back! Good to see a regular.",
    "Hey, you're becoming a familiar face around here. Nice.",
  ],
  Gold: [
    "My favorite customer! What are we watching tonight?",
    "The gold member returns! I saved some good stuff for you.",
  ],
  Platinum: [
    "The VIP is here! Want to see the back room?",
    "Platinum member in the house! Say the word and I'll pull the special shelf.",
  ],
};

/** Get a tier-appropriate greeting for Vinny, given the player's membership tier name */
export function getVinnyTierGreeting(tierName: string): string {
  const greetings = VINNY_TIER_GREETINGS[tierName] || VINNY_TIER_GREETINGS.Bronze;
  return greetings[Math.floor(Math.random() * greetings.length)];
}
