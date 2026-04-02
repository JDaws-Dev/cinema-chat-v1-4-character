/**
 * npc-customer-dialogues.ts — Rich personality-driven dialogue trees for customer NPCs.
 *
 * Generates multi-branch RPG dialogues based on NPC personality type.
 * Each personality gets unique conversation topics, reactions, and response chains.
 * Replaces the generic 3-option dialogue that all customers shared.
 */

import type { DialogueTree, DialogueNode } from './npc-dialogues';
import type { NpcPersonality, PersonalityType } from './npc-personalities';
import { PERSONALITIES } from './npc-personalities';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Dialogue templates per personality ─────────────────────────

interface CustomerDialogueTemplate {
  /** The main question/topic the player can ask about */
  playerPrompt: string;
  /** NPC's response */
  npcResponse: string;
  /** Optional follow-up from the player */
  followUp?: { playerText: string; npcText: string };
}

const MOVIE_BUFF_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "That's like asking which star is the brightest. But if I had to pick... check the classics section. There's a reason they're classics.",
    followUp: { playerText: "What's your all-time favorite?", npcText: "Changes every week. Right now? Anything by Kubrick. The man was a perfectionist." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "I watch at least three a week. Have been since I was twelve. My friends think I'm obsessed. They're right.",
    followUp: { playerText: "What genre should I start with?", npcText: "Start with thrillers. They teach you about pacing. Then work your way to dramas for character. That's film school in two sections." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "Go to the back of the drama section. The stuff nobody rents? That's where the gold is. Studios buried some masterpieces.",
    followUp: { playerText: "Like what?", npcText: "I'm not gonna spoil the hunt. Half the fun is discovering them yourself. Trust me." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "Half of them are sequels nobody asked for. But there's one or two gems up there if you look past the marketing.",
  },
];

const PARENT_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Trying to find something the whole family can watch. You'd think it'd be easy but my kids have... opinions.",
    followUp: { playerText: "How old are they?", npcText: "Seven and ten. The seven-year-old wants cartoons, the ten-year-old thinks he's too cool for cartoons. Every Friday, same argument." },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "Is it that obvious? I've been here twenty minutes and I still haven't picked anything. The kids are in the car.",
    followUp: { playerText: "Need a recommendation?", npcText: "Something with adventure, no scary parts, and short enough that they don't fall asleep. Is that too much to ask?" },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "They LOVE movies. Problem is they want to watch the same one every single night. I've seen that cartoon a hundred times.",
    followUp: { playerText: "Which one?", npcText: "I'm not saying the title because if I hear that song one more time, I'm returning the tape and the VCR." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "Pizza, movie, kids asleep by nine. That's the dream. Reality is pizza on the floor, movie paused eighteen times, kids asleep by eleven.",
  },
];

const TEENAGER_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "Something with explosions. Or aliens. Or alien explosions. I'm not picky.",
    followUp: { playerText: "Ever try anything slower?", npcText: "I watched a drama once. Almost fell asleep. Life's too short for movies where nothing blows up." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "Every Friday with my friends. We rent like four movies and only finish one. The rest are background noise.",
    followUp: { playerText: "What'd you watch last week?", npcText: "Dude, I don't even remember. Something with a car chase? It was awesome though." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "I've seen every horror movie on that shelf. None of them scare me anymore. ...Okay, one of them did. But I'm not telling you which one.",
    followUp: { playerText: "Come on, which one?", npcText: "Nope. My reputation is at stake. I told my friends I didn't flinch." },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "Thanks! Got it at the mall. You should see the jacket I almost bought. Way too expensive though.",
  },
];

const COUPLE_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "We NEVER agree. I want action, they want romance. We've been standing here for fifteen minutes.",
    followUp: { playerText: "Try a comedy?", npcText: "...That's actually genius. Why didn't we think of that? Comedy it is. Thank you." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "Every Friday. It's our thing. Rent a movie, make popcorn, argue about what to watch, fall asleep halfway through. Romance!",
    followUp: { playerText: "Sounds perfect actually.", npcText: "It really is. Don't tell anyone, but this is the best part of my week." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "I'd have to think... Actually, we both loved that one with the heist. We watched it twice.",
    followUp: { playerText: "Heist movies are great.", npcText: "Right? There's something about a good plan coming together. Even if it all falls apart by act three." },
  },
];

const REGULAR_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "Rain or shine. Vinny saves my favorites behind the counter sometimes. That's the VIP treatment.",
    followUp: { playerText: "What's your go-to genre?", npcText: "I rotate. Action month, comedy month, drama month. Keeps it fresh. Right now I'm on a thriller kick." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "Honestly? The new releases are solid this week. Grabbed one last Friday and it was actually good. Doesn't always happen.",
    followUp: { playerText: "Which one?", npcText: "Check the wall — it's the one with the blue cover. You'll know it when you see it. Trust me." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny and I go way back. He's the reason I keep coming. Other stores don't have someone who actually knows movies.",
    followUp: { playerText: "He seems like a good guy.", npcText: "The best. He once stayed open late just so I could finish picking. Where else does that happen?" },
  },
];

