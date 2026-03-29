// Vinny's Mystery — cryptic movie clues for the shelf hunt challenge

export interface MovieClue {
  clue: string;
  movieTitle: string; // exact match against shelf data
  hints: string[]; // progressive hints: genre, decade, actor/director
}

export const MOVIE_CLUES: MovieClue[] = [
  {
    clue: "A shark terrorizes a beach town during summer. The police chief must overcome his fear of water to save everyone.",
    movieTitle: "Jaws",
    hints: ["Genre: Horror/Thriller", "Decade: 1970s", "Director: Steven Spielberg"],
  },
  {
    clue: "A group of scientists visit a theme park where prehistoric creatures have been brought back to life using ancient DNA.",
    movieTitle: "Jurassic Park",
    hints: ["Genre: Sci-Fi/Adventure", "Decade: 1990s", "Stars Jeff Goldblum"],
  },
  {
    clue: "A boy befriends a stranded alien and helps it phone home before the government catches it.",
    movieTitle: "E.T. the Extra-Terrestrial",
    hints: ["Genre: Family/Sci-Fi", "Decade: 1980s", "Director: Steven Spielberg"],
  },
  {
    clue: "A family moves into a remote mountain hotel for the winter. The father slowly loses his mind while his son sees visions of the past.",
    movieTitle: "The Shining",
    hints: ["Genre: Horror", "Decade: 1980s", "Stars Jack Nicholson"],
  },
  {
    clue: "The crew of a commercial spaceship answers a distress signal and discovers they are not alone. Nobody can hear you scream out there.",
    movieTitle: "Alien",
    hints: ["Genre: Sci-Fi/Horror", "Decade: 1970s", "Stars Sigourney Weaver"],
  },
  {
    clue: "A farm boy discovers he has special powers and joins a rebellion to destroy a planet-killing weapon in a galaxy far, far away.",
    movieTitle: "Star Wars",
    hints: ["Genre: Sci-Fi/Fantasy", "Decade: 1970s", "Director: George Lucas"],
  },
  {
    clue: "A teenager accidentally travels thirty years into the past in a modified sports car and must make sure his parents fall in love.",
    movieTitle: "Back to the Future",
    hints: ["Genre: Sci-Fi/Comedy", "Decade: 1980s", "Stars Michael J. Fox"],
  },
  {
    clue: "A computer hacker discovers that reality is a simulation and joins a resistance fighting the machines that control humanity.",
    movieTitle: "The Matrix",
    hints: ["Genre: Sci-Fi/Action", "Decade: 1990s", "Stars Keanu Reeves"],
  },
  {
    clue: "Three unemployed scientists start a ghost removal service in New York City. Business is booming until a god shows up.",
    movieTitle: "Ghostbusters",
    hints: ["Genre: Comedy/Sci-Fi", "Decade: 1980s", "Stars Bill Murray"],
  },
  {
    clue: "An archaeologist races Nazis to find a legendary biblical artifact hidden in an ancient Egyptian city.",
    movieTitle: "Raiders of the Lost Ark",
    hints: ["Genre: Action/Adventure", "Decade: 1980s", "Stars Harrison Ford"],
  },
  {
    clue: "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant youngest son.",
    movieTitle: "The Godfather",
    hints: ["Genre: Crime/Drama", "Decade: 1970s", "Stars Marlon Brando"],
  },
  {
    clue: "Two strangers from different social classes fall in love aboard the most famous doomed ocean liner in history.",
    movieTitle: "Titanic",
    hints: ["Genre: Romance/Drama", "Decade: 1990s", "Director: James Cameron"],
  },
  {
    clue: "A simple man with a low IQ stumbles through decades of American history, accidentally shaping major events while searching for his childhood sweetheart.",
    movieTitle: "Forrest Gump",
    hints: ["Genre: Drama/Comedy", "Decade: 1990s", "Stars Tom Hanks"],
  },
  {
    clue: "A young lion prince flees his kingdom after being tricked into thinking he caused his father's death. Years later he must return to reclaim his throne.",
    movieTitle: "The Lion King",
    hints: ["Genre: Animation/Family", "Decade: 1990s", "Features the voice of James Earl Jones"],
  },
  {
    clue: "A adventurous clownfish crosses the entire ocean to rescue his son who was taken by a scuba diver.",
    movieTitle: "Finding Nemo",
    hints: ["Genre: Animation/Family", "Decade: 2000s", "Features the voice of Ellen DeGeneres"],
  },
  {
    clue: "A weatherman finds himself reliving the same day over and over in a small Pennsylvania town during a famous groundhog celebration.",
    movieTitle: "Groundhog Day",
    hints: ["Genre: Comedy/Fantasy", "Decade: 1990s", "Stars Bill Murray"],
  },
  {
    clue: "A charismatic pirate captain seeks a cursed treasure while escaping the navy and dealing with undead sailors who can't die.",
    movieTitle: "Pirates of the Caribbean: The Curse of the Black Pearl",
    hints: ["Genre: Action/Adventure", "Decade: 2000s", "Stars Johnny Depp"],
  },
  {
    clue: "A billionaire playboy secretly builds a high-tech suit of armor and becomes a superhero after being captured by terrorists.",
    movieTitle: "Iron Man",
    hints: ["Genre: Action/Sci-Fi", "Decade: 2000s", "Stars Robert Downey Jr."],
  },
];
