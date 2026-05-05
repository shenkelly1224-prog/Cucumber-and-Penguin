const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const tileSize = 48;
const gravity = 0.52;
const maxFall = 16;
const worldWidth = 144 * tileSize;
const coyoteFrames = 7;
const jumpBufferFrames = 7;

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const startButton = document.getElementById("startButton");

const coinCountEl = document.getElementById("coinCount");
const starStateEl = document.getElementById("starState");
const livesCountEl = document.getElementById("livesCount");
const statusTextEl = document.getElementById("statusText");
const touchLeftButton = document.getElementById("touchLeft");
const touchRightButton = document.getElementById("touchRight");
const touchJumpButton = document.getElementById("touchJump");

const keys = {};
const touchState = {
  left: false,
  right: false,
  jump: false,
};
let cameraX = 0;
let animationId = 0;
let lastTime = 0;
let gameState = "ready";
let prevJumpHeld = false;
let jumpBufferTimer = 0;
const cucumberIcon = "\u{1F952}";
const text = {
  restart: "\u91cd\u65b0\u5f00\u59cb",
  failedTitle: "\u95ef\u5173\u5931\u8d25",
  failedBody: "MJX \u628a\u674e\u4fca\u8f69\u62e6\u4f4f\u4e86\u3002\u6309\u6309\u94ae\u6216 R \u518d\u6765\u4e00\u6b21\u3002",
  starOn: "\u5df2\u83b7\u5f97",
  starOff: "\u672a\u83b7\u5f97",
  won: "\u901a\u5173",
  failed: "\u5931\u8d25",
  powered: "\u96ea\u661f\u5f3a\u5316",
  running: "\u524d\u8fdb\u4e2d",
  successTitle: "\u6210\u529f\u5230\u8fbe\u7ec8\u70b9",
  successButton: "\u518d\u73a9\u4e00\u6b21",
  successBody(count) {
    return `\u674e\u4fca\u8f69\u5e26\u7740 ${count} \u6839 ${cucumberIcon} \u7a7f\u8fc7\u96ea\u661f\u7ec8\u70b9\u3002`;
  },
};

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeLevel() {
  const ground = [];
  const blocks = [];
  const coinBlocks = [];
  const breakableBlocks = [];
  const cucumberSpawns = [];
  const enemies = [];
  const pits = [];
  const clouds = [];
  const hills = [];

  for (let i = 0; i < 144; i += 1) {
    if ((i >= 18 && i <= 19) || (i >= 46 && i <= 47) || (i >= 87 && i <= 89) || (i >= 118 && i <= 120)) {
      pits.push({ x: i * tileSize, w: tileSize });
      continue;
    }
    ground.push({ x: i * tileSize, y: 9 * tileSize, w: tileSize, h: 3 * tileSize });
  }

  const addSolid = (x, y, count = 1) => {
    for (let i = 0; i < count; i += 1) {
      blocks.push({ x: (x + i) * tileSize, y: y * tileSize, w: tileSize, h: tileSize, type: "solid" });
    }
  };

  const addQuestion = (x, y, reward) => {
    coinBlocks.push({
      x: x * tileSize,
      y: y * tileSize,
      w: tileSize,
      h: tileSize,
      active: true,
      bounce: 0,
      reward,
    });
  };

  const addBreakable = (x, y, count = 1) => {
    for (let i = 0; i < count; i += 1) {
      breakableBlocks.push({
        x: (x + i) * tileSize,
        y: y * tileSize,
        w: tileSize,
        h: tileSize,
        broken: false,
        bounce: 0,
      });
    }
  };

  const addCucumber = (x, y) => {
    cucumberSpawns.push({ x: x * tileSize + 12, y: y * tileSize + 12, collected: false });
  };

  const addEnemy = (x, y, leftTiles = 2, rightTiles = 2) => {
    enemies.push({
      x: x * tileSize,
      y: y * tileSize,
      w: 36,
      h: 34,
      vx: -1.2,
      vy: 0,
      minX: (x - leftTiles) * tileSize,
      maxX: (x + rightTiles) * tileSize,
      squashed: 0,
      alive: true,
    });
  };

  addQuestion(8, 4, "cucumber");
  addQuestion(12, 4, "star");
  addQuestion(13, 4, "cucumber");
  addQuestion(26, 3, "cucumber");
  addQuestion(40, 4, "cucumber");
  addQuestion(59, 4, "cucumber");
  addQuestion(60, 4, "cucumber");
  addQuestion(61, 4, "star");
  addQuestion(74, 4, "cucumber");
  addQuestion(99, 4, "cucumber");
  addQuestion(130, 4, "cucumber");

  addSolid(20, 6, 3);
  addSolid(30, 5, 2);
  addSolid(36, 6, 4);
  addSolid(55, 6, 2);
  addSolid(66, 5, 5);
  addSolid(80, 6, 2);
  addSolid(82, 5, 2);
  addSolid(96, 5, 3);
  addSolid(108, 6, 4);
  addSolid(126, 5, 3);

  addBreakable(9, 4, 3);
  addBreakable(24, 3, 2);
  addBreakable(41, 4, 3);
  addBreakable(75, 4, 3);
  addBreakable(100, 4, 2);

  addCucumber(6, 6);
  addCucumber(21, 5);
  addCucumber(31, 4);
  addCucumber(38, 5);
  addCucumber(67, 4);
  addCucumber(83, 4);
  addCucumber(97, 4);
  addCucumber(111, 5);
  addCucumber(128, 4);

  addEnemy(15, 8.3);
  addEnemy(23, 8.3);
  addEnemy(33, 8.3);
  addEnemy(43, 8.3);
  addEnemy(53, 8.3);
  addEnemy(63, 8.3);
  addEnemy(71, 8.3);
  addEnemy(93, 8.3);
  addEnemy(106, 8.3);
  addEnemy(124, 8.3);

  for (let i = 0; i < 18; i += 1) {
    clouds.push({
      x: 160 + i * 360,
      y: 50 + (i % 3) * 42,
      size: 34 + (i % 2) * 12,
    });
  }

  for (let i = 0; i < 11; i += 1) {
    hills.push({
      x: i * 640,
      y: 360,
      w: 260 + (i % 3) * 40,
      h: 120 + (i % 2) * 40,
    });
  }

  return {
    ground,
    blocks,
    coinBlocks,
    breakableBlocks,
    cucumberSpawns,
    enemies,
    pits,
    clouds,
    hills,
    flag: { x: 138 * tileSize, y: 3 * tileSize, w: 18, h: 6 * tileSize },
  };
}

