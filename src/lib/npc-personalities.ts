// NPC Personality Template Engine
// Each NPC in the store gets assigned a personality that affects their dialogue,
// reactions, and behavior. Personalities are era-agnostic archetypes — the era
// system (era-conversations.ts) handles period-specific movie references.

export type PersonalityType = 'movie_buff' | 'parent' | 'couple' | 'teenager' | 'regular' | 'newbie' | 'kid' | 'critic';

export interface NpcPersonality {
  type: PersonalityType;
  name: string;
  traits: string[];
  voiceStyle: string; // for future TTS voice selection
  greetings: string[]; // things they say when you first interact
  reactions: Record<string, string[]>; // genre -> reaction lines
}

export const PERSONALITIES: Record<PersonalityType, NpcPersonality> = {
  movie_buff: {
    type: 'movie_buff',
    name: 'Movie Buff',
    traits: ['knows directors', 'references cinematography', 'strong opinions'],
    voiceStyle: 'confident',
    greetings: [
      "Oh, another cinephile! Have you seen the Criterion section?",
      "I've been coming here since they opened. I know every shelf.",
      "You know what separates a good movie from a great one? The third act.",
    ],
    reactions: {
      HORROR: ["The practical effects in the 80s horror were unmatched.", "Jump scares are lazy. Real horror is psychological."],
      COMEDY: ["Comedy is the hardest genre to get right.", "If it doesn't have good timing, it's not comedy."],
      ACTION: ["The stunts in these are incredible when you realize they're real.", "Action without character development is just noise."],
      DRAMA: ["This is where the real acting lives.", "Every Best Picture winner is in this section for a reason."],
      SCI_FI: ["Science fiction is the literature of ideas. Always has been.", "The best sci-fi makes you think about the present, not the future."],
      WESTERN: ["The American epic. Nothing else comes close.", "A good western is really a character study with horses."],
      THRILLER: ["Hitchcock set the template. Everyone since is just riffing.", "The best thrillers don't need a single explosion."],
      CLASSICS: ["This is where cinema lives. Everything else is just movies.", "You can't appreciate film without knowing the classics."],
    },
  },
  parent: {
    type: 'parent',
    name: 'Parent',
    traits: ['looking for family content', 'tired', 'budget conscious'],
    voiceStyle: 'warm',
    greetings: [
      "Please tell me you have something the WHOLE family can watch.",
      "I've got 30 minutes before the kids lose it. Help me pick something fast.",
      "Anything rated G or PG? That's all I'm allowed to rent apparently.",
    ],
    reactions: {
      FAMILY: ["Oh thank goodness, this section exists.", "My kids will actually sit still for this one."],
      HORROR: ["Absolutely not. I'll have nightmares, never mind the kids.", "My 8-year-old asked for this. I said no."],
      COMEDY: ["As long as it's clean. The kids repeat EVERYTHING.", "A good family comedy is worth its weight in gold."],
      ANIMATED: ["Disney is a lifesaver on long weekends.", "We've seen this one twelve times. I can quote the whole thing."],
      ACTION: ["Too much violence for the little ones.", "Maybe when they're older. Maybe."],
      DRAMA: ["I'd love to watch this... alone... someday.", "This is my secret rental when the kids are at grandma's."],
    },
  },
  teenager: {
    type: 'teenager',
    name: 'Teenager',
    traits: ['excited', 'wants action or horror', 'quotes movies constantly'],
    voiceStyle: 'energetic',
    greetings: [
      "Dude, have you SEEN the new releases wall? So many good ones.",
      "My friends said I HAD to rent this one. Where is it?",
      "I've got five bucks. What's the best movie I can get?",
    ],
    reactions: {
      ACTION: ["The explosions in this one are INSANE.", "This is gonna be so good with surround sound."],
      HORROR: ["My friend said they couldn't sleep for a week after this.", "I'm not scared. I'm totally not scared."],
      SCI_FI: ["The special effects are so cool!", "I want to live in this universe."],
      COMEDY: ["I heard this one is hilarious.", "My whole friend group is quoting this."],
      ROMANCE: ["Ugh, my girlfriend is making me watch this.", "...okay it's actually not that bad. Don't tell anyone."],
      DRAMA: ["Is this one of those movies where nothing happens?", "My teacher said this was important. Sounds boring."],
    },
  },
  couple: {
    type: 'couple',
    name: 'Couple',
    traits: ['can never agree', 'playful arguing', 'compromise'],
    voiceStyle: 'dual',
    greetings: [
      "We've been here twenty minutes and still can't agree.",
      "I want romance, he wants explosions. Same argument every Friday.",
      "We need a tiebreaker. What do YOU think we should watch?",
    ],
    reactions: {
      ROMANCE: ["See? This is what I'm talking about!", "...if we HAVE to."],
      ACTION: ["Now THIS is a movie.", "If I have to watch another car chase..."],
      COMEDY: ["Okay, comedy works for both of us.", "Finally something we agree on!"],
      HORROR: ["We can hold hands during the scary parts!", "I am NOT watching this. Last time I couldn't sleep."],
      DRAMA: ["This could work for both of us.", "As long as it's not three hours long."],
      THRILLER: ["Ooh, a thriller could be fun for date night.", "As long as it's not too gory."],
    },
  },
  regular: {
    type: 'regular',
    name: 'Regular',
    traits: ['knows the store', 'comfort picks', 'chats with Vinny'],
    voiceStyle: 'relaxed',
    greetings: [
      "Same time every Friday. You know the drill.",
      "Vinny already has my usual ready behind the counter.",
      "I could navigate this store blindfolded at this point.",
    ],
    reactions: {
      ACTION: ["I've rented this one before. Holds up every time."],
      COMEDY: ["This is my comfort pick. Never gets old."],
      DRAMA: ["Vinny recommended this last week. He was right, as usual."],
      HORROR: ["I save the scary ones for October. It's tradition."],
    },
  },
  newbie: {
    type: 'newbie',
    name: 'Newbie',
    traits: ['overwhelmed', 'needs help', 'asking lots of questions'],
    voiceStyle: 'hesitant',
    greetings: [
      "This is my first time here. Where do I even start?",
      "There are so many movies... how do you pick just one?",
      "Do I need a membership card or something?",
    ],
    reactions: {
      ACTION: ["Is this one good? I've never heard of it."],
      COMEDY: ["My friend recommended something in this section..."],
      HORROR: ["These covers are kind of scary. Is the movie scarier?"],
      FAMILY: ["Oh, this looks safe. I'll start here."],
      DRAMA: ["What makes a movie a 'drama' exactly?"],
    },
  },
  kid: {
    type: 'kid',
    name: 'Kid',
    traits: ['wants everything', 'short attention span', 'excited'],
    voiceStyle: 'childlike',
    greetings: [
      "Can we get THIS one? And THIS one? And THIS one?",
      "Mom said I can pick ONE. But I want three.",
      "Where are the cartoons?",
    ],
    reactions: {
      ANIMATED: ["I LOVE this one! Can we get it? Please please please?", "This is the best movie EVER!"],
      FAMILY: ["This looks fun! Is it funny?", "My friend has this one at home!"],
      HORROR: ["Is this scary? I don't want nightmares again.", "My big brother watches these. He says they're cool."],
      ACTION: ["Woah, look at that cover! Explosions!", "Is this the one with the robots?"],
      COMEDY: ["Is this the funny one? I want the funny one!"],
    },
  },
  critic: {
    type: 'critic',
    name: 'Critic',
    traits: ['nothing is good enough', 'compares to originals', 'sighs a lot'],
    voiceStyle: 'condescending',
    greetings: [
      "Is there anything here that hasn't been done better by someone else?",
      "I've seen everything worth seeing. Prove me wrong.",
      "The original was better. It's always better.",
    ],
    reactions: {
      DRAMA: ["Adequate, I suppose. Not Kubrick, but adequate.", "This won an award? The bar has really dropped."],
      COMEDY: ["Comedy peaked in the 70s. Everything since is derivative.", "I suppose this passes for humor these days."],
      ACTION: ["Mindless entertainment. But sometimes that's all you can hope for.", "The choreography is competent. Nothing more."],
      HORROR: ["Horror is the most honest genre. It knows what it is.", "At least horror doesn't pretend to be art. Usually."],
      SCI_FI: ["The source material was better.", "They simplified the concept for mass appeal. As always."],
      CLASSICS: ["Finally, something with actual craft.", "This is from when they still knew how to make films."],
      ROMANCE: ["Sentimental drivel. But I understand the appeal... for some people."],
    },
  },
};

