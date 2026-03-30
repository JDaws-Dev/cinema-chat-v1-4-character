# NPC Conversations Design: Era-Aware, Randomized Customer Chatter

## Problem Statement

The current system has three core issues:

1. **Era-blind content** -- CUSTOMER_LINES and CONVERSATIONS in `src/lib/audio.ts` reference specific movies (Die Hard, Jurassic Park, The Matrix, Terminator 2) regardless of which era the player selected. A late-80s store should not have customers talking about The Matrix.

2. **Repetition fatigue** -- Only 20 one-liner clips + 6 multi-line conversations + 5 Tarantino rants. Players hear the same lines within minutes. The Quentin easter egg helps, but the core pool is thin.

3. **Generic NPCs** -- 4 adults + 1 kid, fixed shirt colors, fixed start positions, no personality. They walk around and occasionally emit a random line. Nothing distinguishes one NPC from another or makes them feel like a person from a specific time period.

The era selector (`currentEraYears` in Store.tsx, line 147) already drives poster selection and movie data. Customer chatter is the last major system that ignores it.

---

## System Overview

```
ERA (from currentEraYears)
  + PERSONALITY TYPE (Movie Buff, Parent, Teenager, etc.)
  + CONVERSATION TEMPLATE (argument about genre, spoiler warning, etc.)
  = Fully realized, era-correct conversation with specific movie names,
    cultural references, and personality-driven delivery
```

The new file `src/lib/npc-conversations.ts` replaces the hardcoded CUSTOMER_LINES and CONVERSATIONS arrays with a generation system that takes the current era as input and returns randomized, era-appropriate dialogue.

---

## 1. Era-Specific Conversation Database

Each era gets a data object containing: key movies, cultural touchstones, slang, and store-specific details. These feed into conversation templates.

### Era: Late 80s (1987-1989)

**Key Movies:** Top Gun, Dirty Dancing, Die Hard, Batman (1989), Rain Man, Coming to America, Lethal Weapon, The Princess Bride, Beetlejuice, RoboCop, Crocodile Dundee, Full Metal Jacket, Predator, Planes Trains and Automobiles, Big

**Cultural Context:**
- VHS is booming; "Be kind, rewind" stickers are brand new
- Mom-and-pop video stores everywhere; Blockbuster hasn't reached most towns yet
- Movie rental is a Friday night EVENT -- families drive to the store together
- No internet, no spoilers -- you hear about movies from friends or TV commercials
- Big hair, neon colors, Members Only jackets

**Store Vibe:** Intimate, the clerk knows your name, hand-written "Staff Picks" cards

**Sample One-Liners:**
- "Did you see Batman yet? Jack Nicholson as the Joker is INSANE."
- "My wife has rented Dirty Dancing four Fridays in a row. I'm losing my mind."
- "Die Hard is the best action movie ever made. Don't even argue with me."
- "Have you seen Big? Tom Hanks playing a kid is the funniest thing I've ever seen."
- "Top Gun made me want to be a fighter pilot. Then I found out I need glasses."
- "They just got The Princess Bride in. Inconceivable!"
- "I heard RoboCop is super violent. Like, actually disturbing violent."
- "Be kind, rewind! I keep forgetting. Got charged a buck last time."
- "My kids want Crocodile Dundee again. That's not a knife... THIS is a knife."
- "Rain Man was incredible. Dustin Hoffman deserved every award."

**Sample Multi-Line Conversations:**

*Conversation: Batman hype*
- "Have you seen the new Batman yet?"
- "The Michael Keaton one? No way he can pull off Batman."
- "That's what I thought! But Jack Nicholson as the Joker? Incredible."
- "Okay, maybe I'll give it a shot."

*Conversation: Karate Kid sequels*
- "I can't believe they made a third Karate Kid."
- "Is it any good?"
- "It's not as good as the first one. Nothing beats the crane kick."
- "The first one is always the best. Always."

*Conversation: Friday night ritual*
- "We do this every Friday. Rent two movies, get a pizza."
- "Same! It's the best part of the week."
- "My husband always wants action. I always want romance. We compromise on comedy."
- "That's marriage, right there."

*Conversation: VHS excitement*
- "Can you believe you can just WATCH movies at home now? Whenever you want?"
- "I know! My parents used to have to go to the drive-in."
- "The future is here."

*Conversation: Predator debate*
- "Predator or Aliens? You can only pick one."
- "That's impossible. Don't make me choose."
- "Gun to my head? Predator. Schwarzenegger is unstoppable."
- "Wrong. Aliens. Sigourney Weaver would destroy Schwarzenegger."

---

### Era: Early 90s (1990-1993)

**Key Movies:** Home Alone, Terminator 2, Silence of the Lambs, Aladdin, Jurassic Park (1993), Hook, Wayne's World, A Few Good Men, The Bodyguard, Unforgiven, Basic Instinct, Sister Act, Tombstone, Groundhog Day, Mrs. Doubtfire

