/**
 * npc-customer-dialogues.ts — Era-aware personality-driven dialogue trees for customer NPCs.
 *
 * Generates multi-branch RPG dialogues based on NPC personality type AND current era.
 * 5 eras x 8 personalities x 4 templates = 160 unique era-specific dialogue templates,
 * plus generic fallbacks for unknown/missing era.
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

// ── Era IDs ────────────────────────────────────────────────────
type EraId = 'late80s' | 'early90s' | 'mid90s' | 'late90s' | 'present';

// ══════════════════════════════════════════════════════════════════
//  LATE 80s (1987-1989)
// ══════════════════════════════════════════════════════════════════

const LATE80S_MOVIE_BUFF: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "Die Hard. People call it an action movie, but John McTiernan directed a masterclass in tension. Every frame is deliberate.",
    followUp: { playerText: "You think it's more than just action?", npcText: "Totally. The way he uses Nakatomi Plaza as a vertical maze — that's architecture as storytelling. Kubrick would approve." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "I just saw Batman three times in theaters. Tim Burton is doing something radical with the genre — gothic, dark, not campy. Keaton is a revelation.",
    followUp: { playerText: "Three times? Isn't that excessive?", npcText: "You can't absorb Anton Furst's production design in one viewing. The sets alone are worth the price of admission. The man built a city." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "The Princess Bride is filed under family, which is a crime. Rob Reiner made a perfect film. The screenplay by William Goldman is untouchable.",
    followUp: { playerText: "I thought that was a kids' movie?", npcText: "That's what everyone says until they watch it. The sword choreography alone took months. And the dialogue — every line is quotable. Every. Single. Line." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "Rain Man just came out on tape and Levinson's direction is so restrained. He lets Hoffman and Cruise do the work. That's a director who trusts his actors.",
    followUp: { playerText: "Is it really that good?", npcText: "Hoffman studied with real autistic savants for months. You can tell. There's nothing performative about it — it's totally authentic." },
  },
];

const LATE80S_PARENT: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Who Framed Roger Rabbit seems safe, right? Cartoons and live action? But then I remember some of those scenes and... I dunno. My seven-year-old repeats everything.",
    followUp: { playerText: "It's pretty family friendly.", npcText: "That's what my husband said. But the last movie he picked, my daughter asked what 'dynamite' means. So I don't trust his judgment anymore." },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "The kids wanted Beetlejuice again. I've seen it four times this month. I know every word. Michael Keaton haunts my dreams now.",
    followUp: { playerText: "Kids love that movie.", npcText: "They do. They absolutely do. And they do the 'Day-O' dance at the dinner table. Every. Single. Night. I need a new tape before I lose it." },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "My son is obsessed with Top Gun. He runs around the house with his arms out making jet noises. He calls the dog 'Goose.'",
    followUp: { playerText: "That's adorable.", npcText: "It was adorable the first hundred times. Now he wants aviator sunglasses for school photos. He's eight." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "Dirty Dancing is my pick tonight. After the kids go to bed. That's MY time. Nobody puts this mom in a corner.",
    followUp: { playerText: "Sounds like a plan.", npcText: "If my husband tries to switch it to Predator again I'm hiding the remote. Friday night is supposed to be relaxing, not explosions." },
  },
];

const LATE80S_TEENAGER: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "Dude, Predator! Schwarzenegger versus an alien in the jungle? That's like the most radical movie ever made!",
    followUp: { playerText: "Ever try anything slower?", npcText: "I watched Rain Man with my parents. It was totally bogus. Two hours of a guy counting stuff? No thanks, man." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "Every Friday! My buddy and I are gonna watch Die Hard again tonight. We've got it memorized. 'Yippee-ki-yay' — you know the rest!",
    followUp: { playerText: "What'd you watch last week?", npcText: "Coming to America! Eddie Murphy is gnarly, dude. He plays like five characters. We were dying the whole time." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "My friend's older brother rented this horror tape last week and we watched it in his basement. I totally wasn't scared. Not even a little.",
    followUp: { playerText: "Come on, which one?", npcText: "...Fine. It was some alien thing. I slept with the lights on but that's only because my lamp was broken. Stuck on. Totally." },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "Thanks! It's a Batman tee. I waited in line for two hours to see that movie. Totally tubular. Keaton is the best Batman ever.",
    followUp: { playerText: "Two hours?", npcText: "Dude, the line went around the block. But it was worth it. That Batmobile? Radical." },
  },
];

const LATE80S_COUPLE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "I want Dirty Dancing. He wants Die Hard. This happens every single Friday and I'm getting tired of it.",
    followUp: { playerText: "Try a comedy?", npcText: "...Coming to America? Actually, we both laughed at that one. Okay, fine. Comedy it is. But next week, it's MY pick." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "Every Friday since we started dating. Rent a movie, order a pizza, argue about the movie for an hour after. It's our thing.",
    followUp: { playerText: "Sounds perfect actually.", npcText: "It really is. Last week we watched Princess Bride and he actually cried at the end. He'll deny it. But I saw it." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "Beetlejuice! We both loved it. Something about Michael Keaton in that makeup — we were laughing the whole time.",
    followUp: { playerText: "That's a good one.", npcText: "Right? And now we both do the 'Day-O' thing at dinner parties. Our friends hate us. Totally worth it." },
  },
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "Top Gun has romance AND jets. It's basically the perfect compromise movie. Plus the volleyball scene... I mean, the flight scenes.",
    followUp: { playerText: "Smooth save.", npcText: "Listen, that movie has something for everyone. Action, romance, a rad soundtrack. It's the total package. Don't judge me." },
  },
];

const LATE80S_REGULAR: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "Rain or shine. Vinny saved me a copy of Die Hard before it even hit the shelf. That's the kind of service you can't get at the mall.",
    followUp: { playerText: "What's your go-to genre?", npcText: "This month it's action. Last month I was on a comedy kick — Coming to America, Beetlejuice. Gotta keep rotating." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "Batman just came in and everyone's fighting over the two copies. I told Vinny to hold one for me. Perks of being a regular.",
    followUp: { playerText: "Think it lives up to the hype?", npcText: "Totally. Tim Burton went dark with it. It's not the TV show. Nicholson as Joker is radical. Worth the wait." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny and I go way back. He's the one who told me to watch Princess Bride when everyone else was renting Top Gun. He was right.",
    followUp: { playerText: "He seems like a good guy.", npcText: "The best. He once special-ordered a tape for me that wasn't even in the system. Nowhere else does that." },
  },
  {
    playerPrompt: "What's overrated right now?",
    npcResponse: "Don't hate me, but I think Top Gun is overrated. It's fine. But people act like it changed cinema. It changed haircuts, maybe.",
    followUp: { playerText: "Hot take.", npcText: "Hey, I've been coming here long enough to have opinions. Vinny agrees with me. He just won't say it out loud because it still rents." },
  },
];

const LATE80S_NEWBIE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Yeah! My neighbor said this place is totally radical. There's so many tapes. Do people really watch all of these?",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "Okay but which one? I keep picking up boxes and reading the back. Die Hard sounds gnarly but I don't know if I like action movies." },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "Yes! Everyone keeps talking about Batman and Rain Man but I haven't seen either. Where do I even start?",
    followUp: { playerText: "What kind of mood are you in?", npcText: "Something fun? Not too intense. My friend said Beetlejuice is funny. Is it scary funny or funny funny?" },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "Nothing's on TV and my roommate said there's a video store on this street. I didn't even know these existed until like a month ago.",
    followUp: { playerText: "Welcome to the club.", npcText: "Thanks! This is way better than waiting for movies to come on HBO. You can just... pick what you want? That's totally tubular." },
  },
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "I saw Coming to America in the theater! It was so funny. Wait — I can just rent it and watch it AGAIN? At home? Whenever I want?",
    followUp: { playerText: "That's kind of the whole idea.", npcText: "This is the best thing ever. I'm gonna be here every week. I have so many movies to catch up on!" },
  },
];

const LATE80S_KID: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "I want the one with Roger Rabbit! He's SO funny and the cartoons are IN the real world! How did they DO that?!",
    followUp: { playerText: "You can only rent a few though.", npcText: "But I also want Beetlejuice! And the one with the dog from space! Can I come back tomorrow? PLEASE?" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "My mom is looking at boring grown-up movies. She said I could pick ONE. But Roger Rabbit AND Beetlejuice are both right here!",
    followUp: { playerText: "Which one's your favorite?", npcText: "Roger Rabbit because he's funny! No wait — Beetlejuice because he's gross and funny! Can I pick two? I'll be really good!" },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "I LOVE movies! I want to watch every single one! My favorite is the one where the guy says 'Beetlejuice' three times!",
    followUp: { playerText: "Be careful saying that.", npcText: "BEETLEJUICE BEETLEJUICE BEETLE— my mom told me to stop doing that in public. Hehe." },
  },
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "My dad let me watch the beginning of Top Gun but then the jets were SO LOUD and I hid behind the couch. The jets are radical though!",
    followUp: { playerText: "Jets are pretty cool.", npcText: "I'm gonna be a jet pilot AND a movie star AND a ghost hunter like in Beetlejuice! When I grow up!" },
  },
];

const LATE80S_CRITIC: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Die Hard is competent, I'll grant it that. McTiernan understands spatial filmmaking. But calling it a masterpiece? Please. It's a B-movie with an A-budget.",
    followUp: { playerText: "What meets your standards?", npcText: "Wings of Desire came out last year. Wim Wenders. But of course they don't stock it here. This is a popcorn establishment." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "They have Batman front and center. A comic book movie. Meanwhile, Rain Man is buried in the back like an afterthought. That tells you everything.",
    followUp: { playerText: "You seem tough to impress.", npcText: "I prefer 'discerning.' Anyone can enjoy Beetlejuice. It takes effort to appreciate what Kieslowski is doing in Europe right now." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "I rewatched The Princess Bride, which is... acceptable. Goldman's screenplay has genuine wit. Though the fantasy elements are rather on the nose.",
    followUp: { playerText: "Acceptable? People love that movie.", npcText: "People also love Top Gun, which is essentially a recruitment ad with a soundtrack. Popular and good are not synonyms." },
  },
  {
    playerPrompt: "What about the big blockbusters?",
    npcResponse: "Predator is what happens when you give testosterone a camera. Schwarzenegger fighting an alien. How very... American.",
    followUp: { playerText: "It's a fun movie though.", npcText: "...*sigh* Fine. The creature design is genuinely inspired. Stan Winston's work transcends the material. I'll give it that much." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  EARLY 90s (1990-1993)
// ══════════════════════════════════════════════════════════════════

const EARLY90S_MOVIE_BUFF: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "Terminator 2. Cameron pushed visual effects into a new era. The liquid metal T-1000 isn't just a gimmick — it's storytelling through technology.",
    followUp: { playerText: "Better than the original?", npcText: "Different. The first one is horror. The sequel is epic action. Cameron understood the shift. He made a war movie disguised as sci-fi." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "Silence of the Lambs just swept the Oscars — all five major categories. Jonathan Demme's close-up work is why. He puts you IN Clarice's perspective. Genius.",
    followUp: { playerText: "Those close-ups are intense.", npcText: "That's deliberate. The characters look directly into the lens. It breaks the fourth wall without breaking it. Demme studied Hitchcock. You can tell." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "Groundhog Day. Everyone thinks it's just a Bill Murray comedy, but Harold Ramis constructed a perfect existential parable. It's Camus with laughs.",
    followUp: { playerText: "That's a deep cut for a comedy.", npcText: "The best comedies always are. Murray goes through denial, hedonism, despair, and finally genuine change. That's the human condition in ninety minutes." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "Jurassic Park. Spielberg blended practical animatronics with CGI and the result is... I've never seen anything like it. The T-Rex breakout scene will be studied for decades.",
    followUp: { playerText: "The dinosaurs look so real.", npcText: "Stan Winston's puppets for the close-ups, ILM's digital for the wide shots. Spielberg knew when to use which. That's the craft nobody talks about." },
  },
];

const EARLY90S_PARENT: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Home Alone is a lifesaver. The kids have watched it three times already and they STILL laugh at the paint cans. I can finally fold laundry in peace.",
    followUp: { playerText: "They never get tired of it?", npcText: "Never. And honestly? I still laugh at the tarantula scene. But don't tell them I said that. I'm supposed to be the mature one." },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "My kids just saw Jurassic Park at a friend's house and NOW they can't sleep. Dinosaurs in every nightmare. I told them it was too old for them.",
    followUp: { playerText: "Need a recommendation?", npcText: "Something with zero dinosaurs, zero screaming, and zero things that will make my children sleep in my bed for a week. Aladdin, maybe?" },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "Aladdin is on permanent repeat in my house. My daughter sings 'A Whole New World' at breakfast, lunch, and dinner. I hear it in my sleep.",
    followUp: { playerText: "Could be worse.", npcText: "You're right. Last month it was Hook and my son kept jumping off the couch screaming 'BANGARANG!' He broke a lamp. So yeah. Aladdin is fine." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "The Bodyguard for me after the kids go to bed. Whitney Houston's voice is the only adult conversation I'll get tonight.",
    followUp: { playerText: "Self-care is important.", npcText: "That's what I tell myself every Friday while I eat ice cream out of the tub and watch Kevin Costner carry Whitney. NOT!" },
  },
];

const EARLY90S_TEENAGER: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "Terminator 2! The T-1000 is da bomb. When he walks through the bars? My friend tried to do that at school. It did NOT work.",
    followUp: { playerText: "Ever try anything slower?", npcText: "My mom made me watch A Few Good Men. It's just people talking in a room. Boring! ...Okay, the 'you can't handle the truth' part was kinda cool." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "Every weekend! We rented Wayne's World last week and now everyone at school talks like Wayne. 'Excellent!' 'Party on!' It's all that and a bag of chips.",
    followUp: { playerText: "What'd you watch last week?", npcText: "Home Alone again. I know I'm too old for it but the traps are genius. I tried to build one in my room. My dad was NOT happy." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "Silence of the Lambs. My friend's brother rented it and we watched it when his parents were out. I did NOT sleep that night. NOT!",
    followUp: { playerText: "Come on, that scared you?", npcText: "Pfft, no! I was just... not tired. That's all. Hannibal Lecter is cool actually. The mask and everything. I'm totally not scared of him. As if!" },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "It's a Jurassic Park tee! I got it at the movie theater. The dinosaurs are da bomb. I want to be a paleontologist now. Or maybe a fighter pilot. Both?",
    followUp: { playerText: "Why not both?", npcText: "Right?! My guidance counselor says I should 'pick one thing.' Talk to the hand! I can be whatever I want!" },
  },
];

const EARLY90S_COUPLE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "I want The Bodyguard — Whitney and Kevin! She wants Terminator 2 — robots and explosions. This is our Friday routine. NOT fun.",
    followUp: { playerText: "Try a comedy?", npcText: "Wayne's World? Party time! Excellent! ...Actually, yeah. We both quote that movie constantly. Good call." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "Every Friday. We had a fight over Silence of the Lambs last week. I loved it, she said it ruined dinner. Apparently cannibalism kills the mood.",
    followUp: { playerText: "Sounds perfect actually.", npcText: "We're a work in progress. But honestly, the arguing IS the date night. We'd be bored if we agreed. All that and a bag of chips." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "Hook! We're both Spielberg fans and Robin Williams made us feel like kids again. We were flying around the living room after.",
    followUp: { playerText: "That's sweet.", npcText: "Don't tell anyone we had a sword fight with wrapping paper tubes. We're adults. Theoretically." },
  },
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "Groundhog Day is pure comedy and Bill Murray is a genius. Plus it's secretly romantic. Win-win for date night.",
    followUp: { playerText: "A comedy that works for both of you?", npcText: "Exactly! I mean, he relives the same day over and over. Kinda like our Friday night arguments. NOT!" },
  },
];

const EARLY90S_REGULAR: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "Vinny had Jurassic Park behind the counter for me before it even hit the shelf. I didn't even have to ask. That man knows me.",
    followUp: { playerText: "What's your go-to genre?", npcText: "Right now it's thrillers. Silence of the Lambs rewired my brain. Before that I was on a Spielberg kick — Hook, then Jurassic Park. The man doesn't miss." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "A Few Good Men just came in. Nicholson and Cruise going at it? I told Vinny to grab me a copy first thing. Perks of being a loyal customer.",
    followUp: { playerText: "Think it lives up to the hype?", npcText: "Absolutely. Aaron Sorkin wrote it and you can FEEL the dialogue crackling. It's da bomb. Even the courtroom stuff is electric." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny and I go way back. He convinced me to watch Groundhog Day when I wanted another action movie. Changed my whole perspective.",
    followUp: { playerText: "He seems like a good guy.", npcText: "He's the reason this store exists for me. Any other place is just shelves. Vinny makes it a neighborhood." },
  },
  {
    playerPrompt: "What's overrated right now?",
    npcResponse: "Don't come for me, but Home Alone. It's cute. It's fine. But people act like it's the greatest comedy ever made. It's a kid with booby traps.",
    followUp: { playerText: "Careful, people love that movie.", npcText: "And I respect that! But this is a safe space. Between you and me? I've seen funnier stuff in Wayne's World. NOT!" },
  },
];

const EARLY90S_NEWBIE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Yeah, my coworker said this place is all that and a bag of chips. I just moved to the neighborhood. Where do I start?",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "Okay but there's like a thousand tapes. Everyone says Jurassic Park but I'm not sure about dinosaurs. Do they have, like, a top ten list?" },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "Please! Everyone at work keeps quoting Wayne's World and I've never seen it. I feel so left out. Where would that be?",
    followUp: { playerText: "What kind of mood are you in?", npcText: "Fun? Something I can talk about at work on Monday? I keep hearing 'Party on, Wayne!' and I just smile and nod." },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "Honestly, nothing's on TV and I'm tired of sitting at home. A friend said I HAVE to see Aladdin. Isn't that a cartoon though? I'm an adult.",
    followUp: { playerText: "Aladdin is great at any age.", npcText: "Really? The Genie is Robin Williams, right? Okay, I trust you. This is exciting! I feel like I've been missing out." },
  },
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "Home Alone! I saw that in the theater! That kid is so smart. Wait, I can watch it at home now? Whenever I want? That's wild.",
    followUp: { playerText: "Welcome to the video store experience.", npcText: "I love this already. I'm telling everyone about this place. Do you guys have those membership cards?" },
  },
];

const EARLY90S_KID: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "ALADDIN! The Genie is SO FUNNY! He does all the voices and he's blue and he SINGS! I want to be a genie when I grow up!",
    followUp: { playerText: "You can only rent a few though.", npcText: "But I ALSO want Hook! Peter Pan can FLY and there's a food fight and BANGARANG! Can I please get two? I'll share!" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "My dad is looking at the boring movies. He said I could pick ONE but Aladdin AND Home Alone are both right here and I can't CHOOSE!",
    followUp: { playerText: "Which one's your favorite?", npcText: "Aladdin because the carpet flies! No wait, Home Alone because the bad guys fall down! No wait... can I pick both? Pretty please?" },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "I LOVE movies! My favorite is Home Alone! That kid is SO COOL! He puts traps everywhere and the bad guys always get bonked on the head!",
    followUp: { playerText: "Ever tried building traps?", npcText: "I put a bucket of water on my brother's door! He was SO MAD but it was JUST like the movie! Mom said I'm not allowed to do that anymore." },
  },
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "My mom let me watch some of Jurassic Park but then the BIG dinosaur ate somebody and she turned it off! I want to see the REST!",
    followUp: { playerText: "Maybe when you're older.", npcText: "That's what EVERYONE says! I'm not even scared! ...Okay maybe a LITTLE. But the dinosaurs are SO COOL! Do they have a dinosaur movie without the eating parts?" },
  },
];

const EARLY90S_CRITIC: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Silence of the Lambs is the one bright spot. Demme's use of subjective camera is legitimate filmmaking. Everything else here is... spectacle.",
    followUp: { playerText: "What meets your standards?", npcText: "Have you seen Raise the Red Lantern? Zhang Yimou? Of course not — they'd never stock it here. This place caters to the Terminator 2 crowd." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "Jurassic Park gets an entire wall display. A theme park movie about a theme park. The irony is lost on everyone, apparently.",
    followUp: { playerText: "You seem tough to impress.", npcText: "Spielberg is capable of Schindler's List. So why does he keep making dinosaur rides? The man's talent is inversely proportional to his box office." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "I watched The Double Life of Veronique last month. Kieslowski creates mood through color and music in ways American directors can't comprehend.",
    followUp: { playerText: "Never heard of it.", npcText: "Of course you haven't. It's Polish-French. This country thinks 'foreign film' means a British accent. ...Groundhog Day is tolerable, I'll admit. Ramis has hidden depth." },
  },
  {
    playerPrompt: "What about the big blockbusters?",
    npcResponse: "Terminator 2 is a technical achievement, I'll concede. Cameron understands scale. But the script is paint-by-numbers Hollywood savior mythology.",
    followUp: { playerText: "It's a fun movie though.", npcText: "...*sigh* The truck chase sequence IS genuinely thrilling. And the T-1000 effects are... fine, they're groundbreaking. But that doesn't make it ART." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  MID 90s (1994-1996)
// ══════════════════════════════════════════════════════════════════

const MID90S_MOVIE_BUFF: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "Pulp Fiction. Tarantino deconstructed narrative structure and made it feel effortless. The non-linear timeline isn't a gimmick — it's the point.",
    followUp: { playerText: "Is it really that revolutionary?", npcText: "He took the French New Wave, mixed it with grindhouse and diner culture, and created something entirely new. The Royale with Cheese scene alone — that's dialogue as jazz." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "Shawshank Redemption bombed at the box office, you know. But I'm telling you — Frank Darabont directed a perfect film. Roger Deakins' cinematography is phat.",
    followUp: { playerText: "Why'd it bomb?", npcText: "Bad marketing. Who wants to see a prison movie? But word of mouth on video is going to make this the most rented tape in history. Mark my words." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "Fargo. The Coen Brothers made a crime thriller set in Minnesota with a pregnant cop as the hero. Joel Coen's framing is immaculate. Every shot is a painting.",
    followUp: { playerText: "I've heard it's dark.", npcText: "It's dark AND funny. That's the Coens — they find comedy in violence without ever being cruel about it. Frances McDormand deserves every award. Word." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "Toy Story. Pixar just changed cinema forever and most people don't even realize it. John Lasseter directed the first fully computer-animated feature. This is the future.",
    followUp: { playerText: "An animated movie changed cinema?", npcText: "The technology is revolutionary, but Lasseter understood that tech means nothing without story. Woody and Buzz are some of the best-written characters in years. Fly as hell." },
  },
];

const MID90S_PARENT: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "The Lion King has been in our VCR for two months straight. I can perform the entire Circle of Life. With choreography. Against my will.",
    followUp: { playerText: "Kids really love that one.", npcText: "My daughter cries at the Mufasa scene EVERY TIME and then immediately rewinds it to watch it again. I don't understand children." },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "Toy Story just came out on tape and both my kids want their own copy. I said we're SHARING. You'd think I suggested they share a kidney.",
    followUp: { playerText: "Need a recommendation?", npcText: "Something long enough for me to take a bath. Uninterrupted. For once. If The Lion King buys me ninety minutes of peace, it's priceless." },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "My son saw Independence Day and now he builds spaceships out of everything. Cereal boxes, shoes, the dog's bed. Everything is a spaceship now.",
    followUp: { playerText: "At least he's creative.", npcText: "Creative is one word for it. My shoe was on the roof last Tuesday. He said it was 'escaping the atmosphere.' I can't even be mad." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "Toy Story for the kids, Forrest Gump for me after bedtime. Tom Hanks makes me cry every time. That's my Friday. No shame.",
    followUp: { playerText: "Forrest Gump is a tearjerker.", npcText: "When he's talking to Jenny at the bench? Done. I'm done. I go through half a box of tissues. My husband pretends not to notice." },
  },
];

const MID90S_TEENAGER: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "Independence Day! When Will Smith punches the alien and goes 'Welcome to Earth'? Phat! Most fly movie of the year, easy!",
    followUp: { playerText: "Ever try anything slower?", npcText: "My English teacher made us watch Shawshank Redemption. I thought it would be boring but... okay, it was actually kinda good. Don't tell anyone at school." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "Every Friday! Me and my crew rented Clueless last week — my friend picked it, okay? Not me. But it was actually funny. 'As if!'",
    followUp: { playerText: "What'd you watch last week?", npcText: "Se7en. Dude. That ending. Me and my friend just sat there with our mouths open. We couldn't even talk. Phat movie but messed up." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "Se7en. It's not even jump scares — it just gets under your skin. Brad Pitt's face at the end? I still think about it. Word.",
    followUp: { playerText: "Come on, that scared you?", npcText: "I'm not SCARED. I'm... disturbed. There's a difference. My friend won't even watch it again. I would though. Totally. Probably. Maybe." },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "Thanks, it's a Braveheart tee. 'FREEDOM!' My friend and I yell that in the hallway at school. The principal told us to stop. Wassup with that?",
    followUp: { playerText: "Maybe not the best place for battle cries.", npcText: "Whatever, it's fly. Mel Gibson painted his face blue and charged an army. If that's not the coolest thing ever, I don't know what is." },
  },
];

const MID90S_COUPLE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "She wants Clueless. I want Braveheart. Three hours of Scottish warfare versus high school fashion. We're at an impasse. As usual.",
    followUp: { playerText: "Try a comedy?", npcText: "Hmm... Forrest Gump? It's funny AND dramatic AND romantic. Something for both of us. You might have just saved date night." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "We tried Pulp Fiction last week. She loved the dance scene. I loved the whole thing. We both agreed the gimp scene was... unexpected. Not a typical date movie.",
    followUp: { playerText: "Sounds perfect actually.", npcText: "It was actually great. We stayed up till 2am talking about the timeline. That's the sign of a good movie — and a good date. Word." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "The Lion King! We went ironically and then both cried during Mufasa's death. In the theater. Surrounded by children. No regrets.",
    followUp: { playerText: "No shame in that.", npcText: "Hakuna Matata is now our couple motto. When things get stressful? 'Hakuna Matata, babe.' It actually works. Disney is phat." },
  },
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "Toy Story is amazing for date night. You wouldn't think it but there's something about Woody and Buzz that makes you appreciate your partner. It's fly, trust me.",
    followUp: { playerText: "An animated movie for date night?", npcText: "Hey, we're secure enough. Besides, the movie is about jealousy and friendship and accepting change. Sounds like every relationship to me." },
  },
];

const MID90S_REGULAR: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "Vinny saved me Pulp Fiction before the Friday rush. Everyone wants it. But loyal customers come first in this store.",
    followUp: { playerText: "What's your go-to genre?", npcText: "I've been on a crime kick since Pulp Fiction. Fargo, Se7en — anything with moral complexity. Vinny built me a whole shelf of recommendations." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "Independence Day just dropped and it's flying off the shelves. Fun popcorn movie. But between you and me? Fargo is the real gem this season.",
    followUp: { playerText: "Think it lives up to the hype?", npcText: "ID4 does exactly what it promises — aliens go boom. But Fargo stays with you. Frances McDormand in that role? Phat. Just phat." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny pushed Shawshank Redemption on me when nobody was renting it. Said 'trust me.' Best recommendation I ever got. The man's got taste.",
    followUp: { playerText: "He seems like a good guy.", npcText: "He's the soul of this place. Any store can stock tapes. Vinny curates an experience. That's why I've never gone anywhere else." },
  },
  {
    playerPrompt: "What's overrated right now?",
    npcResponse: "Forrest Gump. It's fine. Hanks is great. But it beat Pulp Fiction AND Shawshank for Best Picture? That's a crime. A literal crime against cinema.",
    followUp: { playerText: "Strong opinion.", npcText: "Come back in ten years and tell me which movie people are still talking about. It won't be the chocolate metaphor. Word." },
  },
];

const MID90S_NEWBIE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Yeah! My friend said this place has everything. I keep seeing Pulp Fiction everywhere — is it good? The cover looks kinda intense.",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "But I don't even know what genre I like! I saw The Lion King last year and loved it, but is it weird to rent a cartoon as a grown-up?" },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "Everyone keeps quoting Forrest Gump and I haven't seen it. 'Life is like a box of chocolates' — I don't get the reference! Help!",
    followUp: { playerText: "What kind of mood are you in?", npcText: "Something... uplifting? I heard Shawshank Redemption is good. But it's a prison movie? That doesn't sound uplifting. I'm confused." },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "I got a VCR for Christmas and I've only used it to watch the news. My coworker said 'that's whack' and sent me here. So... wassup? What do I rent?",
    followUp: { playerText: "Welcome to a whole new world.", npcText: "This is incredible. All these movies, just waiting. I feel like a kid in a candy store. Where's the line? Do I take a number?" },
  },
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "Toy Story! I saw the previews on TV. A movie made entirely by computer? That sounds fake. Is it actually good?",
    followUp: { playerText: "It's amazing, trust me.", npcText: "Okay, I'm trying it. My friend said to get Independence Day too. Can I rent two? Is that allowed? I don't know the rules here." },
  },
];

const MID90S_KID: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "TOY STORY! Woody and Buzz are the BEST! 'To infinity and beyond!' I say that before I jump off the couch! Mom hates it!",
    followUp: { playerText: "You can only rent a few though.", npcText: "But The Lion King is right THERE and I want to sing Hakuna Matata! And I haven't finished watching all the parts of Independence Day! PLEASE?" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "My mom said I could pick ONE movie and I've been holding Toy Story for ten minutes but WHAT IF Lion King is better?! I can't decide!",
    followUp: { playerText: "Which one's your favorite?", npcText: "Toy Story because Buzz can FLY! Wait no, he can't really fly, he falls with style! That's even COOLER! ...but Simba is a lion and lions are cool too!" },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "I watch The Lion King EVERY DAY! I know ALL the words! 'NANTS INGONYAMA BAGITHI BABA!' That's how it starts! I can sing the WHOLE thing!",
    followUp: { playerText: "That's impressive.", npcText: "My dad says I should be on Broadway. I don't know what that is but it sounds like it has good snacks! Can I sing it for you? NAAANTS—" },
  },
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "My big brother let me watch SOME of Independence Day and the alien spaceship was SO BIG and then Will Smith PUNCHED an alien! POW!",
    followUp: { playerText: "Was it scary?", npcText: "No! I'm BRAVE! ...but when the city blew up I hid behind the couch a little bit. Just because the couch is comfy back there. Not because I was scared." },
  },
];

const MID90S_CRITIC: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "Pulp Fiction has merit. Tarantino's pastiche of genre conventions is clever, if a bit self-congratulatory. He's a video store clerk playing auteur.",
    followUp: { playerText: "What meets your standards?", npcText: "Three Colors: Red. Kieslowski's trilogy finale. But they only have one copy, filed incorrectly under 'foreign.' The categorization here is offensive." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "Forrest Gump outsells Shawshank Redemption three to one here. America prefers comfortable simplicity over genuine artistry. Nothing changes.",
    followUp: { playerText: "You seem tough to impress.", npcText: "I watched Fargo, which demonstrates the Coens at their most refined. Then I had to walk past an Independence Day cardboard display to get here. The whiplash was nauseating." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "I saw Clueless, which is — and I cannot believe I'm saying this — an astute adaptation of Emma by Jane Austen. Amy Heckerling has more depth than she's given credit for.",
    followUp: { playerText: "You liked Clueless?", npcText: "I didn't say I LIKED it. I said it has merit. There's a difference. The social commentary is sharper than anything in Braveheart. Though that's an admittedly low bar." },
  },
  {
    playerPrompt: "What about the big blockbusters?",
    npcResponse: "Independence Day is jingoistic nonsense with a Will Smith charisma delivery system attached. It's everything wrong with modern cinema in two hours. *sigh*",
    followUp: { playerText: "It's a fun movie though.", npcText: "...*sigh* The production design IS ambitious. And Bill Pullman's speech is... effective. I suppose spectacle has its place. A small, dimly lit place. But a place." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  LATE 90s (1997-1999)
// ══════════════════════════════════════════════════════════════════

const LATE90S_MOVIE_BUFF: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "The Matrix. The Wachowskis fused Hong Kong wire work with cyberpunk philosophy and bullet time. It's Baudrillard's Simulacra as an action movie.",
    followUp: { playerText: "That sounds like a lot for an action movie.", npcText: "That's what makes it genius. You can enjoy it as pure spectacle OR as a meditation on reality. The red pill metaphor is going to define a generation." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "Fight Club is Fincher at his most subversive. The twist recontextualizes every scene. He hid Tyler in single frames throughout the film. That's craft.",
    followUp: { playerText: "The twist is incredible.", npcText: "Fincher broke the first rule twice — he made a movie about anti-consumerism that's also a masterclass in production design. The irony is intentional. Whatever, it's phat." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "The Big Lebowski. The Coens made a Raymond Chandler mystery with a stoner as the detective. Jeff Bridges basically IS the Dude. The bowling sequences are Fellini-esque.",
    followUp: { playerText: "I've heard it's weird.", npcText: "It's INTENTIONALLY weird. Every scene that seems random connects to something later. It's structured chaos. People will be studying this film in twenty years." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "The Sixth Sense. Shyamalan directed a horror film with the restraint of a classical drama. The twist isn't a trick — it's earned through character development.",
    followUp: { playerText: "Everyone's talking about the twist.", npcText: "And once you know it, every scene transforms. Watch Bruce Willis's face in the restaurant scene. He already knows. Shyamalan planted clues in the blocking. Masterful." },
  },
];

const LATE90S_PARENT: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "My kids want The Matrix. They're TEN. They saw the poster and now they won't stop doing that back-bend dodge thing in the living room. Someone's gonna break a lamp.",
    followUp: { playerText: "Maybe start with something lighter?", npcText: "That's what I said! But they heard 'kung fu' and 'dodge bullets' and their brains shut off. I'm grabbing The Truman Show instead. Educational, right?" },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "My teenager quoted American Pie at the dinner table. In front of Grandma. I have never wanted the earth to swallow me more. I need a family movie. NOW.",
    followUp: { playerText: "Need a recommendation?", npcText: "Something so wholesome it erases what just happened. Does Good Will Hunting count? Robin Williams is in it. Anything with Robin Williams feels safe. ...Is it safe?" },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "My son saw The Sixth Sense at a sleepover and now he whispers 'I see dead people' every time we drive past a cemetery. It's been three months.",
    followUp: { playerText: "That phase will pass.", npcText: "Will it? Because last week he whispered it at his grandmother's birthday dinner. She didn't think it was funny. I didn't think it was funny. HE thought it was hilarious." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "Titanic for me. Again. My husband says he's 'not watching a three-hour boat movie again.' So I'll wait until he falls asleep at nine. Whatever.",
    followUp: { playerText: "It's a great movie.", npcText: "Leo dies and I cry. Every time. My husband says 'he could have fit on that door.' NOT THE POINT, DAVID. It's about love and sacrifice and— see, I'm already getting emotional." },
  },
];

const LATE90S_TEENAGER: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "The Matrix! Neo dodges bullets in slow motion! My friend tried it at recess and faceplanted. It was hilarious. But the movie? Phat. Beyond phat.",
    followUp: { playerText: "Ever try anything slower?", npcText: "My dad made me watch Saving Private Ryan. I thought war movies were boring but dude... that beach scene? I couldn't even talk after. My dad was crying. Don't tell him I told you." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "Every weekend! My whole crew rented American Pie last week. We laughed so hard my friend spit soda on the TV. His mom was SO mad.",
    followUp: { playerText: "What'd you watch last week?", npcText: "Fight Club. Whatever, the first rule is I can't talk about it. But seriously? It messed me up. In a good way. I think. I'm still processing." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "The Sixth Sense. It's not even gory — it just creeps into your brain. That kid sees dead people and you start looking around YOUR house like 'wait, am I alone?'",
    followUp: { playerText: "Come on, that scared you?", npcText: "I'm not SCARED. But I definitely checked under my bed that night. Just, like, standard bed maintenance. Whatever. Talk to the hand." },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "Thanks! It's a Matrix tee. 'There is no spoon.' Everyone at school is wearing these now. Y2K is coming and we're all gonna be in the Matrix anyway.",
    followUp: { playerText: "You worried about Y2K?", npcText: "My dad bought like fifty cans of beans. I'm more worried about running out of movies to rent. What if the computers crash and they lose my rental history? That's the real crisis." },
  },
];

const LATE90S_COUPLE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "She wants Titanic for the fifth time. I want The Matrix. She says three hours of Leo is better than two hours of leather coats. We're stuck.",
    followUp: { playerText: "Try a comedy?", npcText: "The Big Lebowski? 'The Dude abides.' Actually, yeah. We both loved that. Nobody dies on a door. Nobody dodges bullets. Just bowling. Perfect." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "We saw Titanic in theaters and I pretended I wasn't crying. She saw the tears. She has photographic evidence. It's been our thing ever since — weep together on Fridays.",
    followUp: { playerText: "Sounds perfect actually.", npcText: "It really is. Last week we watched Good Will Hunting and both lost it during the 'it's not your fault' scene. We went through an entire tissue box. All that." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "The Truman Show! We watched it twice in one weekend. Then we started jokingly checking our house for cameras. It's... stopped being a joke.",
    followUp: { playerText: "A little paranoia?", npcText: "She keeps waving at the smoke detector. I keep narrating my life when I open the fridge. Jim Carrey broke us. In the best way." },
  },
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "Office Space. Trust me. If either of you has ever worked in a cubicle, this movie will feel like therapy. We watched it and immediately called in sick on Monday.",
    followUp: { playerText: "Calling in sick after a movie?", npcText: "We had a 'case of the Mondays.' Our boss didn't get the reference. Which made it even funnier. Whatever, he wouldn't understand." },
  },
];

const LATE90S_REGULAR: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "Vinny had The Matrix behind the counter before I even walked in. He saw me through the window and just knew. The man's psychic.",
    followUp: { playerText: "What's your go-to genre?", npcText: "Lately it's everything. Fight Club, The Matrix, Big Lebowski — the late 90s are hitting different. Vinny says this is a golden era. I think he's right." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "Office Space just came in and nobody's talking about it yet. That's how you know it's good — the quiet ones always blow up later. Vinny agrees.",
    followUp: { playerText: "Think it lives up to the hype?", npcText: "There is no hype yet. That's the beauty. In six months everyone will be quoting 'I believe you have my stapler.' You heard it here first." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny told me to watch Good Will Hunting when I was going through a rough patch. 'It's not your fault,' he said, quoting the movie. Then he said it again for real. That's Vinny.",
    followUp: { playerText: "He seems like a good guy.", npcText: "He's not just a good guy — he's the guy who remembers your name, your taste, and what you need before you know you need it. All that." },
  },
  {
    playerPrompt: "What's overrated right now?",
    npcResponse: "Titanic. There, I said it. It's a fine movie. Kate and Leo are great. But it didn't need to be three hours and he COULD have fit on that door.",
    followUp: { playerText: "You're brave saying that out loud.", npcText: "I said it to Vinny last week and he laughed. He said half his customers agree but won't say it because their girlfriends will dump them. Phat take though." },
  },
];

const LATE90S_NEWBIE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Yeah! Everyone at work keeps talking about The Matrix — red pill, blue pill? I don't get any of the references. I need to catch up.",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "But there's so many! My friend said Fight Club is a must-see but I can't talk about it? That's confusing. Do I just... grab it?" },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "Okay, everyone keeps quoting The Big Lebowski and I'm lost. 'The Dude abides?' 'That rug really tied the room together?' What does any of that MEAN?",
    followUp: { playerText: "What kind of mood are you in?", npcText: "Something fun? Not too intense? My coworker said American Pie is hilarious but also warned me about... a scene. Should I be worried?" },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "Y2K is coming and I figured if the world ends, I should at least see the movies everyone's been talking about. The Sixth Sense — people keep whispering about a twist?",
    followUp: { playerText: "Don't let anyone spoil it.", npcText: "Three people have already tried! I cover my ears at work now. 'LA LA LA I HAVEN'T SEEN IT YET.' ...Is it really that good? Whatever, I'm getting it." },
  },
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "Titanic! I saw it in theaters! I cried so hard the person next to me gave me their napkin. Can I really just... watch it again? At home?",
    followUp: { playerText: "As many times as you want.", npcText: "I'm gonna cry in PRIVATE this time. No strangers. No shared napkins. Just me, Leo, and a full box of tissues. This is the best thing ever." },
  },
];

const LATE90S_KID: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "I want the one where the kid sees ghosts! My brother said it's SO SCARY! I'm not scared though! I'm BRAVE! ...Is it really scary?",
    followUp: { playerText: "You can only rent a few though.", npcText: "Okay then the one with the funny bowling guy! My dad watches it and laughs SO HARD. 'The Dude!' I want to be The Dude when I grow up!" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "My dad is looking at something called Fight Club but mom said NO because of the name. Now they're arguing. Can I just pick a movie while they fight?",
    followUp: { playerText: "Which one's your favorite?", npcText: "The Truman Show! Because WHAT IF my life is a TV show too?! I've been checking for cameras at school! My teacher says I need to stop but WHAT IF SHE'S AN ACTRESS?!" },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "My favorite movie is the one where the boat sinks! Titanic! But NOT the sinking part. The part where they run around the boat! That part is FUN!",
    followUp: { playerText: "You like the adventure parts?", npcText: "Yeah! And the part where he draws! I started drawing because of that movie! I drew our cat like the painting scene! Mom put it on the fridge!" },
  },
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "My big brother let me watch SOME of The Matrix and there was KUNG FU and SLOW MOTION and a guy DODGED A BULLET! I've been trying to dodge things ALL WEEK!",
    followUp: { playerText: "How's that going?", npcText: "I dodged a ball at recess! ...Actually it hit me in the face. But I was TRYING to do the Matrix thing! I just need more practice! Maybe by Y2K I'll be ready!" },
  },
];

const LATE90S_CRITIC: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "The Matrix is competent genre filmmaking with philosophical pretensions. The Wachowskis read one Baudrillard book and built a franchise around it. How very American.",
    followUp: { playerText: "What meets your standards?", npcText: "The Thin Red Line. Malick spent twenty years away from cinema and returned with a war film that makes Saving Private Ryan look like a recruitment video. But it's buried in the back here, naturally." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "Titanic has its own display shelf. A melodrama with a love triangle on a boat. Cameron confuses spectacle with depth. And the public confuses box office with quality.",
    followUp: { playerText: "You seem tough to impress.", npcText: "Good Will Hunting is... surprisingly genuine. Damon and Affleck can actually write. Van Sant directed with appropriate restraint. I'm as shocked as you are." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "Fight Club is Fincher's most overrated work. The anti-consumerism message packaged as consumer entertainment. Though the craft is undeniable. The editing alone... *sigh*.",
    followUp: { playerText: "But you kind of liked it?", npcText: "I respect it. There's a difference. The unreliable narrator structure is well-executed. And Pitt is genuinely charismatic. Whatever. Don't tell anyone I said that." },
  },
  {
    playerPrompt: "What about the big blockbusters?",
    npcResponse: "American Pie reduced an entire generation's taste to bodily fluid humor. It's the logical endpoint of Hollywood's race to the bottom. I need a palate cleanser.",
    followUp: { playerText: "It's a fun movie though.", npcText: "...*sigh* The ensemble cast has... chemistry. And the Eugene Levy scenes demonstrate legitimate comedic timing. There. That's all the credit I'll give. That is all that." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  PRESENT (2024-2026)
// ══════════════════════════════════════════════════════════════════

const PRESENT_MOVIE_BUFF: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What's the best movie in here?",
    npcResponse: "Honestly? Being in a video store again is the best movie. I stream everything now but it's not the same. You can't browse on an algorithm. This is how cinema was meant to be discovered.",
    followUp: { playerText: "You miss physical media?", npcText: "Miss it? I mourn it. There's something about reading the back of a VHS case, seeing the wear on a popular tape. That's community. Netflix doesn't have fingerprints." },
  },
  {
    playerPrompt: "You seem to know a lot about movies.",
    npcResponse: "I grew up in stores like this. My entire film education came from wandering these aisles. Now kids just scroll past masterpieces because the thumbnail doesn't pop.",
    followUp: { playerText: "Streaming isn't all bad.", npcText: "Access is great, sure. But curation matters more. A video store employee who says 'trust me, try this' is worth more than ten thousand algorithm suggestions. Always was." },
  },
  {
    playerPrompt: "Any hidden gems I should know about?",
    npcResponse: "Everything here is a hidden gem now. When's the last time you held a VHS tape? Felt the weight of it? This store is a museum of how we used to love movies.",
    followUp: { playerText: "That's surprisingly emotional.", npcText: "Friday nights used to mean something. The whole family in the car, arguing about what to rent. Now everyone just watches their own screen in their own room. This place is a time machine." },
  },
  {
    playerPrompt: "What do you think of the new releases?",
    npcResponse: "The new stuff is fine, but I keep gravitating toward the old tapes. There's a Shawshank Redemption copy here with a cracked case and I almost cried. I rented this exact copy in '95.",
    followUp: { playerText: "The same copy?", npcText: "Maybe not literally. But maybe literally. That sticker on the spine, the wear on the label... it's like running into an old friend. This store understands something streaming never will." },
  },
];

const PRESENT_PARENT: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "I brought my kids here to show them how we used to watch movies. They asked me why the TV is so small on the box. They've never seen a VHS tape. I feel ancient.",
    followUp: { playerText: "How are they taking it?", npcText: "My daughter asked where the skip button is. My son tried to swipe the tape like a phone screen. I'm failing as a parent. But they think the store is 'aesthetic,' which I think means cool?" },
  },
  {
    playerPrompt: "Rough night?",
    npcResponse: "Honestly, I'm here because screen time is out of control. Tablets, phones, laptops — I need my kids to experience ONE movie the old-fashioned way. Start to finish. No pausing.",
    followUp: { playerText: "Need a recommendation?", npcText: "Something they can't get on Disney Plus. Something that feels special because it's HERE, in this store, on a tape. I want them to understand what Friday nights used to be." },
  },
  {
    playerPrompt: "Your kids like movies?",
    npcResponse: "They like content. Seven-second clips, reaction videos, movie summaries. They've 'seen' a hundred movies without watching a single one. I'm staging an intervention.",
    followUp: { playerText: "This store might help.", npcText: "That's the plan. No algorithm. No autoplay. Pick a tape, put it in, and watch the WHOLE thing. Revolutionary concept in 2025. I can't believe I'm saying that." },
  },
  {
    playerPrompt: "Big Friday night plans?",
    npcResponse: "I'm recreating the Friday night video store run from when I was a kid. Rent a movie, make popcorn on the stove — not the microwave — and sit together. No phones allowed.",
    followUp: { playerText: "Sounds perfect.", npcText: "My kids think I'm being dramatic. But when that tape clicks into the VCR and the tracking lines show up? That's real. That's a moment. They'll thank me later. Maybe." },
  },
];

const PRESENT_TEENAGER: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "What are you looking for?",
    npcResponse: "My mom dragged me here. She keeps saying 'this is how we did it.' Like, okay? I can watch literally anything on my phone right now. But I guess this is... kinda cool?",
    followUp: { playerText: "Give it a chance.", npcText: "Fine. These boxes are actually kinda fire though? The artwork is way better than Netflix thumbnails. And there's something about not knowing what to pick. It's like a game." },
  },
  {
    playerPrompt: "Come here a lot?",
    npcResponse: "First time. My friend posted this place on TikTok and it went viral. Everyone's coming here for the aesthetic. But like... these movies are actually old. In a good way?",
    followUp: { playerText: "What'd you watch last week?", npcText: "Whatever the algorithm picked. I honestly don't remember. That's the thing — here you have to actually CHOOSE. It hits different when you commit to one movie." },
  },
  {
    playerPrompt: "What's the scariest movie here?",
    npcResponse: "I've seen every horror movie on every streaming platform. But something about these old VHS covers is creepier than anything on Hulu. The low-res artwork? Terrifying.",
    followUp: { playerText: "Old horror is a different vibe.", npcText: "My friend said old horror movies are scarier because they couldn't use CGI. Like they had to ACTUALLY be creepy with just cameras and stuff. That's lowkey impressive." },
  },
  {
    playerPrompt: "Nice shirt.",
    npcResponse: "Thanks, it's vintage. I got it from a thrift store. It's from some 90s movie I haven't seen but the design goes hard. Everyone at school is wearing retro stuff now.",
    followUp: { playerText: "You should watch the actual movie.", npcText: "Wait, these shirts are from REAL movies? I thought they were just designs. ...Okay, maybe this store is more useful than I thought. Which one is it?" },
  },
];

const PRESENT_COUPLE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Can't decide?",
    npcResponse: "We have seventeen streaming subscriptions and we spend more time scrolling than watching. Someone told us about this place and... yeah. We're trying the old way.",
    followUp: { playerText: "How's it going?", npcText: "Better? There's like a hundred options instead of ten thousand. And we can't just 'save it for later' and never watch it. We have to commit. It's weirdly romantic." },
  },
  {
    playerPrompt: "Date night?",
    npcResponse: "We're doing a retro date. Video store, pizza from the place next door, no phones for the whole movie. It's either going to be amazing or we'll realize we have nothing to talk about.",
    followUp: { playerText: "Sounds perfect actually.", npcText: "She found out about this on Instagram. 'Video stores are back,' she said. I'm just happy we're not watching another true crime documentary on the couch." },
  },
  {
    playerPrompt: "What's the last movie you both liked?",
    npcResponse: "Honestly? We can't remember. We start things and never finish. The last thing we watched all the way through was probably in a theater. This is our reset.",
    followUp: { playerText: "Committing to a movie is underrated.", npcText: "Exactly! When you rent a tape, you're watching THAT tape. No switching. No phone. Just us and the movie. I think we needed this more than we knew." },
  },
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "The guy at the counter recommended something we'd never pick from an algorithm. That's the magic — a human who looks at you and says 'I think you'd like this.' When's the last time a robot did that?",
    followUp: { playerText: "That's what stores like this are for.", npcText: "We're going to make this a weekly thing. I can already feel us becoming regulars. Is that weird? We've been here fifteen minutes and I already feel at home." },
  },
];

const PRESENT_REGULAR: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "You're here every week, huh?",
    npcResponse: "I've been coming since this place reopened. Everyone told me video stores were dead. But Vinny proved them wrong. This is the only place that feels real anymore.",
    followUp: { playerText: "What's your go-to genre?", npcText: "I've been revisiting everything. Stuff I rented as a kid, movies I missed. It's like catching up with old friends. Streaming has everything, but this has soul." },
  },
  {
    playerPrompt: "What's good this week?",
    npcResponse: "Everything's good because it's physical. You hold it, you read the back, you smell the case. Try sniffing a Netflix thumbnail. It doesn't work. I've tried.",
    followUp: { playerText: "You sniffed a Netflix thumbnail?", npcText: "I put my nose on the TV. My wife asked if I needed help. I said I needed a video store. And here I am. Every Friday. Living my truth." },
  },
  {
    playerPrompt: "Know anyone who works here?",
    npcResponse: "Vinny is the last of his kind. A video store owner who actually watches every movie in the store. In an age of algorithms, that man is an endangered species.",
    followUp: { playerText: "He seems like a good guy.", npcText: "He remembered my name after one visit. He remembered what I rented. He remembered what I LIKED. Amazon knows my data. Vinny knows my taste. There's a difference." },
  },
  {
    playerPrompt: "Don't you just stream stuff?",
    npcResponse: "I have every streaming service. Every single one. And I spend thirty minutes scrolling, give up, and rewatch The Office. Here? I grab a tape and I'm watching in ten minutes.",
    followUp: { playerText: "The paradox of too much choice.", npcText: "Exactly. This store has limits. That's the feature, not the bug. Vinny curated these shelves. An algorithm curated my streaming queue. Vinny wins every time." },
  },
];

const PRESENT_NEWBIE: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "First time here?",
    npcResponse: "Yeah, I saw this on TikTok! A real video store? I thought these all closed. What's a VHS? Wait, is that one of those big tapes? This is wild.",
    followUp: { playerText: "Yeah, pick one and bring it to the counter.", npcText: "You mean I can't just add it to my queue? I have to TALK to someone? And CARRY it? ...Actually that's kind of nice. It feels more intentional." },
  },
  {
    playerPrompt: "Need help finding something?",
    npcResponse: "I've never been in one of these before. My parents talk about video stores like they were magical. I thought they were exaggerating but... it IS kinda magical?",
    followUp: { playerText: "What kind of mood are you in?", npcText: "I literally don't know what to do without a recommendation algorithm. Just... looking at covers and reading synopses? Is this how people used to discover movies? It's actually fun." },
  },
  {
    playerPrompt: "What brings you in tonight?",
    npcResponse: "Algorithm fatigue. I've been watching whatever Netflix tells me to watch for years. My friend said 'go to the video store and pick something random.' So here I am.",
    followUp: { playerText: "Welcome to the analog experience.", npcText: "I love it? There's no 'because you watched...' section. No '97% match.' Just shelves of movies I've never heard of. This is how it should be. Why did we stop doing this?" },
  },
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "I recognize the titles from memes! Wait — these are REAL MOVIES? I thought 'Be Kind, Rewind' was just something people said on the internet!",
    followUp: { playerText: "Every meme started somewhere.", npcText: "Okay, I need to rent like ten of these and understand all the references I've been faking for years. Can I get a stack? Is there a bulk discount?" },
  },
];

const PRESENT_KID: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Hey there! What are you looking for?",
    npcResponse: "My mom said this is a REAL video store like in the OLDEN DAYS! You pick up an ACTUAL box and take it HOME! It's like a LIBRARY but for MOVIES!",
    followUp: { playerText: "You can only rent a few though.", npcText: "But they're ALL so cool! The boxes have PICTURES on them! On my iPad the pictures are tiny but HERE they're BIG! Can I take pictures of all of them?" },
  },
  {
    playerPrompt: "Are you here with your parents?",
    npcResponse: "My dad is showing me how he used to watch movies! You put the tape in a big machine and it PLAYS! No remote! No pause! He said it's 'the way it was meant to be!'",
    followUp: { playerText: "Which one's your favorite?", npcText: "I don't KNOW any of them! But the covers are SO COOL! This one has a DRAGON! And this one has a SPACESHIP! Everything on Netflix just looks the same but HERE every box is different!" },
  },
  {
    playerPrompt: "Do you like movies?",
    npcResponse: "I watch movies on my iPad! But my mom says this is DIFFERENT and SPECIAL! She said when SHE was a kid, coming here was the BEST PART of Friday!",
    followUp: { playerText: "She's right, it is special.", npcText: "I wanna come here EVERY Friday! It's way better than scrolling! I can TOUCH the movies! And the guy at the counter KNOWS stuff! Siri doesn't know stuff like he does!" },
  },
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "My dad put on some OLD movie from when HE was a kid and it was ACTUALLY really good! The screen was kinda fuzzy but the story was COOL! It had robots!",
    followUp: { playerText: "Old movies can be great.", npcText: "My dad was SO happy I liked it! He was smiling the WHOLE time! He kept saying 'this is the one I watched when I was YOUR age!' I think he was gonna cry!" },
  },
];

const PRESENT_CRITIC: CustomerDialogueTemplate[] = [
  {
    playerPrompt: "Finding anything good?",
    npcResponse: "I find it ironic that physical media is having a 'renaissance' now that everyone's realized streaming has homogenized taste. I said this would happen in 2015. Nobody listened.",
    followUp: { playerText: "What meets your standards?", npcText: "The fact that this store exists at all meets my standards today. Someone chose to curate a collection rather than surrender to algorithms. That's an act of artistic resistance." },
  },
  {
    playerPrompt: "What do you think of this place?",
    npcResponse: "It's a monument to a better era of film consumption. When people had to commit to a choice. Streaming turned cinema into wallpaper. This store treats it like art.",
    followUp: { playerText: "You seem... positive?", npcText: "Don't get used to it. The selection still over-indexes on crowd-pleasers. But the CONCEPT is sound. Physical media demands attention. A VHS tape can't autoplay the next episode. That's a feature." },
  },
  {
    playerPrompt: "Seen anything good lately?",
    npcResponse: "I've been rewatching classics on VHS deliberately. The grain, the tracking lines, the imperfection — it adds something. Digital clarity has paradoxically made cinema less... cinematic.",
    followUp: { playerText: "You prefer worse quality?", npcText: "I prefer TEXTURE. Film grain is not a flaw — it's a medium. Watching Kubrick on a 4K OLED is technically superior and spiritually bankrupt. *sigh* But I can't explain that to the streaming generation." },
  },
  {
    playerPrompt: "Why not just stream at home?",
    npcResponse: "Because streaming has turned film into fast food. Infinite choice, zero commitment, forgotten by morning. This store forces intentionality. You pick one movie. You live with that choice. That's respect.",
    followUp: { playerText: "That's surprisingly passionate.", npcText: "...*sigh* Don't tell anyone I was enthusiastic. I have a reputation to maintain. But yes. This place matters. More than its owner probably realizes. I'll deny saying that." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  GENERIC FALLBACK (era-agnostic, original templates)
// ══════════════════════════════════════════════════════════════════

const GENERIC_MOVIE_BUFF: CustomerDialogueTemplate[] = [
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

const GENERIC_PARENT: CustomerDialogueTemplate[] = [
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

const GENERIC_TEENAGER: CustomerDialogueTemplate[] = [
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

const GENERIC_COUPLE: CustomerDialogueTemplate[] = [
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
  {
    playerPrompt: "Any recommendations for us?",
    npcResponse: "Something with a good mix — action for one, story for the other. Comedies usually work. Or a thriller, those are neutral territory.",
    followUp: { playerText: "Neutral territory?", npcText: "It's like the DMZ of date night. Nobody loses, nobody wins. We both get something. That's marriage, baby." },
  },
];

const GENERIC_REGULAR: CustomerDialogueTemplate[] = [
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
  {
    playerPrompt: "What's overrated right now?",
    npcResponse: "Half the new releases wall. But I won't name names because Vinny's got to sell them. I respect the hustle.",
    followUp: { playerText: "Come on, just one.", npcText: "...The one with the explosion on the cover. You know the one. Everyone rents it, nobody talks about it after. That tells you everything." },
  },
];

const GENERIC_NEWBIE: CustomerDialogueTemplate[] = [
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
  {
    playerPrompt: "See anything you recognize?",
    npcResponse: "A couple! I saw some of these in the theater. Didn't know you could just rent them and watch them again. That's amazing.",
    followUp: { playerText: "That's the beauty of a video store.", npcText: "I think I'm going to like this place. Is it always this busy on Fridays?" },
  },
];

const GENERIC_KID: CustomerDialogueTemplate[] = [
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
  {
    playerPrompt: "What did you watch last?",
    npcResponse: "The one with the funny animal! It makes silly noises and my brother laughs SO HARD he spits his juice! Mom doesn't think it's funny but WE do!",
    followUp: { playerText: "Sounds like a good time.", npcText: "It's the BEST time! Friday is movie night and movie night is the BEST night! Can every night be Friday?" },
  },
];

const GENERIC_CRITIC: CustomerDialogueTemplate[] = [
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
  {
    playerPrompt: "What about the big blockbusters?",
    npcResponse: "Blockbusters are the fast food of cinema. Engineered for mass consumption. Occasionally one transcends its category. Rarely.",
    followUp: { playerText: "Any guilty pleasures?", npcText: "...*sigh* I won't dignify that with a response. ...But if I did, it would involve a heist movie I've seen seven times. I won't say which one." },
  },
];

// ══════════════════════════════════════════════════════════════════
//  LOOKUP TABLES
// ══════════════════════════════════════════════════════════════════

const ERA_TOPICS: Record<EraId, Record<PersonalityType, CustomerDialogueTemplate[]>> = {
  late80s: {
    movie_buff: LATE80S_MOVIE_BUFF,
    parent: LATE80S_PARENT,
    teenager: LATE80S_TEENAGER,
    couple: LATE80S_COUPLE,
    regular: LATE80S_REGULAR,
    newbie: LATE80S_NEWBIE,
    kid: LATE80S_KID,
    critic: LATE80S_CRITIC,
  },
  early90s: {
    movie_buff: EARLY90S_MOVIE_BUFF,
    parent: EARLY90S_PARENT,
    teenager: EARLY90S_TEENAGER,
    couple: EARLY90S_COUPLE,
    regular: EARLY90S_REGULAR,
    newbie: EARLY90S_NEWBIE,
    kid: EARLY90S_KID,
    critic: EARLY90S_CRITIC,
  },
  mid90s: {
    movie_buff: MID90S_MOVIE_BUFF,
    parent: MID90S_PARENT,
    teenager: MID90S_TEENAGER,
    couple: MID90S_COUPLE,
    regular: MID90S_REGULAR,
    newbie: MID90S_NEWBIE,
    kid: MID90S_KID,
    critic: MID90S_CRITIC,
  },
  late90s: {
    movie_buff: LATE90S_MOVIE_BUFF,
    parent: LATE90S_PARENT,
    teenager: LATE90S_TEENAGER,
    couple: LATE90S_COUPLE,
    regular: LATE90S_REGULAR,
    newbie: LATE90S_NEWBIE,
    kid: LATE90S_KID,
    critic: LATE90S_CRITIC,
  },
  present: {
    movie_buff: PRESENT_MOVIE_BUFF,
    parent: PRESENT_PARENT,
    teenager: PRESENT_TEENAGER,
    couple: PRESENT_COUPLE,
    regular: PRESENT_REGULAR,
    newbie: PRESENT_NEWBIE,
    kid: PRESENT_KID,
    critic: PRESENT_CRITIC,
  },
};

const GENERIC_TOPICS: Record<PersonalityType, CustomerDialogueTemplate[]> = {
  movie_buff: GENERIC_MOVIE_BUFF,
  parent: GENERIC_PARENT,
  teenager: GENERIC_TEENAGER,
  couple: GENERIC_COUPLE,
  regular: GENERIC_REGULAR,
  newbie: GENERIC_NEWBIE,
  kid: GENERIC_KID,
  critic: GENERIC_CRITIC,
};

// ── Build a rich dialogue tree from templates ──────────────────

export function buildCustomerDialogue(
  personality: NpcPersonality,
  npcName: string,
  relationshipLevel: number,
  canFreeChat: boolean,
  eraId?: string,
): DialogueTree {
  const portrait = personality.type[0].toUpperCase();

  // Select era-specific templates if available, otherwise generic
  let templates: CustomerDialogueTemplate[];
  if (eraId && eraId in ERA_TOPICS) {
    templates = ERA_TOPICS[eraId as EraId][personality.type] || GENERIC_TOPICS[personality.type];
  } else {
    templates = GENERIC_TOPICS[personality.type] || GENERIC_TOPICS.regular;
  }

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
