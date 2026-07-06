const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");

const scoreEl = document.querySelector("#score");
const statusEl = document.querySelector("#status");

const W = canvas.width;
const H = canvas.height;

const keys = new Set();

const world = {
  gravity: 0.62,
  friction: 0.82,
  cameraX: 0,
  finished: false,
  score: 0,
};

const player = {
  x: 64,
  y: 360,
  w: 28,
  h: 38,
  vx: 0,
  vy: 0,
  speed: 0.82,
  jump: -13.8,
  grounded: false,
  facing: 1,
};

const platforms = [
  { x: 0, y: 482, w: 2600, h: 58 },
  { x: 220, y: 392, w: 180, h: 20 },
  { x: 500, y: 330, w: 190, h: 20 },
  { x: 810, y: 405, w: 180, h: 20 },
  { x: 1100, y: 350, w: 220, h: 20 },
  { x: 1450, y: 290, w: 190, h: 20 },
  { x: 1740, y: 390, w: 240, h: 20 },
  { x: 2150, y: 340, w: 220, h: 20 },
];

const coins = [
  { x: 270, y: 350, taken: false, label: "</>" },
  { x: 560, y: 288, taken: false, label: "TS" },
  { x: 870, y: 360, taken: false, label: "UI" },
  { x: 1180, y: 308, taken: false, label: "CMS" },
  { x: 1510, y: 248, taken: false, label: "SEO" },
  { x: 1810, y: 348, taken: false, label: "DX" },
  { x: 2220, y: 298, taken: false, label: "🚀" },
];

const bugs = [
  { x: 700, y: 454, w: 32, h: 28, dir: 1, min: 650, max: 780 },
  { x: 1360, y: 454, w: 32, h: 28, dir: -1, min: 1290, max: 1460 },
  { x: 2020, y: 454, w: 32, h: 28, dir: 1, min: 1950, max: 2130 },
];

const flag = {
  x: 2420,
  y: 362,
  w: 44,
  h: 120,
};