// Personality types suitable for adult NPCs (excludes kid)
const ADULT_PERSONALITIES: PersonalityType[] = ['movie_buff', 'parent', 'couple', 'teenager', 'regular', 'newbie', 'critic'];

/**
 * Pick a random personality for an adult NPC.
 * Excludes 'kid' since that's assigned to the KidCustomer component.
 */
export function getRandomAdultPersonality(): NpcPersonality {
  const type = ADULT_PERSONALITIES[Math.floor(Math.random() * ADULT_PERSONALITIES.length)];
  return PERSONALITIES[type];
}

/** Pick a random personality from all types */
export function getRandomPersonality(): NpcPersonality {
  const types = Object.keys(PERSONALITIES) as PersonalityType[];
  return PERSONALITIES[types[Math.floor(Math.random() * types.length)]];
}

/** Get a random greeting for a personality */
export function getPersonalityGreeting(p: NpcPersonality): string {
  return p.greetings[Math.floor(Math.random() * p.greetings.length)];
}

/** Get a genre-specific reaction, or null if this personality has none for the genre */
export function getGenreReaction(p: NpcPersonality, genre: string): string | null {
  // Try exact match first, then normalized (replace hyphens/spaces with underscores, uppercase)
  const normalized = genre.replace(/[-\s]/g, '_').toUpperCase();
  const reactions = p.reactions[genre] || p.reactions[normalized];
  if (!reactions || reactions.length === 0) return null;
  return reactions[Math.floor(Math.random() * reactions.length)];
}

/** Get the display name for an NPC based on personality */
export function getPersonalityLabel(p: NpcPersonality): string {
  switch (p.type) {
    case 'movie_buff': return 'Talk to Movie Buff';
    case 'parent': return 'Talk to Parent';
    case 'couple': return 'Talk to Couple';
    case 'teenager': return 'Talk to Teenager';
    case 'regular': return 'Talk to Regular';
    case 'newbie': return 'Talk to Newcomer';
    case 'kid': return 'Talk to Kid';
    case 'critic': return 'Talk to Critic';
    default: return 'Talk to Customer';
  }
}
