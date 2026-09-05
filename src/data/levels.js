/**
 * levels.js
 *
 * Describes the three mazes and the story details of each level.
 *
 * How to read a maze grid:
 *   Each level has a `grid` - an array of strings, one string per row.
 *   Every character is one cell of the maze:
 *     "#" = wall          (solid, the player cannot pass through it)
 *     "." = open floor    (walkable)
 *     "S" = start         (where the player spawns)
 *     "E" = exit          (unlocks only after every decision node is answered)
 *     "1".."8" = decision node - the digit is the position in this level's
 *                scenario list, so "1" is the first scenario from
 *                getScenariosForLevel(level), "2" the second, and so on.
 *
 * Grid coordinates are [row][col]. The 3D world converts them to x/z in
 * utils/maze.js, so nothing else in the app needs to know about this format.
 *
 * Keeping the mazes as text art means you can redesign a level by editing
 * these strings - no 3D code changes needed.
 */

export const LEVELS = [
  {
    id: 1,
    name: "First Salary",
    subtitle: "₹25,000/month fresher",
    story:
      "You just joined your first job in Bengaluru. ₹25,000 lands in your account every month. The habits you build in these twelve months will decide the next twenty years.",
    monthlySalary: 25000,
    startingBalance: 50000,
    accentColor: "#00e5ff",
    grid: [
      "#################",
      "#S#.#...#...#6..#",
      "#.#.#.#.#.#E#.#.#",
      "#.#...#...#...#.#",
      "#.###########.#.#",
      "#.1.....2...#.#5#",
      "####.###.##.###.#",
      "#..........3#...#",
      "#.#.#.#######.#.#",
      "#.#.#.........#.#",
      "#.#.#######.###.#",
      "#.#.......#.4...#",
      "###.###.#.#.#.###",
      "#...#.....#.#...#",
      "#.#########.###.#",
      "#...............#",
      "#################",
    ],
  },
  {
    id: 2,
    name: "Growing Income",
    subtitle: "₹50,000/month, 2 years in",
    story:
      "Two years and one job switch later, you take home ₹50,000. Bigger income means bigger decisions - insurance, rent versus buy, and what to do when the market falls.",
    monthlySalary: 50000,
    startingBalance: 600000,
    accentColor: "#a855f7",
    grid: [
      "#####################",
      "#S..#..............3#",
      "###.#########2#.###.#",
      "#.#...1.......#...#.#",
      "#.###.#######.###.#.#",
      "#...#.......#...#.#.#",
      "#.###.###.#.###.#.###",
      "#.....#.#.....#.#...#",
      "#.#####.#####.#.###.#",
      "#.#......E..#.......#",
      "#.###.#####.#.#####.#",
      "#...#.#.6...#.......#",
      "###.#.#.#######...###",
      "#...#.#.....#.#.#..4#",
      "#.###.#.###.#.#.###.#",
      "#.#...........#.#...#",
      "#.#######5#.#.#.#.###",
      "#.........#...#.....#",
      "#####################",
    ],
  },
  {
    id: 3,
    name: "Life Decisions",
    subtitle: "₹1,00,000/month, family stage",
    story:
      "You earn ₹1,00,000 a month. A home loan, a child's future and your parents' health all depend on the same salary. This is where planning stops being optional.",
    monthlySalary: 100000,
    startingBalance: 3500000,
    accentColor: "#fbbf24",
    grid: [
      "#######################",
      "#S..#.........#.......#",
      "###.#.#######.#.#.#####",
      "#...#.#....2#.E.#...6.#",
      "#.#####.###.#########.#",
      "#..1....#.#.....#...#.#",
      "######.##.#.###.#.#.#.#",
      "#.........#...#..3#.#.#",
      "#.#######.#.#.###.#.#.#",
      "#...#.....#.#.....#.#.#",
      "#...###.###.#####.#4#.#",
      "#.#...........#...#.#.#",
      "###.#.#####.###.###.#.#",
      "#...#...#.#.....#...#.#",
      "#.#####.#.#.#.###.###.#",
      "#...#.....#.#.....#...#",
      "#.#.#.#####...#.###.#.#",
      "#.#...#.....#.#.....#.#",
      "####.##.#####.#######5#",
      "#.......#.......#.....#",
      "#.############.##.#.#.#",
      "#.................#...#",
      "#######################",
    ],
  },
];

/** Returns one level definition by its number (1, 2 or 3). */
export function getLevel(levelId) {
  return LEVELS.find((l) => l.id === levelId);
}

/** How many levels the game has. Used to know when the player has finished. */
export const TOTAL_LEVELS = LEVELS.length;