function resetGame() {
  world.cameraX = 0;
  world.finished = false;
  world.score = 0;

  player.x = 64;
  player.y = 360;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  player.facing = 1;

  coins.forEach((coin) => {
    coin.taken = false;
  });

  scoreEl.textContent = "0";
  statusEl.textContent = "Ready";
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function drawRect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function drawText(text, x, y, size = 16, color = "#e5edf8", align = "left") {
  ctx.font = `700 ${size}px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, Math.round(x), Math.round(y));
}

function updatePlayer() {
  if (world.finished) return;

  if (keys.has("ArrowLeft") || keys.has("KeyA")) {
    player.vx -= player.speed;
    player.facing = -1;
  }

  if (keys.has("ArrowRight") || keys.has("KeyD")) {
    player.vx += player.speed;
    player.facing = 1;
  }

  if ((keys.has("Space") || keys.has("ArrowUp") || keys.has("KeyW")) && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  player.vx *= world.friction;
  player.vx = Math.max(Math.min(player.vx, 7.4), -7.4);

  player.vy += world.gravity;
  player.vy = Math.min(player.vy, 18);

  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  for (const platform of platforms) {
    if (!rectsOverlap(player, platform)) continue;

    const prevBottom = player.y + player.h - player.vy;

    if (prevBottom <= platform.y) {
      player.y = platform.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  }

  if (player.y > H + 80) {
    statusEl.textContent = "Respawned";
    player.x = Math.max(64, world.cameraX + 60);
    player.y = 260;
    player.vx = 0;
    player.vy = 0;
  }

  player.x = Math.max(24, Math.min(player.x, 2520));

  world.cameraX = Math.max(0, Math.min(player.x - W * 0.36, 2600 - W));
}

function updateCoins() {
  for (const coin of coins) {
    if (coin.taken) continue;

    const hitbox = {
      x: coin.x - 18,
      y: coin.y - 18,
      w: 36,
      h: 36,
    };

    if (rectsOverlap(player, hitbox)) {
      coin.taken = true;
      world.score += 100;
      scoreEl.textContent = String(world.score);
      statusEl.textContent = "Collected";
    }
  }
}

function updateBugs() {
  for (const bug of bugs) {
    bug.x += bug.dir * 1.35;

    if (bug.x < bug.min || bug.x > bug.max) {
      bug.dir *= -1;
    }

    if (rectsOverlap(player, bug)) {
      statusEl.textContent = "Bug fixed";
      player.x = Math.max(64, player.x - 150);
      player.y = 280;
      player.vx = 0;
      player.vy = 0;
      world.score = Math.max(0, world.score - 50);
      scoreEl.textContent = String(world.score);
    }
  }
}

function updateFlag() {
  if (!world.finished && rectsOverlap(player, flag)) {
    world.finished = true;
    statusEl.textContent = "Deployed";
    world.score += 500;
    scoreEl.textContent = String(world.score);
  }
}

function drawBackground() {
  const cam = world.cameraX;

  ctx.clearRect(0, 0, W, H);

  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, "#09111f");
  gradient.addColorStop(1, "#050814");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 90; i++) {
    const x = (i * 137 - cam * 0.22) % W;
    const y = 30 + ((i * 53) % 230);
    drawRect(x < 0 ? x + W : x, y, 2, 2, "rgba(229,237,248,0.28)");
  }

  drawText("clean components", 120 - cam * 0.35, 120, 18, "rgba(143,164,189,0.35)");
  drawText("performance", 760 - cam * 0.35, 170, 18, "rgba(143,164,189,0.35)");
  drawText("cms workflows", 1400 - cam * 0.35, 105, 18, "rgba(143,164,189,0.35)");
  drawText("better web", 2060 - cam * 0.35, 155, 18, "rgba(143,164,189,0.35)");
}

function drawPlatforms() {
  const cam = world.cameraX;

  for (const p of platforms) {
    drawRect(p.x - cam, p.y, p.w, p.h, "#17233b");
    drawRect(p.x - cam, p.y, p.w, 5, "#3ddc97");
  }
}

function drawCoins() {
  const cam = world.cameraX;

  for (const coin of coins) {
    if (coin.taken) continue;

    const x = coin.x - cam;
    const y = coin.y + Math.sin(performance.now() / 190 + coin.x) * 4;

    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fillStyle = "#7c5cff";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fillStyle = "#111a30";
    ctx.fill();

    drawText(coin.label, x, y + 5, 10, "#e5edf8", "center");
  }
}

function drawBugs() {
  const cam = world.cameraX;

  for (const bug of bugs) {
    const x = bug.x - cam;
    const y = bug.y;

    drawRect(x, y + 8, bug.w, bug.h - 8, "#ff5577");
    drawRect(x + 6, y, 20, 10, "#ff5577");
    drawRect(x + 7, y + 15, 5, 5, "#070b14");
    drawRect(x + 20, y + 15, 5, 5, "#070b14");
    drawText("bug", x + 16, y + 44, 10, "rgba(255,255,255,0.55)", "center");
  }
}

function drawFlag() {
  const cam = world.cameraX;
  const x = flag.x - cam;

  drawRect(x, flag.y, 6, flag.h, "#e5edf8");
  drawRect(x + 6, flag.y + 8, 58, 34, "#3ddc97");
  drawText("deploy", x + 35, flag.y + 30, 12, "#07100c", "center");
}

function drawPlayer() {
  const cam = world.cameraX;
  const x = player.x - cam;
  const y = player.y;

  drawRect(x + 6, y + 4, 16, 16, "#f3c7a6");
  drawRect(x + 4, y + 20, 20, 18, "#7c5cff");

  drawRect(x + 8, y, 14, 6, "#2b1b14");
  drawRect(x + 20, y + 9, 4, 4, "#2b1b14");

  drawRect(x + 1, y + 24, 7, 10, "#3ddc97");
  drawRect(x + 20, y + 24, 7, 10, "#3ddc97");

  drawRect(x + 6, y + 38, 7, 10, "#e5edf8");
  drawRect(x + 17, y + 38, 7, 10, "#e5edf8");

  drawText(player.facing === 1 ? ">" : "<", x + 14, y - 8, 16, "#3ddc97", "center");
}

function drawWinOverlay() {
  if (!world.finished) return;

  ctx.fillStyle = "rgba(5, 8, 20, 0.72)";
  ctx.fillRect(0, 0, W, H);

  drawText("DEPLOY COMPLETE", W / 2, H / 2 - 22, 34, "#3ddc97", "center");
  drawText("Press R to restart", W / 2, H / 2 + 18, 18, "#e5edf8", "center");
}

function loop() {
  updatePlayer();
  updateCoins();
  updateBugs();
  updateFlag();

  drawBackground();
  drawPlatforms();
  drawCoins();
  drawBugs();
  drawFlag();
  drawPlayer();
  drawWinOverlay();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "KeyA", "KeyD", "KeyW", "KeyR"].includes(
      event.code,
    )
  ) {
    event.preventDefault();
  }

  keys.add(event.code);

  if (event.code === "KeyR") {
    resetGame();
  }
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.code);
});

resetGame();
loop();