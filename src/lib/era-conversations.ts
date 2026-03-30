// Era-specific conversation database for Friday Night Video
// Each era has one-liners and multi-line conversations referencing only period-accurate movies

export interface EraConversation {
  lines: { speaker: string; text: string }[];
}

export interface EraConversationSet {
  oneLiners: { speaker: string; text: string }[];
  conversations: EraConversation[];
}

export const ERA_CONVERSATIONS: Record<string, EraConversationSet> = {

  // ═══════════════════════════════════════════════════════════════
  // LATE 80s (1987-1989)
  // ═══════════════════════════════════════════════════════════════
  "late80s": {
    oneLiners: [
      { speaker: "Roger", text: "Did you see Batman yet? Jack Nicholson as the Joker is absolutely terrifying." },
      { speaker: "Laura", text: "My husband has rented Dirty Dancing four Fridays in a row. I'm not even mad anymore." },
      { speaker: "Liam", text: "You HAVE to see Die Hard. Best action movie ever made. Don't even argue with me." },
      { speaker: "Jessica", text: "Have you seen Big? Tom Hanks playing a kid is the funniest thing I've ever seen." },
      { speaker: "George", text: "Top Gun made me want to be a fighter pilot. Then I found out I need glasses." },
      { speaker: "Bella", text: "They just got The Princess Bride in. Inconceivable!" },
      { speaker: "Brian", text: "I heard RoboCop is super violent. Like, actually disturbing violent." },
      { speaker: "Sarah", text: "Be kind, rewind! I keep forgetting. Got charged a buck last time." },
      { speaker: "Kid", text: "Can we get Crocodile Dundee again? That's not a knife... THIS is a knife!" },
      { speaker: "Chris", text: "Rain Man was incredible. Dustin Hoffman deserved every award." },
      { speaker: "Roger", text: "Coming to America is Eddie Murphy's best movie and that's a hill I'll die on." },
      { speaker: "Laura", text: "Beetlejuice is the weirdest movie I've ever loved. Michael Keaton is a genius." },
      { speaker: "Jessica", text: "I rented Lethal Weapon for the third time. Mel Gibson and Danny Glover are perfect together." },
      { speaker: "George", text: "Predator is the most intense thing I've ever watched. Schwarzenegger versus an alien!" },
      { speaker: "Liam", text: "Can you believe you can just WATCH movies at home now? Any night of the week?" },
      { speaker: "Bella", text: "We do this every Friday. Rent two movies, grab a pizza. Best night of the week." },
      { speaker: "Kid", text: "Mom! They have Ghostbusters! Can we get Ghostbusters? Pleeeease?" },
      { speaker: "Brian", text: "Full Metal Jacket messed me up. That drill sergeant scene is burned into my brain." },
      { speaker: "Sarah", text: "Planes, Trains and Automobiles made me laugh until I cried. John Candy is a treasure." },
    ],
    conversations: [
      // Batman hype
      {
        lines: [
          { speaker: "Liam", text: "Have you seen the new Batman yet?" },
          { speaker: "George", text: "The Michael Keaton one? No way he can pull off Batman." },
          { speaker: "Liam", text: "That's what I thought! But Jack Nicholson as the Joker? Incredible." },
          { speaker: "George", text: "Okay, maybe I'll give it a shot." },
        ],
      },
      // Top Gun vs Dirty Dancing
      {
        lines: [
          { speaker: "Roger", text: "I want Top Gun. Maverick and Goose, jets, the whole thing." },
          { speaker: "Laura", text: "We watched Top Gun LAST Friday. It's my turn. Dirty Dancing." },
          { speaker: "Roger", text: "Nobody puts Baby in a corner? That's the big moment?" },
          { speaker: "Laura", text: "Yes. And you're going to love it. Again." },
        ],
      },
      // Kid begging for Beetlejuice
      {
        lines: [
          { speaker: "Kid", text: "Mom! Can we get Beetlejuice? It's got ghosts and monsters!" },
          { speaker: "Bella", text: "Isn't that a little scary for you, honey?" },
          { speaker: "Kid", text: "No way! It's funny scary! The guy says Beetlejuice three times and he appears!" },
          { speaker: "Bella", text: "Fine. But if you have nightmares, don't come to my room." },
        ],
      },
      // Predator vs Aliens debate
      {
        lines: [
          { speaker: "Brian", text: "Predator or Aliens? You can only pick one." },
          { speaker: "Chris", text: "That's impossible. Don't make me choose." },
          { speaker: "Brian", text: "Gun to my head? Predator. Schwarzenegger is unstoppable." },
          { speaker: "Chris", text: "Wrong. Aliens. Sigourney Weaver would destroy Schwarzenegger." },
        ],
      },
      // Friday night ritual
      {
        lines: [
          { speaker: "Laura", text: "We do this every Friday. Rent two movies, get a pizza." },
          { speaker: "Jessica", text: "Same! It's the best part of the week." },
          { speaker: "Laura", text: "My husband always wants action. I always want romance. We compromise on comedy." },
          { speaker: "Jessica", text: "That's marriage right there." },
        ],
      },
      // VHS excitement
      {
        lines: [
          { speaker: "George", text: "Can you believe you can just WATCH movies at home now? Whenever you want?" },
          { speaker: "Roger", text: "I know! My parents used to have to go to the drive-in." },
          { speaker: "George", text: "The future is here, man." },
        ],
      },
      // Princess Bride fans
      {
        lines: [
          { speaker: "Sarah", text: "As you wish." },
          { speaker: "Jessica", text: "Oh my gosh, you've seen The Princess Bride?" },
          { speaker: "Sarah", text: "Seen it? I've rented it five times. Hello, my name is Inigo Montoya." },
          { speaker: "Jessica", text: "You killed my father. Prepare to die! I love that movie so much." },
        ],
      },
      // Die Hard Christmas debate
      {
        lines: [
          { speaker: "Liam", text: "Die Hard is a Christmas movie. End of discussion." },
          { speaker: "Bella", text: "It takes place at Christmas, but it's not a CHRISTMAS movie." },
          { speaker: "Liam", text: "It has a Christmas party. Christmas music. Snow. It counts." },
          { speaker: "Bella", text: "By that logic, Lethal Weapon is a Christmas movie too." },
          { speaker: "Liam", text: "...it is." },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // EARLY 90s (1990-1993)
  // ═══════════════════════════════════════════════════════════════
  "early90s": {
    oneLiners: [
      { speaker: "Roger", text: "My kids have watched Home Alone about four hundred times. I can quote the entire movie." },
      { speaker: "Liam", text: "Terminator 2 is the greatest sequel ever made. The liquid metal? Unreal." },
      { speaker: "Jessica", text: "I tried to rent Silence of the Lambs but they only had one copy. ONE copy!" },
      { speaker: "Laura", text: "The dinosaurs in Jurassic Park look SO real. How did they do that?" },
      { speaker: "George", text: "Wayne's World! Party time! Excellent! ...sorry, I can't stop saying that." },
      { speaker: "Bella", text: "My daughter watches Aladdin every single day. Every. Single. Day." },
      { speaker: "Brian", text: "A Few Good Men... you can't HANDLE the truth! Ha. Gets me every time." },
      { speaker: "Sarah", text: "The new release wall is already picked clean. It's six PM on a Friday, people." },
      { speaker: "Chris", text: "I heard there's a late fee on my account? That tape was NOT late." },
      { speaker: "Roger", text: "Hook is actually pretty good. Dustin Hoffman as Captain Hook is perfect." },
      { speaker: "Laura", text: "Has anyone tried LaserDisc? My neighbor has one. The picture is amazing but the discs are huge." },
      { speaker: "Kid", text: "KEVIN! Keep the change, ya filthy animal!" },
      { speaker: "Jessica", text: "Robin Williams in a dress. That's all you need to know about Mrs. Doubtfire." },
      { speaker: "George", text: "Groundhog Day is hilarious. Bill Murray reliving the same day over and over." },
      { speaker: "Bella", text: "Have you heard that Whitney Houston song from The Bodyguard? It's on the radio every five minutes." },
      { speaker: "Liam", text: "Tombstone is the best western ever made. Val Kilmer as Doc Holliday? Perfection." },
      { speaker: "Brian", text: "Sister Act is actually really funny. Whoopi Goldberg singing in a church? Classic." },
      { speaker: "Sarah", text: "Unforgiven proved Clint Eastwood is still the man. That ending gave me chills." },
      { speaker: "Kid", text: "I want the one with the Genie! A whole new world!" },
    ],
    conversations: [
      // Jurassic Park awe
      {
        lines: [
          { speaker: "Roger", text: "I just saw Jurassic Park in theaters. I'm still shaking." },
          { speaker: "Laura", text: "The T-Rex scene?" },
          { speaker: "Roger", text: "When it breaks out of the paddock and the water is shaking in the cup? I almost passed out." },
          { speaker: "Laura", text: "We need to rent it the SECOND it comes to video." },
        ],
      },
      // Home Alone quotathon
      {
        lines: [
          { speaker: "Kid", text: "Keep the change, ya filthy animal!" },
          { speaker: "Jessica", text: "Please. If I hear one more Home Alone quote I'm going to lose it." },
          { speaker: "Kid", text: "KEVIN!" },
          { speaker: "Jessica", text: "I'm leaving." },
        ],
      },
      // Late fee argument
      {
        lines: [
          { speaker: "Brian", text: "Three dollars in late fees? For ONE day?" },
          { speaker: "Sarah", text: "You should have returned it on time." },
          { speaker: "Brian", text: "I DID return it on time! The drop box was full!" },
          { speaker: "Sarah", text: "Sure it was." },
        ],
      },
      // Mrs. Doubtfire
      {
        lines: [
          { speaker: "Laura", text: "Robin Williams in a dress. That's all you need to know." },
          { speaker: "George", text: "Is it actually funny or just weird?" },
          { speaker: "Laura", text: "Both. It's both. And somehow it also makes you cry." },
          { speaker: "George", text: "That man can do anything." },
        ],
      },
      // The Bodyguard
      {
        lines: [
          { speaker: "Jessica", text: "Have you heard that Whitney Houston song from The Bodyguard?" },
          { speaker: "Bella", text: "I Will Always Love You? It's been on the radio every five minutes." },
          { speaker: "Jessica", text: "My husband plays the cassette in the car. On repeat. I'm hearing it in my sleep." },
        ],
      },
      // T2 debate
      {
        lines: [
          { speaker: "Liam", text: "Dude, Terminator 2 is the greatest sequel ever made." },
          { speaker: "George", text: "I respect that, but Godfather Part Two exists." },
          { speaker: "Liam", text: "Okay but does the Godfather have a liquid metal robot?" },
          { speaker: "George", text: "...I'll give you that one." },
        ],
      },
      // Silence of the Lambs
      {
        lines: [
          { speaker: "Roger", text: "I finally watched Silence of the Lambs last night." },
          { speaker: "Chris", text: "And? Could you sleep?" },
          { speaker: "Roger", text: "I had to leave the lights on. Anthony Hopkins is genuinely terrifying." },
          { speaker: "Chris", text: "A nice Chianti... I can never drink wine the same way again." },
        ],
      },
      // Wayne's World
      {
        lines: [
          { speaker: "Brian", text: "Party time! Excellent!" },
          { speaker: "Bella", text: "Oh no, not the Wayne's World quotes again." },
          { speaker: "Brian", text: "Schwing!" },
          { speaker: "Bella", text: "I'm going to the drama section. Far away from you." },
          { speaker: "Brian", text: "That's what she said! ...wait, wrong movie." },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // MID 90s (1994-1996)
  // ═══════════════════════════════════════════════════════════════
  "mid90s": {
    oneLiners: [
      { speaker: "Liam", text: "Life is like a box of chocolates... if I hear that one more time I might scream." },
      { speaker: "George", text: "Pulp Fiction changed everything. The dialogue, the music, the structure. All of it." },
      { speaker: "Bella", text: "My kid has watched The Lion King so many times the tape is wearing out." },
      { speaker: "Roger", text: "Toy Story is made entirely by computers. ENTIRELY. No drawings at all." },
      { speaker: "Jessica", text: "Shawshank Redemption was barely in theaters. How is it THIS good?" },
      { speaker: "Brian", text: "FREEDOM! ...sorry. Just saw Braveheart. Still pumped." },
      { speaker: "Laura", text: "Independence Day was ridiculous but I loved every second of it." },
      { speaker: "Chris", text: "Fargo is the weirdest movie I've ever seen. And I mean that as a compliment." },
      { speaker: "Sarah", text: "Have you seen Se7en? Do NOT ask me about the ending." },
      { speaker: "Roger", text: "Houston, we have a problem. I say that every time something goes wrong now." },
      { speaker: "Jessica", text: "My daughter says everything is 'totally Clueless' now. I don't know what that means." },
      { speaker: "Kid", text: "Hakuna Matata! It means no worries! Can we watch Lion King again?" },
      { speaker: "George", text: "The Royale with Cheese scene in Pulp Fiction? I think about it every time I eat a burger." },
      { speaker: "Laura", text: "Jumanji is terrifying for a kids movie. Robin Williams got sucked into a board game!" },
      { speaker: "Liam", text: "Twister was awesome. Flying cows! Who comes up with that?" },
      { speaker: "Bella", text: "Mission Impossible has the best heist scene ever. Tom Cruise hanging from that wire." },
      { speaker: "Brian", text: "Heat has the best shootout in any movie. Al Pacino versus De Niro. Finally." },
      { speaker: "Sarah", text: "As if! I just saw Clueless. Alicia Silverstone is everything." },
      { speaker: "Chris", text: "The Birdcage is hilarious. Robin Williams and Nathan Lane are comedy gold." },
    ],
    conversations: [
      // Forrest Gump fatigue
      {
        lines: [
          { speaker: "Roger", text: "Life is like a box of chocolates..." },
          { speaker: "Jessica", text: "If I hear that ONE more time I'm going to scream." },
          { speaker: "Roger", text: "Run, Forrest, run!" },
          { speaker: "Jessica", text: "I'm moving to another aisle." },
        ],
      },
      // Pulp Fiction impact
      {
        lines: [
          { speaker: "Liam", text: "Have you seen Pulp Fiction yet?" },
          { speaker: "George", text: "Twice. The dialogue in that movie is on another level." },
          { speaker: "Liam", text: "The Royale with Cheese scene? I think about it every time I order a burger." },
          { speaker: "George", text: "Tarantino is a genius. A weird genius, but a genius." },
        ],
      },
      // VHS vs DVD
      {
        lines: [
          { speaker: "Brian", text: "My neighbor just got a DVD player." },
          { speaker: "Sarah", text: "What's a DVD?" },
          { speaker: "Brian", text: "It's like a CD but with movies on it. No rewinding." },
          { speaker: "Sarah", text: "No rewinding? What's next, movies on your phone?" },
        ],
      },
      // Toy Story shock
      {
        lines: [
          { speaker: "Laura", text: "I took my kids to see Toy Story. It's all done on computers." },
          { speaker: "Bella", text: "Like, ALL of it? No drawings?" },
          { speaker: "Laura", text: "Every single frame. It looked incredible." },
          { speaker: "Bella", text: "That can't be real. How do you make a whole movie on a computer?" },
        ],
      },
      // Shawshank discovery
      {
        lines: [
          { speaker: "Chris", text: "Everybody told me to rent Shawshank Redemption." },
          { speaker: "Roger", text: "And?" },
          { speaker: "Chris", text: "It might be the best movie I've ever seen. How did I miss this in theaters?" },
          { speaker: "Roger", text: "Nobody saw it in theaters. That's the crazy part." },
        ],
      },
      // Se7en warning
      {
        lines: [
          { speaker: "George", text: "Have you seen Se7en?" },
          { speaker: "Laura", text: "No, is it good?" },
          { speaker: "George", text: "It's incredible. But the ending... I'm still thinking about it." },
          { speaker: "Laura", text: "Don't tell me! I hate spoilers." },
          { speaker: "George", text: "I wouldn't dare. Just... be ready." },
        ],
      },
      // Independence Day hype
      {
        lines: [
          { speaker: "Brian", text: "Independence Day! Will Smith punching an alien! The White House explodes!" },
          { speaker: "Jessica", text: "It's so dumb." },
          { speaker: "Brian", text: "It's AMAZING dumb. There's a difference." },
          { speaker: "Jessica", text: "...okay, it was pretty fun." },
        ],
      },
      // Lion King parent struggle
      {
        lines: [
          { speaker: "Bella", text: "My son wants Lion King again. We've watched it every day this week." },
          { speaker: "Laura", text: "Every day?" },
          { speaker: "Bella", text: "He cries at the Mufasa scene every single time but still wants to watch it." },
          { speaker: "Laura", text: "Kids are wild. Mine rewinds the 'Circle of Life' opening over and over." },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // LATE 90s (1997-1999)
  // ═══════════════════════════════════════════════════════════════
  "late90s": {
    oneLiners: [
      { speaker: "Jessica", text: "Don't tell me the ending of The Sixth Sense! I haven't seen it yet!" },
      { speaker: "Laura", text: "I'll never let go, Jack... oh god, I'm crying in a video store." },
      { speaker: "Liam", text: "The Matrix is the coolest movie I've ever seen. The bullet dodge scene? Come on." },
      { speaker: "Bella", text: "My daughter has watched Titanic eleven times. She's drawing pictures of Leonardo DiCaprio." },
      { speaker: "Brian", text: "Fight Club is... I can't even describe Fight Club. Just watch it." },
      { speaker: "Roger", text: "Have they started renting DVDs here? The picture quality is insane." },
      { speaker: "George", text: "Men in Black was hilarious. Will Smith can do no wrong." },
      { speaker: "Chris", text: "American Pie is SO gross. ...I loved it." },
      { speaker: "Sarah", text: "Good Will Hunting made me cry in public. I'm not ashamed." },
      { speaker: "Liam", text: "The Dude abides. If you don't get that reference, rent Big Lebowski immediately." },
      { speaker: "Jessica", text: "Office Space is basically a documentary about my life." },
      { speaker: "Roger", text: "Should I get the widescreen or full screen version? What's the difference?" },
      { speaker: "Laura", text: "Saving Private Ryan is the most intense movie I've ever seen. That opening twenty minutes." },
      { speaker: "Brian", text: "The Truman Show blew my mind. What if WE'RE all in a TV show?" },
      { speaker: "Bella", text: "There's Something About Mary is the funniest movie of the year. The hair gel scene!" },
      { speaker: "George", text: "Armageddon had me sobbing at the end. Don't judge me." },
      { speaker: "Kid", text: "Can we rent The Mummy? It's got mummies AND explosions!" },
      { speaker: "Sarah", text: "Shakespeare in Love was beautiful. And it won Best Picture over Saving Private Ryan!" },
      { speaker: "Chris", text: "Y2K is coming. I'm renting enough movies to last me through the apocalypse." },
    ],
    conversations: [
      // Sixth Sense spoiler crisis
      {
        lines: [
          { speaker: "Liam", text: "Have you seen The Sixth Sense?" },
          { speaker: "Jessica", text: "NO! And don't you DARE tell me anything about it." },
          { speaker: "Liam", text: "I wasn't going to! But the ending..." },
          { speaker: "Jessica", text: "LA LA LA I CAN'T HEAR YOU." },
        ],
      },
      // Titanic fatigue
      {
        lines: [
          { speaker: "Laura", text: "I'll never let go, Jack..." },
          { speaker: "Roger", text: "Oh god, not you too." },
          { speaker: "Laura", text: "It's the most romantic movie ever made!" },
          { speaker: "Roger", text: "It's three hours long. THREE HOURS. My back was killing me." },
          { speaker: "Laura", text: "You have no soul." },
        ],
      },
      // DVD discovery
      {
        lines: [
          { speaker: "George", text: "I just watched The Matrix on DVD." },
          { speaker: "Brian", text: "Is DVD really that much better?" },
          { speaker: "George", text: "It's like going from AM radio to a concert. Plus no rewinding." },
          { speaker: "Brian", text: "But what about all my tapes?" },
          { speaker: "George", text: "I don't know, man. The future is round and shiny." },
        ],
      },
      // Y2K movie night
      {
        lines: [
          { speaker: "Chris", text: "What are you renting for New Year's?" },
          { speaker: "Sarah", text: "Something lighthearted. I don't need more anxiety about Y2K." },
          { speaker: "Chris", text: "You really think computers are going to break?" },
          { speaker: "Sarah", text: "I have no idea. But I'm stocking up on movies just in case." },
        ],
      },
      // Fight Club rules
      {
        lines: [
          { speaker: "Liam", text: "First rule of Fight Club..." },
          { speaker: "Brian", text: "Don't talk about Fight Club. Yeah, everybody says that." },
          { speaker: "Liam", text: "But seriously, that movie messed me up." },
          { speaker: "Brian", text: "In a good way?" },
          { speaker: "Liam", text: "I... think so?" },
        ],
      },
      // Widescreen vs Full Screen
      {
        lines: [
          { speaker: "Roger", text: "Should I get widescreen or full screen?" },
          { speaker: "George", text: "Widescreen. Always widescreen. You see the whole picture." },
          { speaker: "Roger", text: "But there are black bars on the top and bottom." },
          { speaker: "George", text: "That's how the director intended it! Full screen cuts off the sides!" },
          { speaker: "Roger", text: "I'm getting full screen. I paid for the whole TV, I'm using the whole TV." },
        ],
      },
      // Big Lebowski cult
      {
        lines: [
          { speaker: "Chris", text: "Have you seen The Big Lebowski?" },
          { speaker: "Sarah", text: "The Jeff Bridges bowling movie? It was... weird." },
          { speaker: "Chris", text: "Weird? It's a MASTERPIECE. The rug really tied the room together." },
          { speaker: "Sarah", text: "I think you need to watch it again. And I think I need to also." },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // PRESENT DAY (2024-2026)
  // ═══════════════════════════════════════════════════════════════
  "present": {
    oneLiners: [
      { speaker: "Roger", text: "Can you believe people used to DRIVE somewhere just to watch a movie?" },
      { speaker: "Laura", text: "My kids don't even know what rewinding means." },
      { speaker: "Jessica", text: "I miss this. Friday nights at the video store. Nothing on streaming feels like this." },
      { speaker: "Brian", text: "I tried explaining late fees to my teenager. She looked at me like I was insane." },
      { speaker: "Sarah", text: "This reminds me of the store we used to go to when I was a kid." },
      { speaker: "George", text: "VHS tapes are selling for fifty bucks on eBay now. I threw out boxes of them." },
      { speaker: "Bella", text: "You could spend an hour just browsing. That was the whole point." },
      { speaker: "Chris", text: "Remember the smell? Every video store had that SMELL." },
      { speaker: "Laura", text: "We used to fight over who got to pick the movie. Now everyone just watches on their own phone." },
      { speaker: "Roger", text: "The cover art was half the experience. You'd pick a movie just because the box looked cool." },
      { speaker: "Jessica", text: "I've been scrolling Netflix for an hour. I miss just grabbing a tape and committing." },
      { speaker: "Liam", text: "My parents used to drop me off here while they went grocery shopping. Best two hours of my week." },
      { speaker: "Kid", text: "Mom, why can't we just stream it? What even IS a VHS tape?" },
      { speaker: "Bella", text: "They don't make Friday nights like they used to. This was an EVENT." },
      { speaker: "Brian", text: "Physical media is making a comeback. Vinyl, VHS, even LaserDisc. People want the real thing." },
      { speaker: "Sarah", text: "I found my old Blockbuster card in a drawer. Almost cried." },
      { speaker: "George", text: "Remember 'New Release' walls? You'd race to the store hoping your movie was still in stock." },
      { speaker: "Chris", text: "The algorithm doesn't know me like the guy behind the counter did." },
      { speaker: "Liam", text: "Be kind, rewind. Now THAT was a simpler time." },
    ],
    conversations: [
      // Streaming lament
      {
        lines: [
          { speaker: "Roger", text: "I've been scrolling Netflix for an hour and I still can't pick anything." },
          { speaker: "Laura", text: "At least here you had to commit. You picked a tape and that was your Friday." },
          { speaker: "Roger", text: "Exactly! The limitation was the POINT." },
          { speaker: "Laura", text: "Now we have everything and watch nothing." },
        ],
      },
      // Explaining to kids
      {
        lines: [
          { speaker: "Kid", text: "Mom, why are we here?" },
          { speaker: "Bella", text: "Because THIS is how we used to get movies. You walked in, you picked a tape off the shelf." },
          { speaker: "Kid", text: "That sounds really slow." },
          { speaker: "Bella", text: "It was perfect." },
        ],
      },
      // Physical media comeback
      {
        lines: [
          { speaker: "Brian", text: "I started collecting VHS tapes again." },
          { speaker: "George", text: "You're kidding. Why?" },
          { speaker: "Brian", text: "There's something about holding the movie in your hands. The art, the weight, the ritual." },
          { speaker: "George", text: "My wife thinks I'm crazy." },
          { speaker: "Brian", text: "She's not wrong. But it's a good kind of crazy." },
        ],
      },
      // Nostalgia hit
      {
        lines: [
          { speaker: "Jessica", text: "Walking in here, I swear I can smell my childhood." },
          { speaker: "Sarah", text: "The carpet, the fluorescent lights, the plastic cases..." },
          { speaker: "Jessica", text: "My dad used to let me pick one movie every Friday. It was the biggest decision of my week." },
          { speaker: "Sarah", text: "Those were genuinely the best days." },
        ],
      },
      // Algorithm vs clerk
      {
        lines: [
          { speaker: "Chris", text: "Netflix recommended me a documentary about cheese. I don't even like cheese." },
          { speaker: "Liam", text: "The guy behind the counter at our old store knew exactly what I'd like. Every time." },
          { speaker: "Chris", text: "A real human being with taste. What a concept." },
          { speaker: "Liam", text: "The algorithm will never replace a good video store clerk. Never." },
        ],
      },
      // Kids vs parents on tech
      {
        lines: [
          { speaker: "Kid", text: "Where's the Wi-Fi? I can't find the Wi-Fi." },
          { speaker: "Roger", text: "There is no Wi-Fi. You walk up to a shelf. You pick a movie. You bring it home." },
          { speaker: "Kid", text: "That's literally the most complicated thing I've ever heard." },
          { speaker: "Roger", text: "We survived. Somehow." },
        ],
      },
      // Blockbuster card discovery
      {
        lines: [
          { speaker: "Laura", text: "I found my old Blockbuster card in a drawer last week." },
          { speaker: "Jessica", text: "Oh no. Did you get emotional?" },
          { speaker: "Laura", text: "I almost framed it. Friday nights, walking those aisles, the whole family together." },
          { speaker: "Jessica", text: "They really don't make places like this anymore." },
        ],
      },
    ],
  },
};
