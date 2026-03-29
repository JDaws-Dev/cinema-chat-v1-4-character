// NPC conversations overheard in the store
// Each conversation is a back-and-forth between two customers

export interface ConversationLine {
  speaker: string; // "Customer" | "Friend" | etc.
  text: string;
  delay: number; // ms before this line appears (from conversation start)
}

export interface NPCConversation {
  id: string;
  zone: string; // which area of the store this plays in
  lines: ConversationLine[];
}

export const NPC_CONVERSATIONS: NPCConversation[] = [
  {
    id: "shark_movie",
    zone: "horror",
    lines: [
      { speaker: "Customer", text: "What's that movie with the shark?", delay: 0 },
      { speaker: "Friend", text: "Jaws? The Spielberg one?", delay: 2500 },
      { speaker: "Customer", text: "Yeah! Is it actually scary?", delay: 4500 },
      { speaker: "Friend", text: "You'll never swim in the ocean again.", delay: 6500 },
    ],
  },
  {
    id: "date_night",
    zone: "romance",
    lines: [
      { speaker: "Customer", text: "We need something for date night.", delay: 0 },
      { speaker: "Friend", text: "How about Titanic?", delay: 2000 },
      { speaker: "Customer", text: "We've seen it like five times.", delay: 4000 },
      { speaker: "Friend", text: "And you cried every time.", delay: 5500 },
      { speaker: "Customer", text: "...it's a good movie, okay?", delay: 7500 },
    ],
  },
  {
    id: "scary_kid",
    zone: "horror",
    lines: [
      { speaker: "Teen", text: "Dude, we should get The Shining.", delay: 0 },
      { speaker: "Friend", text: "Last time you watched a horror movie you slept with the lights on.", delay: 2500 },
      { speaker: "Teen", text: "That was Gremlins. Gremlins is different.", delay: 5000 },
      { speaker: "Friend", text: "Gremlins is rated PG.", delay: 7000 },
    ],
  },
  {
    id: "scifi_debate",
    zone: "scifi",
    lines: [
      { speaker: "Customer", text: "Star Wars or Star Trek?", delay: 0 },
      { speaker: "Friend", text: "That's like asking pizza or tacos. Both.", delay: 2500 },
      { speaker: "Customer", text: "But if you had to pick ONE.", delay: 4500 },
      { speaker: "Friend", text: "...Wars. But don't tell my dad.", delay: 6500 },
    ],
  },
  {
    id: "rewind_fee",
    zone: "counter",
    lines: [
      { speaker: "Customer", text: "How much is the late fee?", delay: 0 },
      { speaker: "Vinny", text: "Dollar fifty a day, mate.", delay: 2000 },
      { speaker: "Customer", text: "I've had it for two weeks...", delay: 4000 },
      { speaker: "Vinny", text: "Crikey. That's gonna be twenty-one bucks.", delay: 5500 },
      { speaker: "Customer", text: "Maybe I should just buy it.", delay: 7500 },
    ],
  },
  {
    id: "classic_argument",
    zone: "classics",
    lines: [
      { speaker: "Dad", text: "Now THIS is a real movie. Casablanca.", delay: 0 },
      { speaker: "Kid", text: "Dad, it's in black and white.", delay: 2500 },
      { speaker: "Dad", text: "So?", delay: 4000 },
      { speaker: "Kid", text: "So I want to rent Space Jam.", delay: 5000 },
      { speaker: "Dad", text: "We're getting both.", delay: 6500 },
    ],
  },
  {
    id: "sequel_talk",
    zone: "action",
    lines: [
      { speaker: "Customer", text: "Did you see they're making another Terminator?", delay: 0 },
      { speaker: "Friend", text: "How many is that now? Like six?", delay: 2500 },
      { speaker: "Customer", text: "They should've stopped after T2.", delay: 4500 },
      { speaker: "Friend", text: "T2 is perfect. You can't top perfection.", delay: 6500 },
    ],
  },
  {
    id: "family_pick",
    zone: "family",
    lines: [
      { speaker: "Mom", text: "The kids want The Lion King again.", delay: 0 },
      { speaker: "Dad", text: "Again? We just watched it Tuesday.", delay: 2500 },
      { speaker: "Mom", text: "Try telling a five-year-old no.", delay: 4500 },
      { speaker: "Dad", text: "Fine. But I get to pick the snacks.", delay: 6500 },
    ],
  },
  {
    id: "twist_ending",
    zone: "thriller",
    lines: [
      { speaker: "Customer", text: "Have you seen The Sixth Sense?", delay: 0 },
      { speaker: "Friend", text: "NO! Don't spoil it!", delay: 2000 },
      { speaker: "Customer", text: "I wasn't going to! Just watch it.", delay: 3500 },
      { speaker: "Friend", text: "Is it the kind of twist where you have to watch it twice?", delay: 5500 },
      { speaker: "Customer", text: "Oh, you'll DEFINITELY watch it twice.", delay: 7500 },
    ],
  },
  {
    id: "comedy_night",
    zone: "comedy",
    lines: [
      { speaker: "Customer", text: "I need something funny. Like really funny.", delay: 0 },
      { speaker: "Friend", text: "Dumb and Dumber?", delay: 2500 },
      { speaker: "Customer", text: "Seen it. Can quote the whole thing.", delay: 4000 },
      { speaker: "Friend", text: "That's... impressive and concerning.", delay: 6000 },
    ],
  },
  {
    id: "new_release_hype",
    zone: "new_releases",
    lines: [
      { speaker: "Teen", text: "Is the new one in yet?", delay: 0 },
      { speaker: "Friend", text: "It's always checked out. We gotta come on Tuesday mornings.", delay: 2500 },
      { speaker: "Teen", text: "Who rents movies on a Tuesday morning?", delay: 5000 },
      { speaker: "Friend", text: "Winners. Winners rent movies on Tuesday mornings.", delay: 7000 },
    ],
  },
  {
    id: "recommendation",
    zone: "drama",
    lines: [
      { speaker: "Customer", text: "Vinny recommended Shawshank Redemption.", delay: 0 },
      { speaker: "Friend", text: "Vinny has great taste.", delay: 2500 },
      { speaker: "Customer", text: "He said it'll change my life.", delay: 4000 },
      { speaker: "Friend", text: "It will. Bring tissues.", delay: 5500 },
    ],
  },
];

// Get a random conversation, optionally filtered by zone
export function getRandomConversation(zone?: string): NPCConversation {
  const pool = zone
    ? NPC_CONVERSATIONS.filter(c => c.zone === zone)
    : NPC_CONVERSATIONS;
  const list = pool.length > 0 ? pool : NPC_CONVERSATIONS;
  return list[Math.floor(Math.random() * list.length)];
}
