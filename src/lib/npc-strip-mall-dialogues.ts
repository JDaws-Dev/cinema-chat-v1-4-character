// Static dialogue trees for strip-mall NPCs (Tony, Earl, etc.)

import type { DialogueTree, DialogueNode } from "./npc-dialogues";

export function buildTonyDialogue(): DialogueTree {
  const followPizza: DialogueNode = {
    speaker: "Tony",
    portrait: "pizza",
    text: "Friday nights are the busiest — everybody swings by after picking out a movie. Pepperoni outsells everything two to one. Can't beat the classics, right?",
  };
  const followVinny: DialogueNode = {
    speaker: "Tony",
    portrait: "pizza",
    text: "Vinny? Oh yeah, great guy. We've been neighbors since this strip mall opened. He sends his customers over here all the time — and I send mine over there. It works out!",
  };
  const followBrowse: DialogueNode = {
    speaker: "Tony",
    portrait: "pizza",
    text: "No worries! Take your time. The smell alone usually brings people back. Have a good one!",
  };
  const opener: DialogueNode = {
    speaker: "Tony",
    portrait: "pizza",
    text: "Hey! Welcome to Pizza Palace. Best pepperoni in town. What can I get ya?",
    responses: [
      { text: "What's good tonight?", next: followPizza },
      { text: "Do you know Vinny next door?", next: followVinny },
      { text: "Just browsing, thanks.", next: followBrowse },
    ],
  };
  return { id: `tony_${Date.now()}`, npc: "Tony", portrait: "pizza", opener };
}

export function buildEarlDialogue(): DialogueTree {
  const followWork: DialogueNode = {
    speaker: "Earl",
    portrait: "laundro",
    text: "Going on twelve years now. Started as a summer gig — never left. There's something about the rhythm of this place. Washers humming, dryers spinning... it's peaceful, you know?",
  };
  const followStories: DialogueNode = {
    speaker: "Earl",
    portrait: "laundro",
    text: "Oh, I've seen it all. A kid once tried to ride the spin cycle. Somebody left a whole birthday cake in a dryer. Friday nights though — that's when the real characters show up. Everyone's got somewhere to be, but they stop here first.",
  };
  const followNice: DialogueNode = {
    speaker: "Earl",
    portrait: "laundro",
    text: "Appreciate that. It's not much, but it's honest. People come in stressed, leave a little lighter. That's the whole trick — just give folks a place to breathe for a minute.",
  };
  const opener: DialogueNode = {
    speaker: "Earl",
    portrait: "laundro",
    text: "Hey there. Washer's free if you need one. Otherwise, pull up a chair — nobody's in a rush around here.",
    responses: [
      { text: "How long have you worked here?", next: followWork },
      { text: "Any good stories?", next: followStories },
      { text: "Nice place.", next: followNice },
    ],
  };
  return { id: `earl_${Date.now()}`, npc: "Earl", portrait: "laundro", opener };
}