const initialPlayer = () => ({
  x: 120,
  y: 240,
  w: 38,
  h: 46,
  vx: 0,
  vy: 0,
  onGround: false,
  facing: 1,
  big: false,
  invulnerable: 0,
  coyoteTimer: 0,
  jumpHoldTimer: 0,
});

let level = makeLevel();
let player = initialPlayer();
let stats = {
  cucumbers: 0,
  lives: 3,
  won: false,
};

function setOverlay(title, body, buttonText = text.restart) {
  overlayTitle.textContent = title;
  overlayBody.textContent = body;
  startButton.textContent = buttonText;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function resetGame(fullReset = true) {
  if (fullReset) {
    level = makeLevel();
    stats = {
      cucumbers: 0,
      lives: 3,
      won: false,
    };
  }
  player = initialPlayer();
  cameraX = 0;
  gameState = "playing";
  prevJumpHeld = false;
  jumpBufferTimer = 0;
  hideOverlay();
  updateHud();
}

function respawnOrLose() {
  stats.lives -= 1;
  if (stats.lives <= 0) {
    gameState = "gameover";
    updateHud();
    setOverlay(text.failedTitle, text.failedBody);
    return;
  }
  player = initialPlayer();
  cameraX = Math.max(0, player.x - 150);
  player.invulnerable = 90;
  prevJumpHeld = false;
  jumpBufferTimer = 0;
  gameState = "playing";
  updateHud();
}

function updateHud() {
  coinCountEl.textContent = String(stats.cucumbers);
  starStateEl.textContent = player.big ? text.starOn : text.starOff;
  livesCountEl.textContent = String(stats.lives);

  if (gameState === "won") {
    statusTextEl.textContent = text.won;
  } else if (gameState === "gameover") {
    statusTextEl.textContent = text.failed;
  } else if (player.big) {
    statusTextEl.textContent = text.powered;
  } else {
    statusTextEl.textContent = text.running;
  }
}

function collectCucumber(item) {
  if (!item.collected) {
    item.collected = true;
    stats.cucumbers += 1;
    updateHud();
  }
}

function spawnReward(block) {
  if (block.reward === "cucumber") {
    level.cucumberSpawns.push({
      x: block.x + 12,
      y: block.y - 24,
      collected: false,
      popup: 40,
    });
  } else {
    player.big = true;
    player.h = 62;
    player.y -= 16;
  }
  updateHud();
}

function getActiveSolids() {
  const breakable = level.breakableBlocks.filter((block) => !block.broken);
  return [...level.ground, ...level.blocks, ...level.coinBlocks, ...breakable];
}

function hitBlockFromBelow() {
  const playerTop = player.y;
  const playerCenterX = player.x + player.w / 2;

  for (const block of level.coinBlocks) {
    if (
      playerCenterX > block.x &&
      playerCenterX < block.x + block.w &&
      playerTop >= block.y + block.h - 12 &&
      playerTop <= block.y + block.h + 10 &&
      block.active
    ) {
      block.active = false;
      block.bounce = 10;
      spawnReward(block);
      player.vy = 1.5;
      return true;
    }
  }

  for (const block of level.breakableBlocks) {
    if (block.broken) continue;
    if (
      playerCenterX > block.x &&
      playerCenterX < block.x + block.w &&
      playerTop >= block.y + block.h - 12 &&
      playerTop <= block.y + block.h + 10
    ) {
      if (player.big) {
        block.broken = true;
      } else {
        block.bounce = 10;
      }
      player.vy = 1.5;
      return true;
    }
  }
  return false;
}

function resolveCollisions(axis) {
  for (const solid of getActiveSolids()) {
    const drawOffset = solid.bounce ? Math.sin((solid.bounce / 10) * Math.PI) * 12 : 0;
    const hitbox = {
      x: solid.x,
      y: solid.y - drawOffset,
      w: solid.w,
      h: solid.h,
    };

    if (!rectsOverlap(player, hitbox)) continue;

    if (axis === "x") {
      if (player.vx > 0) {
        player.x = hitbox.x - player.w;
      } else if (player.vx < 0) {
        player.x = hitbox.x + hitbox.w;
      }
      player.vx = 0;
    } else {
      if (player.vy > 0) {
        player.y = hitbox.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0) {
        player.y = hitbox.y + hitbox.h;
        hitBlockFromBelow();
      }
    }
  }
}

function updatePlayer() {
  const moveLeft = keys.ArrowLeft || keys.KeyA || touchState.left;
  const moveRight = keys.ArrowRight || keys.KeyD || touchState.right;
  const jumpHeld = keys.ArrowUp || keys.KeyW || keys.Space || touchState.jump;
  const jumpPressed = jumpHeld && !prevJumpHeld;
  const acceleration = player.onGround ? 0.76 : 0.5;
  const maxSpeed = player.big ? 6.8 : 6.2;
  const friction = player.onGround ? 0.78 : 0.95;

  if (player.onGround) {
    player.coyoteTimer = coyoteFrames;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer -= 1;
  }

  if (jumpPressed) {
    jumpBufferTimer = jumpBufferFrames;
  } else if (jumpBufferTimer > 0) {
    jumpBufferTimer -= 1;
  }

  if (moveLeft) {
    player.vx -= acceleration;
    player.facing = -1;
  }
  if (moveRight) {
    player.vx += acceleration;
    player.facing = 1;
  }
  if (!moveLeft && !moveRight) {
    player.vx *= friction;
  }

  player.vx = clamp(player.vx, -maxSpeed, maxSpeed);

  if (jumpBufferTimer > 0 && (player.onGround || player.coyoteTimer > 0)) {
    player.vy = player.big ? -14.4 : -13.2;
    player.onGround = false;
    player.coyoteTimer = 0;
    player.jumpHoldTimer = player.big ? 10 : 8;
    jumpBufferTimer = 0;
  }

  if (jumpHeld && player.jumpHoldTimer > 0 && player.vy < 0) {
    player.vy -= player.big ? 0.22 : 0.18;
    player.jumpHoldTimer -= 1;
  } else if (!jumpHeld) {
    player.jumpHoldTimer = 0;
    if (player.vy < -2.5) {
      player.vy += 0.55;
    }
  }

  player.vy += gravity;
  player.vy = Math.min(player.vy, maxFall);

  player.x += player.vx;
  resolveCollisions("x");

  player.y += player.vy;
  player.onGround = false;
  resolveCollisions("y");

  if (player.invulnerable > 0) {
    player.invulnerable -= 1;
  }

  prevJumpHeld = jumpHeld;

  if (player.y > canvas.height + 160) {
    respawnOrLose();
  }
}

function updateBlocks() {
  for (const group of [level.coinBlocks, level.breakableBlocks]) {
    for (const block of group) {
      if (block.bounce > 0) {
        block.bounce -= 1;
      }
    }
  }

  for (const item of level.cucumberSpawns) {
    if (item.popup && item.popup > 0) {
      item.y -= 1.2;
      item.popup -= 1;
    }
    if (!item.collected && rectsOverlap(player, { x: item.x, y: item.y, w: 24, h: 24 })) {
      collectCucumber(item);
    }
  }
}

function updateEnemies() {
  for (const enemy of level.enemies) {
    if (!enemy.alive) continue;
    if (enemy.squashed > 0) {
      enemy.squashed -= 1;
      if (enemy.squashed === 0) {
        enemy.alive = false;
      }
      continue;
    }

    enemy.vy += gravity;
    enemy.vy = Math.min(enemy.vy, 12);
    enemy.x += enemy.vx;

    if (enemy.x <= enemy.minX || enemy.x >= enemy.maxX) {
      enemy.vx *= -1;
    }

    enemy.y += enemy.vy;

    for (const solid of getActiveSolids()) {
      if (!rectsOverlap(enemy, solid)) continue;
      if (enemy.vy > 0) {
        enemy.y = solid.y - enemy.h;
        enemy.vy = 0;
      } else if (enemy.vx > 0) {
        enemy.x = solid.x - enemy.w;
        enemy.vx *= -1;
      } else {
        enemy.x = solid.x + solid.w;
        enemy.vx *= -1;
      }
    }

    if (rectsOverlap(player, enemy)) {
      const stomped = player.vy > 1 && player.y + player.h - 8 < enemy.y + 16;
      if (stomped) {
        enemy.squashed = 18;
        player.vy = -8.2;
      } else if (player.invulnerable === 0) {
        if (player.big) {
          player.big = false;
          player.h = 46;
          player.invulnerable = 110;
          updateHud();
        } else {
          respawnOrLose();
          return;
        }
      }
    }
  }
}

function updateCamera() {
  cameraX = clamp(player.x - canvas.width * 0.35, 0, worldWidth - canvas.width);
}

function updateFlag() {
  const flagTrigger = {
    x: level.flag.x - 18,
    y: level.flag.y,
    w: 48,
    h: level.flag.h,
  };

  if (rectsOverlap(player, flagTrigger)) {
    gameState = "won";
    stats.won = true;
    updateHud();
    setOverlay(text.successTitle, text.successBody(stats.cucumbers), text.successButton);
  }
}

function update() {
  if (gameState !== "playing") return;
  updatePlayer();
  updateBlocks();
  updateEnemies();
  updateCamera();
  updateFlag();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#82dbff");
  gradient.addColorStop(0.65, "#dff8ff");
  gradient.addColorStop(1, "#f6ffff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const hill of level.hills) {
    const x = hill.x - cameraX * 0.45;
    ctx.fillStyle = "#bceeff";
    ctx.beginPath();
    ctx.ellipse(x + hill.w / 2, hill.y + 100, hill.w / 2, hill.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#93d5f0";
    ctx.beginPath();
    ctx.arc(x + hill.w / 2 - 30, hill.y + 50, 14, 0, Math.PI * 2);
    ctx.arc(x + hill.w / 2 + 30, hill.y + 50, 14, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const cloud of level.clouds) {
    const x = cloud.x - cameraX * 0.25;
    const y = cloud.y;
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.beginPath();
    ctx.arc(x, y, cloud.size, 0, Math.PI * 2);
    ctx.arc(x + cloud.size * 0.9, y - 12, cloud.size * 0.82, 0, Math.PI * 2);
    ctx.arc(x + cloud.size * 1.8, y, cloud.size * 0.95, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround() {
  for (const tile of level.ground) {
    const x = tile.x - cameraX;
    ctx.fillStyle = "#dff7ff";
    ctx.fillRect(x, tile.y, tile.w, tile.h);
    ctx.fillStyle = "#9ed7ea";
    ctx.fillRect(x, tile.y, tile.w, 10);
    ctx.strokeStyle = "#75c0d8";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, tile.y, tile.w, tile.h);
    for (let i = 0; i < 3; i += 1) {
      ctx.fillStyle = i % 2 ? "#caeef9" : "#edfaff";
      ctx.fillRect(x + 6 + i * 12, tile.y + 14 + (i % 2) * 8, 12, 12);
    }
  }
}

function drawBlock(block, type) {
  const bounceOffset = block.bounce ? Math.sin((block.bounce / 10) * Math.PI) * 12 : 0;
  const x = block.x - cameraX;
  const y = block.y - bounceOffset;

  if (type === "question") {
    ctx.fillStyle = block.active ? "#ffd261" : "#c7dde8";
    ctx.fillRect(x, y, block.w, block.h);
    ctx.strokeStyle = block.active ? "#dd8d1a" : "#90aab7";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, block.w, block.h);
    ctx.fillStyle = block.active ? "#9b5c08" : "#728898";
    ctx.font = "24px 'Press Start 2P'";
    ctx.fillText("?", x + 13, y + 31);
  } else {
    ctx.fillStyle = "#b76739";
    ctx.fillRect(x, y, block.w, block.h);
    ctx.strokeStyle = "#7a4328";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, block.w, block.h);
    ctx.fillStyle = "#d89368";
    ctx.fillRect(x + 6, y + 6, block.w - 12, 10);
    ctx.fillRect(x + 8, y + 24, block.w - 16, 8);
  }
}

function drawCucumber(item) {
  if (item.collected) return;
  const x = item.x - cameraX;
  const y = item.y;
  ctx.font = "24px serif";
  ctx.fillText(cucumberIcon, x, y + 20);
}

function drawPenguin() {
  const blink = player.invulnerable > 0 && Math.floor(player.invulnerable / 6) % 2 === 0;
  if (blink) return;

  const x = player.x - cameraX;
  const y = player.y;
  const scale = player.big ? 1.15 : 1;

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h / 2);
  ctx.scale(player.facing, 1);
  ctx.translate(-(x + player.w / 2), -(y + player.h / 2));

  ctx.fillStyle = "#101820";
  ctx.beginPath();
  ctx.ellipse(x + 19, y + 26, 19 * scale, 21 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.ellipse(x + 19, y + 29, 12 * scale, 14 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#101820";
  ctx.beginPath();
  ctx.arc(x + 19, y + 10, 13 * scale, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.arc(x + 16, y + 9, 4, 0, Math.PI * 2);
  ctx.arc(x + 23, y + 9, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#0a1721";
  ctx.beginPath();
  ctx.arc(x + 16, y + 9, 1.6, 0, Math.PI * 2);
  ctx.arc(x + 23, y + 9, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#f59f3a";
  ctx.beginPath();
  ctx.moveTo(x + 19, y + 13);
  ctx.lineTo(x + 29, y + 16);
  ctx.lineTo(x + 19, y + 19);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#9fd7f5";
  ctx.fillRect(x + 6, y + 22, 26, 7);
  ctx.fillStyle = "#74b9df";
  ctx.fillRect(x + 10, y + 20, 8, 10);

  ctx.fillStyle = "#f59f3a";
  ctx.fillRect(x + 6, y + player.h - 6, 10, 6);
  ctx.fillRect(x + 21, y + player.h - 6, 10, 6);

  if (player.big) {
    ctx.fillStyle = "rgba(185, 242, 255, 0.35)";
    ctx.beginPath();
    ctx.arc(x + 18, y + 26, 28, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  const x = enemy.x - cameraX;
  const y = enemy.y;

  ctx.fillStyle = "#5b3825";
  if (enemy.squashed > 0) {
    ctx.fillRect(x, y + 18, enemy.w, 16);
  } else {
    ctx.beginPath();
    ctx.roundRect(x, y + 2, enemy.w, enemy.h, 10);
    ctx.fill();
    ctx.fillStyle = "#f3dcc8";
    ctx.fillRect(x + 6, y + 9, enemy.w - 12, 12);
    ctx.fillStyle = "#1e1510";
    ctx.fillRect(x + 9, y + 12, 4, 4);
    ctx.fillRect(x + enemy.w - 13, y + 12, 4, 4);
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "10px 'Press Start 2P'";
  ctx.fillText("MJX", x - 2, y - 4);
}

function drawFlag() {
  const x = level.flag.x - cameraX;
  ctx.fillStyle = "#eefcff";
  ctx.fillRect(x, level.flag.y, level.flag.w, level.flag.h);
  ctx.fillStyle = "#ff7b54";
  ctx.beginPath();
  ctx.moveTo(x + level.flag.w, level.flag.y + 8);
  ctx.lineTo(x + level.flag.w + 42, level.flag.y + 24);
  ctx.lineTo(x + level.flag.w, level.flag.y + 40);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#0f3c57";
  ctx.font = "12px 'Press Start 2P'";
  ctx.fillText("XX", x + 22, level.flag.y + 28);
}

function draw() {
  drawSky();
  drawGround();

  for (const block of level.blocks) drawBlock(block, "solid");
  for (const block of level.coinBlocks) drawBlock(block, "question");
  for (const block of level.breakableBlocks) {
    if (!block.broken) drawBlock(block, "solid");
  }

  for (const item of level.cucumberSpawns) drawCucumber(item);
  for (const enemy of level.enemies) drawEnemy(enemy);
  drawFlag();
  drawPenguin();

  ctx.fillStyle = "#0f3c57";
  ctx.font = "14px 'Press Start 2P'";
  ctx.fillText("LJX", 24, 32);
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  if (delta >= 1000 / 60) {
    update();
    draw();
    lastTime = timestamp;
  }
  animationId = requestAnimationFrame(loop);
}

function startGame() {
  if (gameState === "gameover" || gameState === "won") {
    resetGame(true);
  } else {
    resetGame(false);
  }
}

window.addEventListener("keydown", (event) => {
  keys[event.code] = true;

  if (event.code === "KeyR") {
    resetGame(true);
  }

  if ((event.code === "Space" || event.code === "Enter") && gameState !== "playing") {
    startGame();
  }

  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(event.code)) {
    event.preventDefault();
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

function bindTouchControl(button, stateKey) {
  const press = (event) => {
    event.preventDefault();
    touchState[stateKey] = true;
    button.classList.add("is-pressed");
    if (gameState !== "playing" && stateKey === "jump") {
      startGame();
    }
  };

  const release = (event) => {
    event.preventDefault();
    touchState[stateKey] = false;
    button.classList.remove("is-pressed");
  };

  button.addEventListener("pointerdown", press);
  button.addEventListener("pointerup", release);
  button.addEventListener("pointerleave", release);
  button.addEventListener("pointercancel", release);
}

function clearTouchControls() {
  touchState.left = false;
  touchState.right = false;
  touchState.jump = false;
  touchLeftButton.classList.remove("is-pressed");
  touchRightButton.classList.remove("is-pressed");
  touchJumpButton.classList.remove("is-pressed");
}

bindTouchControl(touchLeftButton, "left");
bindTouchControl(touchRightButton, "right");
bindTouchControl(touchJumpButton, "jump");
window.addEventListener("pointerup", clearTouchControls);
window.addEventListener("blur", clearTouchControls);

startButton.addEventListener("click", startGame);

updateHud();
draw();
cancelAnimationFrame(animationId);
animationId = requestAnimationFrame(loop);
