import { sdk } from 'https://esm.sh/@farcaster/miniapp-sdk@0.0.39';

const PAYMENT_ADDRESS = '0xa0E19656321CaBaF46d434Fa71B263AbB6959F07';
const PAYMENT_AMOUNT = '0x5AF3107A4000';
const BASE_CHAIN_ID = '0x2105';

let provider;

console.log('🚀 Initializing Farcaster Bird...');

(async () => {
    try {
        await sdk.actions.ready();
        console.log('✅ SDK ready');
        provider = await sdk.wallet.getEthereumProvider();
        console.log('✅ Provider ready');
    } catch (error) {
        console.error('SDK init error:', error);
    }
})();

// FIXED: Use proper event listeners instead of onclick
async function startPayment(event) {
    const startScreen = document.getElementById('start');
    const payingScreen = document.getElementById('paying');
    const gameOverScreen = document.getElementById('gameover');
    const errorDiv = document.getElementById('paymentError');

    console.log('🎮 PLAY clicked');

    // SHIFT+Click to skip payment (testing)
    if (event && event.shiftKey) {
        console.log('🔧 TEST MODE - Skip payment');
        startScreen.classList.add('hidden');
        gameOverScreen.classList.add('hidden');
        start();
        return;
    }

    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    payingScreen.classList.remove('hidden');
    errorDiv.classList.add('hidden');

    try {
        if (!provider) {
            provider = await sdk.wallet.getEthereumProvider();
        }

        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        console.log('Account:', accounts[0]);

        const chainId = await provider.request({ method: 'eth_chainId' });

        if (chainId !== BASE_CHAIN_ID) {
            console.log('Switching chain...');
            try {
                await provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: BASE_CHAIN_ID }]
                });
            } catch {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: BASE_CHAIN_ID,
                        chainName: 'Base',
                        nativeCurrency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
                        rpcUrls: ['https://mainnet.base.org'],
                        blockExplorerUrls: ['https://basescan.org']
                    }]
                });
            }
        }

        const txHash = await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from: accounts[0], to: PAYMENT_ADDRESS, value: PAYMENT_AMOUNT }]
        });

        console.log('✅ TX:', txHash);
        payingScreen.classList.add('hidden');
        start();
    } catch (error) {
        console.error('❌ Error:', error);
        errorDiv.textContent = error.message.includes('reject') ? 
            'Payment cancelled' : 
            'Payment failed: ' + error.message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => {
            payingScreen.classList.add('hidden');
            startScreen.classList.remove('hidden');
        }, 3000);
    }
}

// FIXED: Attach event listeners after DOM loads
document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('startBtn');
    const restartBtn = document.getElementById('restartBtn');

    if (startBtn) {
        startBtn.addEventListener('click', startPayment);
        console.log('✅ Start button listener attached');
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', startPayment);
        console.log('✅ Restart button listener attached');
    }
});

// Game code
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let gameState = 'start', score = 0, frames = 0;
const GRAVITY = 0.15, JUMP = -8;
let pipeGap = 350;

let bird = {
    x: 100, y: 320, vy: 0, size: 30,
    update() {
        this.vy += GRAVITY;
        this.vy *= 0.99;
        if (this.vy > 8) this.vy = 8;
        if (this.vy < -10) this.vy = -10;
        this.y += this.vy;
        if (this.y > canvas.height - 50 - this.size) end();
        if (this.y < 0) this.y = 0;
    },
    jump() { this.vy = JUMP; },
    draw() {
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
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

let pipes = [];
class Pipe {
    constructor() {
        this.x = canvas.width;
        this.w = 60;
        this.gap = pipeGap;
        this.top = Math.random() * (canvas.height - this.gap - 200) + 50;
        this.passed = false;
    }
    update() { this.x -= 1.2; }
    draw() {
        ctx.fillStyle = '#9B59B6';
        ctx.fillRect(this.x, 0, this.w, this.top);
        ctx.fillRect(this.x, this.top + this.gap, this.w, canvas.height);
        ctx.strokeStyle = '#8E44AD';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, 0, this.w, this.top);
        ctx.strokeRect(this.x, this.top + this.gap, this.w, canvas.height);
    }
    hits(b) {
        if (b.x + b.size > this.x && b.x - b.size < this.x + this.w) {
            if (b.y - b.size < this.top || b.y + b.size > this.top + this.gap) return true;
        }
        return false;
    }
}

function updateDifficulty() {
    if (score <= 15) pipeGap = Math.floor(350 / (1 + (score / 15) * 0.3));
    else {
        let mult = 1.3 + ((score - 15) / 50) * 0.5;
        pipeGap = Math.floor(350 / Math.min(mult, 2));
    }
}

function drawBG() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#667eea');
    g.addColorStop(1, '#764ba2');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#553c9a';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
}

function loop() {
    frames++;
    drawBG();
    if (gameState === 'playing') {
        updateDifficulty();
        bird.update();
        if (frames % 150 === 0) pipes.push(new Pipe());
        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].update();
            pipes[i].draw();
            if (pipes[i].hits(bird)) end();
            if (!pipes[i].passed && bird.x > pipes[i].x + pipes[i].w) {
                pipes[i].passed = true;
                score++;
                document.getElementById('score').textContent = score;
            }
            if (pipes[i].x + pipes[i].w < 0) pipes.splice(i, 1);
        }
    } else pipes.forEach(p => p.draw());
    bird.draw();
    requestAnimationFrame(loop);
}

function start() {
    console.log('🎮 Starting game!');
    gameState = 'playing';
    bird.y = 120;
    bird.vy = 0;
    pipes = [];
    score = 0;
    frames = 0;
    pipeGap = 350;
    document.getElementById('score').classList.remove('hidden');
    document.getElementById('score').textContent = '0';
}

function end() {
    if (gameState !== 'playing') return;
    console.log('💀 Game over! Score:', score);
    gameState = 'gameover';
    document.getElementById('finalscore').textContent = 'Score: ' + score;
    document.getElementById('gameover').classList.remove('hidden');
}

canvas.addEventListener('click', () => { if (gameState === 'playing') bird.jump(); });
document.addEventListener('keydown', e => {
    if (gameState === 'playing' && (e.code === 'ArrowUp' || e.code === 'Space')) {
        e.preventDefault();
        bird.jump();
    }
});

loop();
console.log('✅ Game initialized');