**Cultural Context:**
- Blockbuster expanding rapidly, competing with local stores
- Late fees are a real sore point -- stores charging $1-3/day
- VHS is king but LaserDisc exists for the wealthy cinephiles
- "New Release" walls are packed on Fridays -- you might not get what you want
- Movie merchandise is huge -- T-shirts, posters, toys

**Store Vibe:** Busier, more competitive, "New Releases" section is the battleground

**Sample One-Liners:**
- "My kids have watched Home Alone four hundred times. I can quote the entire movie."
- "Have you seen Jurassic Park? The dinosaurs look SO real."
- "Terminator 2 is the greatest sequel ever made. Don't even try to argue."
- "I tried to rent Silence of the Lambs but they only had one copy. ONE copy!"
- "Wayne's World! Party time! Excellent! ...sorry, I can't stop saying that."
- "My daughter watches Aladdin every single day. Every. Single. Day."
- "A Few Good Men... you can't HANDLE the truth! Ha. Gets me every time."
- "The new release wall is already picked clean. It's 6 PM on a Friday, people."
- "I heard there's a late fee on my account? That tape was NOT late."
- "Hook is actually pretty good. Dustin Hoffman as Captain Hook is perfect."
- "Has anyone tried LaserDisc? My neighbor has one. Picture's amazing but the discs are huge."

**Sample Multi-Line Conversations:**

*Conversation: Jurassic Park awe*
- "I just saw Jurassic Park in theaters. I'm still shaking."
- "The T-Rex scene?"
- "When it breaks out of the paddock and the water's shaking in the cup? I almost passed out."
- "We need to rent it the SECOND it comes to video."

*Conversation: Home Alone quotathon*
- "Keep the change, ya filthy animal!"
- "Please. If I hear one more Home Alone quote I'm going to lose it."
- "KEVIN!"
- "I'm leaving."

*Conversation: Late fee argument*
- "Three dollars in late fees? For ONE day?"
- "You should've returned it on time."
- "I DID return it on time! The drop box was full!"
- "Sure it was."

*Conversation: Mrs. Doubtfire*
- "Robin Williams in a dress. That's all you need to know."
- "Is it actually funny or just weird?"
- "Both. It's both. And somehow it also makes you cry."
- "That man can do anything."

*Conversation: The Bodyguard*
- "Have you heard that Whitney Houston song from The Bodyguard?"
- "I Will Always Love You? It's been on the radio every five minutes."
- "My wife plays the cassette in the car. On repeat. I'm hearing it in my sleep."

---

### Era: Mid 90s (1994-1996)

**Key Movies:** Pulp Fiction, Forrest Gump, The Lion King, Toy Story, Shawshank Redemption, Braveheart, Independence Day, Fargo, Se7en, Apollo 13, Clueless, Jumanji, Twister, Mission Impossible, The Birdcage

**Cultural Context:**
- Video stores at absolute peak -- every strip mall has one
- DVD players appearing but VHS still dominates
- Movie quote culture is HUGE -- everyone quotes Forrest Gump, Pulp Fiction
- Tarantino has changed how people talk about movies
- "Spoilers" isn't really a concept yet -- people freely discuss endings

**Store Vibe:** Peak era. Stores are packed. Staff Picks walls. Frequent renter cards. Candy at the counter.

**Sample One-Liners:**
- "Life is like a box of chocolates... no wait, don't. I've heard that a thousand times."
- "Pulp Fiction changed everything. The dialogue, the music, the structure."
- "My kid has watched The Lion King so many times the tape is wearing out."
- "Toy Story is made entirely by computers. ENTIRELY. No drawings at all."
- "Shawshank Redemption was barely in theaters. How is it THIS good?"
- "FREEDOM! ...sorry. Just saw Braveheart. Still pumped."
- "Independence Day was ridiculous but I loved every second of it."
- "Fargo is the weirdest movie I've ever seen. And I mean that as a compliment."
- "Have you seen Se7en? Do NOT ask me about the ending."
- "Houston, we have a problem. I say that every time something goes wrong now."
- "My daughter says everything is 'totally Clueless' now. I don't know what that means."

**Sample Multi-Line Conversations:**

*Conversation: Forrest Gump fatigue*
- "Life is like a box of chocolates..."
- "If I hear that ONE more time I'm going to scream."
- "Run, Forrest, run!"
- "I'm moving to another aisle."

*Conversation: Pulp Fiction impact*
- "Have you seen Pulp Fiction yet?"
- "Twice. The dialogue in that movie is on another level."
- "The Royale with Cheese scene? I think about it every time I order a burger."
- "Tarantino is a genius. A weird genius, but a genius."

