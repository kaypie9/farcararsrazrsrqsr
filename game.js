console.log('🚀 Farcaster Bird loading...');

// Game variables
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let gameState = 'start';
let score = 0;
let frames = 0;
let pipeGap = 350;

// Bird object
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

// Pipes array
const pipes = [];

// Pipe class
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

    collidesWith(bird) {
        if (bird.x + bird.radius > this.x && 
            bird.x - bird.radius < this.x + this.width) {
            if (bird.y - bird.radius < this.topHeight || 
                bird.y + bird.radius > this.topHeight + this.gap) {
                return true;
            }
        }
        return false;
    }
}

// Update difficulty
function updateDifficulty() {
    if (score <= 15) {
        pipeGap = Math.floor(350 / (1 + (score / 15) * 0.3));
    } else {
        const multiplier = 1.3 + ((score - 15) / 50) * 0.5;
        pipeGap = Math.floor(350 / Math.min(multiplier, 2));
    }
}

// Draw background
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#553c9a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

// Main game loop
function gameLoop() {
    frames++;
    drawBackground();

    if (gameState === 'playing') {
        updateDifficulty();
        bird.update();

        if (frames % 150 === 0) {
            pipes.push(new Pipe());
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].draw();

            if (pipes[i].collidesWith(bird)) {
                endGame();
            }

            if (!pipes[i].scored && bird.x > pipes[i].x + pipes[i].width) {
                pipes[i].scored = true;
                score++;
                document.getElementById('score').textContent = score;
            }

            if (pipes[i].x + pipes[i].width < 0) {
                pipes.splice(i, 1);
            }
        }
    } else {
        pipes.forEach(pipe => pipe.draw());
    }

    bird.draw();
    requestAnimationFrame(gameLoop);
}

// Start game
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

// End game
function endGame() {
    if (gameState !== 'playing') return;

    console.log('💀 Game over! Score:', score);
    gameState = 'over';
    document.getElementById('final').textContent = 'Score: ' + score;
    document.getElementById('over').classList.remove('hide');
}

// Event listeners
document.getElementById('playBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

canvas.addEventListener('click', () => bird.jump());

document.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowUp' || e.code === 'Space') {
        e.preventDefault();
        bird.jump();
    }
});

// Start game loop
gameLoop();
console.log('✅ Game ready!');