const NEWBIE_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Is it that obvious? I don't really know how this works. Do I just... grab one?",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "Oh, okay. That's easier than I thought. There's so many though. How do you even choose?" },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "Yes! Please. I don't know any of these movies. My friend told me to come here but didn't tell me what to get.",
    followUp: { playerText: "What kind of mood are you in?", npcText: "I just want something fun. Not too long. Nothing that'll make me cry. Is that specific enough?" },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "Honestly? Boredom. There's nothing on TV and someone said this place is cool. They weren't wrong — look at all these movies.",
  },
];

const CRITIC_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Define 'good.' Most of what's on these shelves is derivative at best. But I suppose that's what sells.",
    followUp: { playerText: "What meets your standards?", npcText: "Foreign cinema. Anything before 1975. And maybe — MAYBE — two things from this decade. I'm being generous." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "The selection is... acceptable. The organization could use work. But at least they stock some real cinema alongside the popcorn movies.",
    followUp: { playerText: "You seem tough to impress.", npcText: "I prefer 'discerning.' There's a difference. Anyone can like everything. It takes taste to be selective." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "I rewatched a Bergman film last week. It reminded me that most modern filmmakers have completely forgotten what cinema is for.",
    followUp: { playerText: "And what is it for?", npcText: "To make you uncomfortable. To challenge you. Not to sell action figures." },
  },
];

const KID_TOPICS: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "EVERYTHING! I want the one with the dinosaurs AND the one with the space ships AND the one with the dog!",
    followUp: { playerText: "You can only rent a few though.", npcText: "Awww. Okay fine. But can I come back tomorrow for the others?" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "Yeah, my mom is over there. She said I could pick ONE movie. But I found FIVE good ones!",
    followUp: { playerText: "Which one's your favorite?", npcText: "The one with the robot! No wait, the one with the talking animals! No wait..." },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "I LOVE movies! I watch one every day after school. My favorite part is the popcorn though.",
  },
];

const TOPICS_BY_PERSONALITY: Record<PersonalityType, CustomerDialogueTemplate[]> = {
  movie_buff: MOVIE_BUFF_TOPICS,
  parent: PARENT_TOPICS,
  teenager: TEENAGER_TOPICS,
  couple: COUPLE_TOPICS,
  regular: REGULAR_TOPICS,
  newbie: NEWBIE_TOPICS,
  kid: KID_TOPICS,
  critic: CRITIC_TOPICS,
};

// ── Build a rich dialogue tree from templates ──────────────────

export function buildCustomerDialogue(
  personality: NpcPersonality,
  npcName: string,
  relationshipLevel: number,
  canFreeChat: boolean,
): DialogueTree {
  const portrait = personality.type[0].toUpperCase();
  const templates = TOPICS_BY_PERSONALITY[personality.type] || REGULAR_TOPICS;

  // Pick 3 random topics (no duplicates)
  const shuffled = [...templates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);

  const responses = selected.map((t) => {
    const baseNext: DialogueNode = {
      speaker: npcName,
      portrait,
      text: t.npcResponse,
      responses: t.followUp
        ? [
            {
              text: t.followUp.playerText,
              next: { speaker: npcName, portrait, text: t.followUp.npcText },
            },
            {
              text: "Thanks, see you around.",
              next: { speaker: npcName, portrait, text: "Later!" },
            },
          ]
        : undefined,
    };
    return { text: t.playerPrompt, next: baseNext };
  });

  // Always add a leave option
  responses.push({
    text: "See you around.",
    next: { speaker: npcName, portrait, text: pick(["Happy browsing!", "See ya!", "Have a good night!", "Later!", "Enjoy the movie!"]) },
  });

  // Freeform chat unlocked at Gold (passed in as flag)
  if (canFreeChat) {
    responses.push({
      text: "Chat freely...",
      next: { speaker: npcName, portrait, text: "__OPEN_FREEFORM_CHAT__" },
    });
  }

  // Relationship-aware greeting
  const greeting = pick(personality.greetings);
  const relPrefix = relationshipLevel >= 3
    ? pick(["Hey, it's you again! ", "Oh hey! ", "Welcome back! "])
    : relationshipLevel >= 1
    ? pick(["Oh, hi! ", "Hey there. "])
    : "";

  const opener: DialogueNode = {
    speaker: npcName,
    portrait,
    text: relPrefix + greeting,
    responses,
  };

  return {
    id: `customer_${personality.type}_${Date.now()}`,
    npc: npcName,
    portrait,
    opener,
  };
}