*Conversation: VHS vs DVD*
- "My neighbor just got a DVD player."
- "What's a DVD?"
- "It's like a CD but with movies on it. No rewinding."
- "No rewinding? What's next, movies on your phone?"

*Conversation: Toy Story shock*
- "I took my kids to see Toy Story. It's all done on computers."
- "Like, ALL of it? No drawings?"
- "Every single frame. It looked incredible."
- "That can't be real. How do you make a whole movie on a computer?"

*Conversation: Shawshank discovery*
- "Everybody told me to rent Shawshank Redemption."
- "And?"
- "It might be the best movie I've ever seen. How did I miss this in theaters?"
- "Nobody saw it in theaters. That's the crazy part."

---

### Era: Late 90s (1997-1999)

**Key Movies:** Titanic, The Matrix, Fight Club, The Sixth Sense, Saving Private Ryan, American Pie, Good Will Hunting, Men in Black, Armageddon, The Truman Show, Shakespeare in Love, The Big Lebowski, There's Something About Mary, Office Space, The Mummy

**Cultural Context:**
- DVD is taking over -- "Widescreen vs Full Screen" debates
- Internet movie discussions beginning (IMDB, early forums)
- "Spoilers" becoming a real concern -- Sixth Sense changed everything
- Video stores adapting -- adding DVD sections, game rentals
- Y2K anxiety in the background
- Last gasp of video store golden age -- everyone senses change coming

**Store Vibe:** Transitional. DVD shelves appearing. Game rentals starting. A hint of melancholy under the excitement.

**Sample One-Liners:**
- "Don't tell me the ending of The Sixth Sense! I haven't seen it yet!"
- "I'll never let go, Jack... oh god, I'm crying in a video store."
- "The Matrix is the coolest movie I've ever seen. The bullet dodge scene? Come on."
- "My daughter has watched Titanic eleven times. She's drawing pictures of Leonardo DiCaprio."
- "Fight Club is... I can't even describe Fight Club. Just watch it."
- "Have they started renting DVDs here? The picture quality is insane."
- "Men in Black was hilarious. Will Smith can do no wrong."
- "American Pie is SO gross. ...I loved it."
- "Good Will Hunting made me cry in public. I'm not ashamed."
- "The Dude abides. If you don't get that reference, rent Big Lebowski immediately."
- "Office Space is basically a documentary about my life."
- "Should I get the widescreen or full screen version? What's the difference?"

**Sample Multi-Line Conversations:**

*Conversation: Sixth Sense spoiler crisis*
- "Have you seen Sixth Sense?"
- "NO! And don't you DARE tell me anything about it."
- "I wasn't going to! But the ending..."
- "LA LA LA I CAN'T HEAR YOU."

*Conversation: Titanic fatigue*
- "I'll never let go, Jack..."
- "Oh god, not you too."
- "It's the most romantic movie ever made!"
- "It's three hours long. THREE HOURS. My back was killing me."
- "You have no soul."

*Conversation: DVD discovery*
- "I just watched The Matrix on DVD."
- "Is DVD really that much better?"
- "It's like going from AM radio to a concert. Plus no rewinding."
- "But what about all my tapes?"
- "I don't know, man. The future is round and shiny."

*Conversation: Y2K movie night*
- "What are you renting for New Year's?"
- "Something lighthearted. I don't need more anxiety about Y2K."
- "You really think computers are going to break?"
- "I have no idea. But I'm stocking up on movies just in case."

*Conversation: Fight Club rules*
- "First rule of Fight Club..."
- "Don't talk about Fight Club. Yeah, everybody says that."
- "But seriously, that movie messed me up."
- "In a good way?"
- "I... think so?"

---

### Era: Present Day (2024-2026)

**Key Movies:** Current theatrical & streaming hits, plus meta-nostalgia references to the movies from all prior eras

**Cultural Context:**
- Video stores are extinct (except retro ones)
- Streaming killed physical media
- Meta-nostalgia: "Remember when we used to do this?"
- Vinyl/VHS collecting as hipster hobby
- "Digital vs Physical" debates echo "VHS vs DVD"

**Store Vibe:** Dreamy, nostalgic, self-aware. Customers know this is a throwback. Some are genuinely wistful.

**Sample One-Liners:**
- "Can you believe people used to DRIVE somewhere just to watch a movie?"
- "My kid doesn't even know what 'Be kind, rewind' means."
- "I miss this. Friday nights at the video store. Nothing on streaming feels like this."
- "I tried explaining late fees to my teenager. She looked at me like I was insane."
- "This reminds me of the store we used to go to when I was a kid."
- "VHS tapes are selling for fifty bucks on eBay now. I threw out boxes of them."
- "You could spend an hour just browsing. That was the whole point."
- "Remember the smell? Every video store had that SMELL."
- "We used to fight over who got to pick the movie. Now everyone just watches their own phone."
- "The cover art was half the experience. You'd pick a movie just because the box looked cool."

