const GENERATION_DURATION_MS = 5000;
const SOLVE_DURATION_MS = 5000;
const CYCLE_PAUSE_MS = 3000;
const PATH_COLOR = "#1b1b1b";
const BLOCK_COLOR = "#0f0f0f";
const STANDBY_COLOR = "#3d0b0b";
const SEARCHED_COLOR = "#0c1f29";
const FINAL_PATH_COLOR = "#0f2e0d";
const ctx = document.getElementById("grid").getContext("2d");
const DIRECTIONS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
let nodeSize = 10;
let nextAlgorithm = 0;
let animationFrame = null;
let cycleTimer = null;

function shuffle(items) {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function neighbors(grid, x, y, distance = 2) {
  return DIRECTIONS.map(([dx, dy]) => [x + dx * distance, y + dy * distance])
    .filter(([nx, ny]) => nx > 0 && ny > 0 && nx < grid[0].length - 1 && ny < grid.length - 1);
}

function carve(grid, steps, x, y) {
  if (!grid[y][x]) {
    grid[y][x] = true;
    steps.push([x, y, PATH_COLOR]);
  }
}

function connect(grid, steps, from, to) {
  carve(grid, steps, ...from);
  carve(grid, steps, (from[0] + to[0]) / 2, (from[1] + to[1]) / 2);
  carve(grid, steps, ...to);
}

function generateBacktrack(grid, steps) {
  const stack = [[1, 1]];
  carve(grid, steps, 1, 1);
  while (stack.length) {
    const cell = stack[stack.length - 1];
    const choices = neighbors(grid, ...cell).filter(([x, y]) => !grid[y][x]);
    if (!choices.length) {
      stack.pop();
      continue;
    }
    const next = choices[Math.floor(Math.random() * choices.length)];
    connect(grid, steps, cell, next);
    stack.push(next);
  }
}

function generatePrim(grid, steps) {
  carve(grid, steps, 1, 1);
  const frontier = neighbors(grid, 1, 1);
  while (frontier.length) {
    const index = Math.floor(Math.random() * frontier.length);
    const cell = frontier[index];
    frontier[index] = frontier[frontier.length - 1];
    frontier.pop();
    if (grid[cell[1]][cell[0]]) continue;
    const adjacent = neighbors(grid, ...cell);
    const connected = adjacent.filter(([x, y]) => grid[y][x]);
    connect(grid, steps, connected[Math.floor(Math.random() * connected.length)], cell);
    frontier.push(...adjacent.filter(([x, y]) => !grid[y][x]));
  }
}

function generateKruskal(grid, steps) {
  const width = grid[0].length;
  const parent = Array.from({ length: width * grid.length }, (_, i) => i);
  const rank = new Uint8Array(parent.length);
  const edges = [];
  function root(id) {
    while (parent[id] !== id) {
      parent[id] = parent[parent[id]];
      id = parent[id];
    }
    return id;
  }
  for (let y = 1; y < grid.length - 1; y += 2) {
    for (let x = 1; x < width - 1; x += 2) {
      if (x + 2 < width - 1) edges.push([[x, y], [x + 2, y]]);
      if (y + 2 < grid.length - 1) edges.push([[x, y], [x, y + 2]]);
    }
  }
  for (const [from, to] of shuffle(edges)) {
    let a = root(from[1] * width + from[0]);
    let b = root(to[1] * width + to[0]);
    if (a === b) continue;
    if (rank[a] < rank[b]) [a, b] = [b, a];
    parent[b] = a;
    if (rank[a] === rank[b]) rank[a]++;
    connect(grid, steps, from, to);
  }
  // A tiny viewport can contain just one maze cell.
  carve(grid, steps, 1, 1);
}

class MinHeap {
  constructor() { this.items = []; }
  push(item) {
    const items = this.items;
    let index = items.length;
    items.push(item);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (items[parent].priority <= item.priority) break;
      items[index] = items[parent];
      index = parent;
    }
    items[index] = item;
  }
  pop() {
    const items = this.items;
    const first = items[0];
    const last = items.pop();
    if (items.length) {
      let index = 0;
      while (2 * index + 1 < items.length) {
        let child = 2 * index + 1;
        if (child + 1 < items.length && items[child + 1].priority < items[child].priority) child++;
        if (items[child].priority >= last.priority) break;
        items[index] = items[child];
        index = child;
      }
      items[index] = last;
    }
    return first;
  }
}

