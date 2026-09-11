const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timerDisplay');
const statusMsg = document.getElementById('statusMsg');

// Game State Variables
let lastTime = 0;
let timeSurvived = 0;
let gameState = 'PLAYING'; // PLAYING, WIN, LOSE

// Art Direction Hex Values
const colors = {
    void: '#070913',
    edge: '#1e293b',
    node: '#06b6d4',
    warning: '#facc15',
    coreRed: '#f43f5e'
};

// Entities
const player = { x: 400, y: 700, radius: 8 };
const star = { x: 400, y: 400, baseRadius: 20, currentRadius: 20, growthRate: 15 }; // pixels per second
let nodes = [];
let projectiles = [];

let nodeSpawnTimer = 0;

// Input Mapping
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    player.x = e.clientX - rect.left;
    player.y = e.clientY - rect.top;
});

// Core Game Loop Architecture
function gameLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = (timestamp - lastTime) / 1000; // Convert to seconds
    lastTime = timestamp;

    if (gameState === 'PLAYING') {
        update(deltaTime);
    }
    draw();

    if (gameState === 'PLAYING') {
        requestAnimationFrame(gameLoop);
    }
}

// Mechanics & Systems Design (Updates)
function update(deltaTime) {
    timeSurvived += deltaTime;
    timerDisplay.innerText = timeSurvived.toFixed(2);

    // 1. Win Condition
    if (timeSurvived >= 60) {
        gameState = 'WIN';
        statusMsg.innerText = "CONTAINMENT SUCCESSFUL. You survived 60 seconds.";
        statusMsg.style.color = colors.node;
        return;
    }

    // 2. Star Growth (The Bloom Hazard)
    star.currentRadius += star.growthRate * deltaTime;

    // 3. Node Spawning
    nodeSpawnTimer += deltaTime;
    if (nodeSpawnTimer > 1.5) { // Spawn a node every 1.5 seconds
        spawnNode();
        nodeSpawnTimer = 0;
    }

    // 4. Collision Detection: Player vs Nodes
    for (let i = nodes.length - 1; i >= 0; i--) {
        let n = nodes[i];
        let dist = Math.hypot(player.x - n.x, player.y - n.y);
        if (dist < player.radius + n.radius) {
            // Collect node -> convert to projectile
            projectiles.push({ x: player.x, y: player.y, radius: 4, speed: 400 });
            nodes.splice(i, 1);
        }
    }

    // 5. Projectiles moving to center (Auto-fire mechanic)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        // Move towards star center
        let angle = Math.atan2(star.y - p.y, star.x - p.x);
        p.x += Math.cos(angle) * p.speed * deltaTime;
        p.y += Math.sin(angle) * p.speed * deltaTime;

        // Hit central star
        let distToStar = Math.hypot(star.x - p.x, star.y - p.y);
        if (distToStar < star.currentRadius) {
            star.currentRadius = Math.max(star.baseRadius, star.currentRadius - 12); // Shrink star
            projectiles.splice(i, 1);
        }
    }

    // 6. Collision Detection: Player vs Star (Lose Condition)
    let distPlayerStar = Math.hypot(star.x - player.x, star.y - player.y);
    if (distPlayerStar < star.currentRadius + player.radius) {
        gameState = 'LOSE';
        statusMsg.innerText = "CRITICAL FAILURE. Consumed by the Bloom.";
        statusMsg.style.color = colors.coreRed;
    }
}

function spawnNode() {
    let angle = Math.random() * Math.PI * 2;
    let distance = star.currentRadius + 50 + Math.random() * (400 - star.currentRadius - 50);
    
    let nx = star.x + Math.cos(angle) * distance;
    let ny = star.y + Math.sin(angle) * distance;
    
    if (nx > 20 && nx < 780 && ny > 20 && ny < 780) {
        nodes.push({ x: nx, y: ny, radius: 8 });
    }
}

// Web Rendering Pipeline
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Central Star (Bloom effect)
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.currentRadius, 0, Math.PI * 2);
    ctx.fillStyle = colors.coreRed;
    ctx.shadowBlur = 40;
    ctx.shadowColor = colors.coreRed;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Draw Nodes
    ctx.fillStyle = colors.node;
    nodes.forEach(n => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.shadowBlur = 10;
        ctx.shadowColor = colors.node;
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Draw Projectiles
    ctx.fillStyle = colors.warning;
    projectiles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Player
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fillStyle = "white"; 
    ctx.fill();
}

// Boot
requestAnimationFrame(gameLoop);