**Sample Multi-Line Conversations:**

*Conversation: Streaming lament*
- "I've been scrolling Netflix for an hour and I still can't pick anything."
- "At least here you had to commit. You picked a tape and that was your Friday."
- "Exactly! The limitation was the POINT."
- "Now we have everything and watch nothing."

*Conversation: Explaining to kids*
- "Mom, why are we here?"
- "Because THIS is how we used to get movies. You walked in, you picked a tape off the shelf."
- "That sounds really slow."
- "It was perfect."

*Conversation: Physical media comeback*
- "I started collecting VHS tapes again."
- "You're kidding. Why?"
- "There's something about holding the movie in your hands. The art, the weight, the ritual."
- "My wife thinks I'm crazy."
- "She's not wrong. But it's a good kind of crazy."

---

## 2. NPC Personality Types

Eight distinct customer personality archetypes. Each has behavioral traits, voice characteristics, and conversation tendencies that remain consistent across eras -- but their specific dialogue changes per era.

### The Movie Buff
- **Behavior:** Lingers in specific genre aisles, examines VHS cases closely
- **Voice:** Animated, opinionated, talks fast when excited
- **Trait:** Strong opinions, references directors by name, compares films
- **Era adaptation:** Knows the "right" movies for the period. In the 80s, they're quoting Spielberg. In the 90s, they've discovered Tarantino. In the present, they're nostalgic for all of it.

### The Parent
- **Behavior:** Stressed movement, occasionally pauses (checking a list), gravitates toward Family section
- **Voice:** Tired but warm, interrupted cadence
- **Trait:** Looking for family-appropriate content, managing chaos, has a limited window
- **Era adaptation:** In the 80s, worried about PG-13 (new rating). In the 90s, dealing with Home Alone obsession. In the present, comparing to streaming.

### The Couple
- **Behavior:** Two NPCs that walk near each other, pause at shelves together
- **Voice:** Alternating -- one playful, one exasperated
- **Trait:** Can never agree on a genre, playful arguing, compromise
- **Era adaptation:** The specific movies they argue about change, but the dynamic stays the same.

### The Teenager
- **Behavior:** Moves quickly, gravitates toward Action/Horror, ignores Family section
- **Voice:** High energy, excitable, uses era-appropriate slang
- **Trait:** Wants horror or action, thinks everything is "cool" or "awesome," easily impressed by special effects
- **Era adaptation:** 80s teen says "radical" and "tubular." 90s teen says "all that" and "da bomb." Present-day teen is ironic about everything.

### The Regular
- **Behavior:** Moves confidently, knows the layout, goes straight to specific sections
- **Voice:** Relaxed, familiar, uses staff names
- **Trait:** Knows the store, knows Vinny, has a "usual" pick, remembers past rentals
- **Era adaptation:** References their own rental history. "Last week I got [era-appropriate movie] and it was great."

### The Newbie
- **Behavior:** Wanders slowly, looks around a lot, pauses at genre signs
- **Voice:** Uncertain, questioning, a little overwhelmed
- **Trait:** First time at this store, doesn't know the system, needs guidance
- **Era adaptation:** In the 80s, VHS rental itself is new. In the late 90s, confused by DVD section. In present day, confused by physical media entirely.

### The Kid
- **Behavior:** Runs between aisles, stops at everything shiny, gravitates to candy counter
- **Voice:** High-pitched, whiny or excited, short bursts
- **Trait:** Wants everything, begging parent, short attention span, obsessed with one specific movie
- **Era adaptation:** 80s kid wants Ghostbusters. 90s kid wants Aladdin. Present-day kid wants to know why there's no Wi-Fi.

### The Critic
- **Behavior:** Slow, deliberate movement, picks up and puts back VHS cases
- **Voice:** Dry, slightly condescending, measured
- **Trait:** Nothing is good enough, compares everything to "the original," dismissive of popular taste
- **Era adaptation:** Always thinks the previous decade was better. In the 90s, the 80s were better. In the present, everything was better.

---

## 3. Conversation Generation Architecture

### Data Structure

```typescript
// src/lib/npc-conversations.ts

interface EraData {
  id: string;                    // "late-80s" | "early-90s" | "mid-90s" | "late-90s" | "present"
  years: string;                 // "1987-1989"
  movies: MovieRef[];            // era-specific movie references
  culture: CultureRef[];         // era-specific cultural details
  slang: string[];               // era-appropriate language
  storeDetails: StoreDetail[];   // what the store looks/feels like in this era
}

interface MovieRef {
  title: string;                 // "Die Hard"
  year: number;                  // 1988
  genres: string[];              // ["action", "christmas"]
  quotable: string[];            // ["Yippee-ki-yay", "Come out to the coast..."]
  opinions: {                    // personality-specific takes
    buff: string;                // "masterpiece of confined-space tension"
    parent: string;              // "way too violent for the kids"
    teenager: string;            // "the coolest movie EVER"
    critic: string;              // "derivative of Towering Inferno but competent"
  };
}

interface ConversationTemplate {
  id: string;
  type: "oneliner" | "multi";
  personalities: PersonalityType[];  // which personalities can use this template
  slots: TemplateSlot[];             // {MOVIE}, {REACTION}, {QUOTE}, {YEAR}
  lines: TemplateLine[];
}

interface TemplateLine {
  speaker: PersonalityType | "any";
  template: string;                  // "Have you seen {MOVIE}? {REACTION}"
}
```