function solveMaze(grid) {
  const width = grid[0].length;
  const height = grid.length;
  const start = width + 1;
  const goal = (height - 2) * width + width - 2;
  const costs = new Float64Array(width * height).fill(Infinity);
  const previous = new Int32Array(width * height).fill(-1);
  const closed = new Uint8Array(width * height);
  const frontier = new MinHeap();
  const steps = [];
  costs[start] = 0;
  frontier.push({ id: start, priority: 0 });
  while (frontier.items.length) {
    const { id } = frontier.pop();
    if (closed[id]) continue;
    closed[id] = 1;
    const x = id % width;
    const y = Math.floor(id / width);
    steps.push([x, y, SEARCHED_COLOR]);
    if (id === goal) {
      const path = [];
      for (let cell = goal; cell !== -1; cell = previous[cell]) path.push(cell);
      for (const cell of path.reverse()) {
        steps.push([cell % width, Math.floor(cell / width), FINAL_PATH_COLOR]);
      }
      return steps;
    }
    for (const [nx, ny] of neighbors(grid, x, y, 1)) {
      const next = ny * width + nx;
      const cost = costs[id] + 1;
      if (!grid[ny][nx] || closed[next] || cost >= costs[next]) continue;
      costs[next] = cost;
      previous[next] = id;
      frontier.push({ id: next, priority: cost + width - 2 - nx + height - 2 - ny });
      steps.push([nx, ny, STANDBY_COLOR]);
    }
  }
  return steps;
}

// Precompute each phase so its entire step count fits the requested duration.
// Elapsed-time playback batches steps per frame and avoids timer-clamping drift.
function animateSteps(steps, duration, onComplete) {
  const startedAt = performance.now();
  let drawn = 0;
  function frame(now) {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    const target = Math.floor(progress * steps.length);
    while (drawn < target) {
      const [x, y, color] = steps[drawn++];
      ctx.fillStyle = color;
      ctx.fillRect(x * nodeSize, y * nodeSize, nodeSize, nodeSize);
    }
    if (progress < 1) {
      animationFrame = requestAnimationFrame(frame);
    } else {
      animationFrame = null;
      onComplete();
    }
  }
  animationFrame = requestAnimationFrame(frame);
}

function runCycle() {
  cycleTimer = null;
  const width = ctx.canvas.width / nodeSize;
  const height = ctx.canvas.height / nodeSize;
  const grid = Array.from({ length: height }, () => Array(width).fill(false));
  const generationSteps = [];
  const algorithms = [generateKruskal, generatePrim, generateBacktrack];
  algorithms[nextAlgorithm](grid, generationSteps);
  nextAlgorithm = (nextAlgorithm + 1) % algorithms.length;
  const solveSteps = solveMaze(grid);
  ctx.fillStyle = BLOCK_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  animateSteps(generationSteps, GENERATION_DURATION_MS, () => {
    animateSteps(solveSteps, SOLVE_DURATION_MS, () => {
      cycleTimer = setTimeout(runCycle, CYCLE_PAUSE_MS);
    });
  });
}

function initAnimation() {
  cancelAnimationFrame(animationFrame);
  clearTimeout(cycleTimer);
  animationFrame = null;
  nodeSize = window.innerHeight >= 2000 && window.innerWidth >= 4000 ? 20
    : window.innerHeight <= 2000 && window.innerWidth <= 4000 ? 10 : 15;
  const oddCells = pixels => Math.max(3, 2 * Math.floor((Math.floor(pixels / nodeSize) + 1) / 2) + 1);
  ctx.canvas.width = oddCells(window.innerWidth) * nodeSize;
  ctx.canvas.height = oddCells(window.innerHeight) * nodeSize;
  ctx.fillStyle = BLOCK_COLOR;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  cycleTimer = setTimeout(runCycle, CYCLE_PAUSE_MS);
}

initAnimation();
window.onresize = initAnimation;
