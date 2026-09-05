/**
 * maze.js
 *
 * Turns the text-art maze grids from data/levels.js into things the 3D scene
 * can actually use: a list of wall boxes, node positions, and a collision test.
 *
 * The only conversion rule you need to remember:
 *   world X = (column - centreColumn) * CELL
 *   world Z = (row    - centreRow)    * CELL
 * so the maze ends up centred on the origin, which keeps the camera maths simple.
 */

/** Size of one maze cell in 3D world units. */
export const CELL = 4;

/** Half the width of a wall block - used for collision padding. */
export const WALL_HALF = CELL / 2;

/** Radius of the player sphere, also its collision radius. */
export const PLAYER_RADIUS = 0.9;

/**
 * Reads a grid and returns everything the scene needs.
 * Called once per level, and memoised by the components that use it.
 */
export function parseMaze(grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const centreRow = (rows - 1) / 2;
  const centreCol = (cols - 1) / 2;

  const walls = [];
  const nodes = [];
  let start = { x: 0, z: 0 };
  let exit = { x: 0, z: 0 };

  // A quick lookup table so collision checks are O(1) instead of scanning strings.
  const solid = [];

  for (let r = 0; r < rows; r++) {
    solid[r] = [];
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c] ?? "#";
      const isWall = ch === "#";
      solid[r][c] = isWall;

      const x = (c - centreCol) * CELL;
      const z = (r - centreRow) * CELL;

      if (isWall) {
        walls.push({ x, z, row: r, col: c });
      } else if (ch === "S") {
        start = { x, z };
      } else if (ch === "E") {
        exit = { x, z };
      } else if (ch >= "1" && ch <= "9") {
        // The digit is 1-based; scenarioIndex is 0-based into the level's list.
        nodes.push({ x, z, row: r, col: c, scenarioIndex: Number(ch) - 1 });
      }
    }
  }

  // Keep nodes in digit order so node "1" is always the first scenario.
  nodes.sort((a, b) => a.scenarioIndex - b.scenarioIndex);

  return { rows, cols, centreRow, centreCol, walls, nodes, start, exit, solid };
}

/** Converts a world position back to grid indices. */
export function worldToCell(maze, x, z) {
  return {
    col: Math.round(x / CELL + maze.centreCol),
    row: Math.round(z / CELL + maze.centreRow),
  };
}

/** True if the given grid cell is a wall (or outside the maze). */
export function isSolid(maze, row, col) {
  if (row < 0 || row >= maze.rows || col < 0 || col >= maze.cols) return true;
  return maze.solid[row][col];
}

/**
 * Collision test for a circle of PLAYER_RADIUS centred at (x, z).
 * We only look at the 3x3 block of cells around the player, so this stays fast
 * even on big mazes. Returns true when the position is free to stand in.
 */
export function canStandAt(maze, x, z) {
  const { row, col } = worldToCell(maze, x, z);

  for (let r = row - 1; r <= row + 1; r++) {
    for (let c = col - 1; c <= col + 1; c++) {
      if (!isSolid(maze, r, c)) continue;

      // Centre of this wall block in world space.
      const wx = (c - maze.centreCol) * CELL;
      const wz = (r - maze.centreRow) * CELL;

      // Closest point on the wall box to the player centre.
      const nearestX = Math.max(wx - WALL_HALF, Math.min(x, wx + WALL_HALF));
      const nearestZ = Math.max(wz - WALL_HALF, Math.min(z, wz + WALL_HALF));

      const dx = x - nearestX;
      const dz = z - nearestZ;
      if (dx * dx + dz * dz < PLAYER_RADIUS * PLAYER_RADIUS) return false;
    }
  }
  return true;
}

/**
 * Tries to move from (x, z) by (dx, dz), sliding along walls instead of
 * sticking to them. We test each axis separately - that is what makes the
 * player glide around a corner rather than stopping dead.
 */
export function moveWithCollision(maze, x, z, dx, dz) {
  let nx = x;
  let nz = z;
  if (dx !== 0 && canStandAt(maze, x + dx, z)) nx = x + dx;
  if (dz !== 0 && canStandAt(maze, nx, z + dz)) nz = z + dz;
  return { x: nx, z: nz };
}

/** Straight-line distance between two points on the floor plane. */
export function distance2D(ax, az, bx, bz) {
  return Math.hypot(ax - bx, az - bz);
}