### Template Engine

The system works in three steps:

**Step 1: Era Resolution**
```
currentEraYears ("1990-1993") -> EraData for "early-90s"
```

Map the year range string from `currentEraYears` to the matching `EraData` object. This gives us the movie pool, cultural references, and slang for the current era.

**Step 2: Template Selection**
```
Pick a random ConversationTemplate that matches the requesting NPC's personality type
```

Templates are personality-filtered. A "spoiler warning" template works for Movie Buff + Teenager but not for Kid. A "kid begging parent" template requires Kid + Parent personalities.

**Step 3: Slot Filling**
```
For each {SLOT} in the template, pick an era-appropriate value:
  {MOVIE}    -> random movie from EraData.movies
  {REACTION} -> personality-specific opinion from MovieRef.opinions
  {QUOTE}    -> random quotable line from MovieRef.quotable
  {CULTURE}  -> random cultural reference from EraData.culture
  {SLANG}    -> era-appropriate exclamation
```

**Example walkthrough:**

Template: `"Have you seen {MOVIE}? {REACTION}"`

- Late 80s + Movie Buff: "Have you seen Die Hard? It's not just an action movie, it's a masterpiece of confined-space tension."
- Early 90s + Teenager: "Have you seen Terminator 2? The liquid metal guy is SO COOL."
- Mid 90s + Couple: "Have you seen Pulp Fiction?" / "I don't want to watch something violent!" / "It's not JUST violent, it's art!"
- Late 90s + Parent: "Have you seen The Matrix? I don't even understand it but the kids love it."

### Era-to-Year Mapping

```typescript
function resolveEra(eraYears: string): EraData {
  const startYear = parseInt(eraYears.split("-")[0]);
  if (startYear <= 1989) return LATE_80S;
  if (startYear <= 1993) return EARLY_90S;
  if (startYear <= 1996) return MID_90S;
  if (startYear <= 1999) return LATE_90S;
  return PRESENT_DAY;
}
```

### Minimum Content Targets Per Era

| Content Type | Count | Notes |
|---|---|---|
| One-liner templates | 15 | Personality-tagged, slot-filled |
| Multi-line conversations | 10 | 3-5 lines each |
| Era-specific movies | 12-15 | With quotes and opinions |
| Cultural references | 8-10 | Store/rental culture details |
| Slang expressions | 5-8 | Era-appropriate exclamations |

Total unique conversations per era: ~25 (15 one-liners + 10 multi-line). Across 5 eras: **~125 unique conversations**, up from the current 26.

---

## 4. Audio Generation Strategy

### Current State

- Pre-generated MP3 files in `/public/sounds/`: `customer_0.mp3` through `customer_19.mp3`, `kid_0.mp3` through `kid_5.mp3`, `tarantino_0.mp3` through `tarantino_4.mp3`, plus `conv_X_Y.mp3` for multi-line conversations
- Vinny's lines use `/api/tts` endpoint (ElevenLabs, `eleven_turbo_v2_5` model, Charlie voice)
- Each MP3 is roughly 40-80KB
- TTS endpoint already supports a `voice` query parameter for different voice IDs

### Option Analysis

| Approach | Pros | Cons |
|---|---|---|
| **A: Pre-generate all** | Instant playback, no API cost at runtime, works offline | ~125 conversations x avg 3 lines = ~375 clips x 5 eras... but actually many lines are reusable. Estimate ~500 unique clips. At ~60KB each = ~30MB. Generation cost: ~500 ElevenLabs calls. |
| **B: All on-the-fly TTS** | Unlimited content, zero storage, can change text instantly | 1-2s latency per line, API cost per play, requires internet, rate limits |
| **C: Hybrid** | Best of both worlds | More complex caching logic |

### Recommendation: Option C (Hybrid) with Progressive Caching

**Architecture:**

1. **Subtitle-first playback**: Show the subtitle text immediately (already works -- `subtitleCallback` fires before audio). The player gets the conversation content with zero latency. Audio is enhancement, not requirement.

2. **On-demand TTS with client-side caching**: When a conversation plays, call `/api/tts` for each line. Cache the resulting audio in an in-memory `Map<string, AudioBuffer>` keyed by the text content. Same line never calls TTS twice in a session.

