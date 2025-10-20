console.log('🚀 Farcaster Bird loading...');

// -------- Game variables --------
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let gameState = 'start';
let score = 0;
let frames = 0;
let pipeGap = 350;

// 👤 استعمل هنا يوزر ثابت مؤقتاً (بدلو من بعد إذا بغيت)
const USERNAME = "noel34";

// -------- Bird object --------
const bird = {
  x: 100,
  y: 320,
  velocity: 0,
  radius: 30,

  update() {
    if (gameState !== 'playing') return;

    this.velocity += 0.15;
    this.velocity *= 0.99;

    if (this.velocity > 8) this.velocity = 8;
    if (this.velocity < -10) this.velocity = -10;

    this.y += this.velocity;

    if (this.y > canvas.height - 50 - this.radius) {
      endGame();
    }
    if (this.y < 0) this.y = 0;
  },

  jump() {
    if (gameState === 'playing') {
      this.velocity = -8;
    }
  },

  draw() {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(this.x + 8, this.y - 5, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(this.x + 10, this.y - 5, 3, 0, Math.PI * 2);
    ctx.fill();
  }
};

// -------- Pipes --------
const pipes = [];

class Pipe {
  constructor() {
    this.x = canvas.width;
    this.width = 60;
    this.gap = pipeGap;
    this.topHeight = Math.random() * (canvas.height - this.gap - 200) + 50;
    this.scored = false;
  }

  update() {
    if (gameState !== 'playing') return;
    this.x -= 1.2;
  }

  draw() {
    ctx.fillStyle = '#9B59B6';
    ctx.fillRect(this.x, 0, this.width, this.topHeight);
    ctx.fillRect(this.x, this.topHeight + this.gap, this.width, canvas.height);

    ctx.strokeStyle = '#8E44AD';
    ctx.lineWidth = 3;
    ctx.strokeRect(this.x, 0, this.width, this.topHeight);
    ctx.strokeRect(this.x, this.topHeight + this.gap, this.width, canvas.height);
  }

  collidesWith(b) {
    if (b.x + b.radius > this.x && b.x - b.radius < this.x + this.width) {
      if (b.y - b.radius < this.topHeight || b.y + b.radius > this.topHeight + this.gap) {
        return true;
      }
    }
    return false;
  }
}

// -------- Difficulty --------
function updateDifficulty() {
  if (score <= 15) {
    pipeGap = Math.floor(350 / (1 + (score / 15) * 0.3));
  } else {
    const multiplier = 1.3 + ((score - 15) / 50) * 0.5;
    pipeGap = Math.floor(350 / Math.min(multiplier, 2));
  }
}

// -------- Background --------
function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#667eea');
  gradient.addColorStop(1, '#764ba2');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#553c9a';
  ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

// -------- Game Loop --------
function gameLoop() {
  frames++;
  drawBackground();

  if (gameState === 'playing') {
    updateDifficulty();
    bird.update();

    if (frames % 150 === 0) pipes.push(new Pipe());

    for (let i = pipes.length - 1; i >= 0; i--) {
      pipes[i].update();
      pipes[i].draw();

      if (pipes[i].collidesWith(bird)) endGame();

      if (!pipes[i].scored && bird.x > pipes[i].x + pipes[i].width) {
        pipes[i].scored = true;
        score++;
        document.getElementById('score').textContent = score;
      }

      if (pipes[i].x + pipes[i].width < 0) pipes.splice(i, 1);
    }
  } else {
    pipes.forEach(p => p.draw());
  }

  bird.draw();
  requestAnimationFrame(gameLoop);
}

// -------- Start Game --------
function startGame() {
  console.log('🎮 Starting game...');

  gameState = 'playing';
  bird.y = 120;
  bird.velocity = 0;
  pipes.length = 0;
  score = 0;
  frames = 0;
  pipeGap = 350;

  document.getElementById('start').classList.add('hide');
  document.getElementById('over').classList.add('hide');
  document.getElementById('score').style.display = 'block';
  document.getElementById('score').textContent = '0';

  console.log('✅ Game started!');
}

// -------- API: send score --------
async function sendScore(username, score) {
  try {
    const res = await fetch('/api/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, score })
    });
    const data = await res.json();
    console.log('✅ Score stored:', data);
  } catch (e) {
    console.error('❌ Failed to send score:', e);
  }
}

// -------- API: leaderboard --------
async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const leaderboard = await res.json();

    const listEl = document.getElementById('leaderboard');
    if (!listEl) return; // ماكانتش لائحة فـ HTML ما ندير والو

    listEl.innerHTML = '';
    leaderboard.forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = `${i + 1}. ${item.username} - ${item.score}`;
      listEl.appendChild(li);
    });
  } catch (e) {
    console.error('❌ Error loading leaderboard:', e);
  }
}

// -------- End Game --------
async function endGame() {
  if (gameState !== 'playing') return;
  console.log('💀 Game over! Score:', score);

  gameState = 'over';
  document.getElementById('final').textContent = 'Score: ' + score;
  document.getElementById('over').classList.remove('hide');

  // إرسال السكور + جلب الترتيب
  await sendScore(USERNAME, score);
  await fetchLeaderboard();
}

// -------- Events --------
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);
canvas.addEventListener('click', () => bird.jump());
document.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowUp' || e.code === 'Space') {
    e.preventDefault();
    bird.jump();
  }
});

// -------- Start loop --------
gameLoop();
console.log('✅ Game ready!');