3. **Server-side disk cache** (optional enhancement): The `/api/tts` route already sets `Cache-Control: public, max-age=86400`. Add a server-side file cache so repeated lines across sessions don't hit ElevenLabs:

```typescript
// In /api/tts/route.ts
const cacheDir = path.join(process.cwd(), ".tts-cache");
const cacheKey = crypto.createHash("md5").update(`${voiceId}:${text}`).digest("hex");
const cachePath = path.join(cacheDir, `${cacheKey}.mp3`);

// Check cache before calling ElevenLabs
if (existsSync(cachePath)) {
  return new Response(readFileSync(cachePath), { headers: { "Content-Type": "audio/mpeg" } });
}
// ... call ElevenLabs, write to cache, return
```

4. **Voice variety via voice parameter**: The TTS endpoint already accepts `?voice=VOICE_ID`. Assign different ElevenLabs voice IDs to different personality types:

```typescript
const PERSONALITY_VOICES: Record<PersonalityType, string> = {
  movie_buff:  "pNInz6obpgDQGcFmaJgB",  // Adam - deep, authoritative
  parent:      "EXAVITQu4vr4xnSDxMaL",  // Bella - warm, tired
  teenager:    "jBpfuIE2acCO8z3wKNLl",   // Gigi - young, energetic
  couple_a:    "IKne3meq5aSn9XLyUdCD",  // Charlie
  couple_b:    "EXAVITQu4vr4xnSDxMaL",  // Bella
  regular:     "yoZ06aMxZJJ28mfd3POQ",   // Sam - casual
  newbie:      "jBpfuIE2acCO8z3wKNLl",   // Gigi
  kid:         "jBpfuIE2acCO8z3wKNLl",   // Gigi (pitch shifted or young voice)
  critic:      "pNInz6obpgDQGcFmaJgB",   // Adam - dry delivery
};
```

(Voice IDs above are placeholders -- real IDs should be chosen from the ElevenLabs voice library.)

**Cost Estimate:**

- ElevenLabs free tier: 10,000 characters/month
- Average line: ~60 characters
- Average session: ~8-12 lines heard (20-40s between events, sessions ~10-20 min)
- With caching: first session generates ~12 clips, subsequent sessions reuse cache
- Monthly cost with moderate play: well within paid tier limits

### Graceful Degradation

If TTS fails (no API key, rate limited, offline), the system falls back to subtitle-only mode. This already works -- `playVinnyLine` shows subtitles before attempting audio. The NPC conversation system should follow the same pattern.

---

## 5. NPC Spawn Randomization

### Current System

Fixed NPCs in Store.tsx (lines 3085-3091):
```tsx
<NPCCustomer id="npc-0" startPos={[-3.25, -0.05, -5.5]} shirtColor="#3498db" ... />
<NPCCustomer id="npc-1" startPos={[3.25, -0.05, 0.5]}   shirtColor="#e74c3c" ... />
<NPCCustomer id="npc-2" startPos={[-3.25, -0.05, 3.5]}   shirtColor="#27ae60" ... />  // desktop only
<NPCCustomer id="npc-3" startPos={[3.25, -0.05, -2.5]}   shirtColor="#9b59b6" ... />  // desktop only
<KidCustomer ... />
<TarantinoNPC />  // 30% spawn chance, already randomized
```

### Proposed NPC Pool System

```typescript
interface NPCConfig {
  id: string;
  personality: PersonalityType;
  appearance: {
    shirtColor: string;
    hairColor: string;
    skinTone: string;
    hairStyle: "flattop" | "long" | "cap" | "ponytail";
  };
  voiceId: string;          // ElevenLabs voice ID
  isKid: boolean;           // renders KidCustomer vs NPCCustomer
  spawnWeight: number;      // 1.0 = normal, 2.0 = twice as likely (regulars)
  eraAppearance?: {         // optional era-specific outfit overrides
    [era: string]: { shirtColor: string };
  };
}
```

**NPC Pool (12 configs):**

| # | Name | Personality | Spawn Weight | Notes |
|---|---|---|---|---|
| 1 | Dave | Movie Buff | 1.5 | Regular -- higher spawn chance |
| 2 | Karen | Parent | 1.5 | Regular -- higher spawn chance |
| 3 | Mike & Lisa | Couple | 1.0 | Spawn as pair (counts as 2 slots) |
| 4 | Tyler | Teenager | 1.0 | Different era-appropriate outfits |
| 5 | Frank | Regular | 2.0 | Highest spawn chance -- the "always here" guy |
| 6 | Denise | Newbie | 0.8 | Less common |
| 7 | Timmy | Kid | 1.0 | Always with a parent NPC nearby |
| 8 | Susan | Critic | 0.7 | Rarer -- feels special when she appears |
| 9 | Greg | Movie Buff | 0.8 | Alt movie buff -- different opinions from Dave |
| 10 | Maria | Regular | 1.0 | Second regular, different vibe |
| 11 | Jake | Teenager | 0.8 | Second teen option |
| 12 | Quentin | (Easter egg) | 0.3 | Already exists -- keep the 30% spawn |

**Spawn Algorithm:**

```typescript
function spawnNPCs(isMobile: boolean): NPCConfig[] {
  const maxNPCs = isMobile ? 3 : 5;  // reduced on mobile (current behavior)
  const pool = [...NPC_POOL];
  const spawned: NPCConfig[] = [];

  // Guarantee at least one Regular (Frank or Maria)
  const regulars = pool.filter(n => n.personality === "regular");
  const guaranteedRegular = weightedRandom(regulars);
  spawned.push(guaranteedRegular);
  removeFromPool(pool, guaranteedRegular);

  // Fill remaining slots with weighted random selection
  while (spawned.length < maxNPCs && pool.length > 0) {
    const pick = weightedRandom(pool);
    // Special: Couple spawns as pair, takes 2 slots
    if (pick.personality === "couple" && spawned.length + 2 <= maxNPCs) {
      spawned.push(pick);  // both Mike and Lisa
      removeFromPool(pool, pick);
    } else if (pick.personality !== "couple") {
      spawned.push(pick);
      removeFromPool(pool, pick);
    } else {
      removeFromPool(pool, pick);  // skip couple if not enough room
    }
  }

  // Assign random start positions from the existing waypoint-based spawn points
  const startPositions: [number, number, number][] = [
    [-3.25, -0.05, -5.5], [3.25, -0.05, 0.5],
    [-3.25, -0.05, 3.5], [3.25, -0.05, -2.5],
    [0, -0.05, -1.5], [-1.5, -0.05, 2.0],
  ];
  shuffle(startPositions);
  spawned.forEach((npc, i) => {
    npc.startPos = startPositions[i % startPositions.length];
  });

  return spawned;
}
```

**Key behaviors:**
- Each store visit (page load or era change) re-rolls the NPC roster
- At least one "Regular" always spawns (makes the store feel lived-in)
- Kid always spawns near a Parent if both are present
- Couple always spawns together or not at all
- Quentin retains his 30% independent spawn chance
- Era-appropriate outfits: late-80s NPCs get neon shirts, present-day NPCs get modern colors

---

## 6. Implementation Plan

### Phase 1: Era-Specific Conversation Text Database
**Scope:** New file with all conversation data. Subtitle-only playback. No audio changes.
**Files to create/modify:**
- CREATE `src/lib/npc-conversations.ts` -- all era data, movie refs, templates, generation functions
- MODIFY `src/lib/audio.ts` -- import era-aware conversations, replace hardcoded arrays

**Tasks:**
1. Define the `EraData` interface and create data objects for all 5 eras (movies, culture, slang)
2. Write 15 one-liner templates and 10 multi-line conversation templates per era
3. Build the template engine: `resolveEra()`, `fillTemplate()`, `generateConversation()`
4. Export `getEraOneLiners(eraYears: string)` and `getEraConversations(eraYears: string)`
5. Modify `playRandomCustomerClip()` to call `getEraOneLiners(currentEraYears)` instead of reading from `CUSTOMER_LINES`
6. Modify `playRandomConversation()` to call `getEraConversations(currentEraYears)` instead of reading from `CONVERSATIONS`
7. For Phase 1, play subtitle-only (skip the `fetch(/sounds/...)` step, just use `subtitleCallback` and wait the computed duration)

**Estimated effort:** 2-3 sessions

### Phase 2: NPC Personality System + Template Engine
**Scope:** NPC personality types drive which conversations they produce. RPG dialogues become era-aware.
**Files to create/modify:**
- MODIFY `src/lib/npc-conversations.ts` -- add personality-based filtering
- MODIFY `src/lib/npc-dialogues.ts` -- era-aware RPG dialogue trees (or new era-aware section)
- MODIFY `src/components/game3d/Store.tsx` -- pass personality type to NPC components

**Tasks:**
1. Add `PersonalityType` enum and tag every conversation template with compatible personalities
2. Add personality prop to `NPCCustomer` component
3. When player talks to an NPC (RPG dialogue), select from personality-appropriate dialogue trees
4. Create personality-specific dialogue variations for Vinny/Charlie too (they react differently to different customer types)
5. Pass `currentEraYears` into the dialogue system so RPG dialogue trees reference era-correct movies

**Estimated effort:** 2 sessions

### Phase 3: Audio Generation Integration
**Scope:** TTS voices for NPC conversations, caching, voice variety.
**Files to create/modify:**
- MODIFY `src/app/api/tts/route.ts` -- add server-side disk cache
- MODIFY `src/lib/audio.ts` -- TTS-based NPC audio with client cache and voice routing
- CREATE `src/lib/npc-voices.ts` -- voice ID mapping per personality type

**Tasks:**
1. Add server-side `.tts-cache/` directory with MD5-keyed MP3 files in the TTS route
2. Create voice mapping: personality type -> ElevenLabs voice ID
3. Modify `playRandomCustomerClip()` to call TTS with the appropriate voice instead of fetching pre-generated files
4. Modify `playRandomConversation()` to call TTS for each line with speaker-appropriate voice
5. Add client-side `Map<string, AudioBuffer>` cache so repeated lines don't re-fetch
6. Implement graceful degradation: if TTS fails, subtitle-only mode continues working
7. Add `?voice=` parameter to all NPC TTS calls based on personality
8. Test latency and adjust conversation pacing (may need to pre-fetch next line while current plays)

**Estimated effort:** 2 sessions

### Phase 4: NPC Pool Randomization
**Scope:** Dynamic NPC roster per visit, varied appearances, spawn weights.
**Files to create/modify:**
- CREATE `src/lib/npc-pool.ts` -- NPC configs, spawn algorithm, weighted random
- MODIFY `src/components/game3d/Store.tsx` -- replace hardcoded NPCs with dynamic spawning

**Tasks:**
1. Define 12 NPC configs with personality, appearance, voice, and spawn weight
2. Implement `spawnNPCs(isMobile)` with weighted random selection and constraints (guaranteed regular, couple pairing, kid+parent)
3. Replace the hardcoded `<NPCCustomer>` JSX in Store.tsx with a dynamic loop over spawned configs
4. Add era-appropriate outfit overrides (shirt colors, hair styles per era)
5. Re-roll NPC roster on era change (not just page load)
6. Ensure NPC-to-NPC collision avoidance still works with dynamic IDs
7. Connect each spawned NPC's personality to the conversation system from Phase 2

**Estimated effort:** 1-2 sessions

### Phase 5: Quest System Integration
**Scope:** NPC personalities affect which side quests appear and how they play out.
**Files to create/modify:**
- MODIFY `src/lib/npc-dialogues.ts` -- personality-driven quest dialogues
- MODIFY `src/lib/npc-conversations.ts` -- quest-aware conversation variants

**Tasks:**
1. Tag quest dialogues with personality requirements (e.g., "help_me_find_it" requires Newbie or Parent)
2. Create personality-specific quest variants: Movie Buff gives trivia quests, Kid gives fetch quests, Critic gives "prove me wrong" quests
3. Add era-specific quest content: in the 80s, the "find this movie" quest references 80s movies; in the 90s, 90s movies
4. Ensure `getRandomQuestDialogue()` filters by both personality AND era
5. Add new quest types per personality:
   - Movie Buff: "Film school quiz" -- answer 3 trivia questions about era-specific movies
   - Parent: "Family Movie Night" -- find a movie the whole family can agree on (pick from 3 options)
   - Teenager: "Scare Me Challenge" -- find the scariest movie in the store
   - Critic: "Change My Mind" -- bring the Critic a movie that matches their impossible criteria
   - Regular: "Vinny's Recommendation" -- Frank forgot what Vinny recommended last week, find it

**Estimated effort:** 2-3 sessions

---

## 7. File Map Summary

| File | Role | Phase |
|---|---|---|
| `src/lib/npc-conversations.ts` | NEW -- Era data, templates, generation engine | 1, 2 |
| `src/lib/npc-voices.ts` | NEW -- Voice ID mapping per personality | 3 |
| `src/lib/npc-pool.ts` | NEW -- NPC configs, spawn algorithm | 4 |
| `src/lib/audio.ts` | MODIFY -- Use era-aware conversations, TTS caching | 1, 3 |
| `src/lib/npc-dialogues.ts` | MODIFY -- Era-aware RPG dialogues, personality filtering | 2, 5 |
| `src/components/game3d/Store.tsx` | MODIFY -- Dynamic NPC spawning, personality props | 2, 4 |
| `src/app/api/tts/route.ts` | MODIFY -- Server-side disk cache | 3 |

---

## 8. Migration Path

The existing pre-generated MP3 files (`customer_0.mp3` through `customer_19.mp3`, etc.) remain in `/public/sounds/` as fallbacks. The new system is additive:

1. **Phase 1 ships subtitle-only** -- no audio regression. Old clips can still play if the template system returns a line that matches an existing clip (unlikely but harmless).
2. **Phase 3 adds TTS** -- replaces pre-generated clips with on-demand generation. Old files become dead weight but cause no harm.
3. **Cleanup** -- after Phase 3 is stable, the old `customer_*.mp3` and `conv_*_*.mp3` files can be removed from `/public/sounds/`. The `kid_*.mp3` and `tarantino_*.mp3` files can be kept as fallbacks for the Kid and Quentin personalities, or regenerated via TTS.

No breaking changes at any phase. Each phase is independently shippable.
