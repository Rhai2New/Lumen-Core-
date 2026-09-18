const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const timerDisplay = document.getElementById("timerDisplay");
const remainingDisplay = document.getElementById("remainingDisplay");
const statusMsg = document.getElementById("statusMsg");

const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");

const startButton = document.getElementById("startButton");
const replayButton = document.getElementById("replayButton");

const endTitle = document.getElementById("endTitle");
const endMessage = document.getElementById("endMessage");
const finalTime = document.getElementById("finalTime");


// --------------------------------------------------
// GAME CONSTANTS
// --------------------------------------------------

const GAME_LENGTH = 60;

const CORE_GROWTH_RATE = 17.5;

const COOLANT_SHRINK = 13;

const colors = {
    void: "#070913",
    edge: "#1e293b",
    node: "#06b6d4",
    warning: "#facc15",
    coreRed: "#f43f5e"
};


// --------------------------------------------------
// GAME STATE
// --------------------------------------------------

let lastTime = 0;

let timeSurvived = 0;

let gameState = "START";

let animationID = null;

let nodeSpawnTimer = 0;

let nextNodeSpawn = 1.3;


// --------------------------------------------------
// ENTITIES
// --------------------------------------------------

const player = {
    x: 400,
    y: 700,
    radius: 8
};

const star = {
    x: 400,
    y: 400,

    baseRadius: 20,

    currentRadius: 20
};

let nodes = [];

let projectiles = [];


// --------------------------------------------------
// INPUT
// --------------------------------------------------

canvas.addEventListener("mousemove", function (e) {

    if (gameState !== "PLAYING") {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    player.x = (e.clientX - rect.left) * scaleX;
    player.y = (e.clientY - rect.top) * scaleY;

    player.x = Math.max(
        player.radius,
        Math.min(canvas.width - player.radius, player.x)
    );

    player.y = Math.max(
        player.radius,
        Math.min(canvas.height - player.radius, player.y)
    );
});


// --------------------------------------------------
// BUTTONS
// --------------------------------------------------

startButton.addEventListener("click", function () {
    startGame();
});

replayButton.addEventListener("click", function () {
    startGame();
});


// --------------------------------------------------
// START / RESET
// --------------------------------------------------

function startGame() {

    if (animationID !== null) {
        cancelAnimationFrame(animationID);
    }

    timeSurvived = 0;

    lastTime = 0;

    gameState = "PLAYING";

    nodeSpawnTimer = 0;

    nextNodeSpawn = randomSpawnDelay();

    player.x = 400;
    player.y = 700;

    star.currentRadius = star.baseRadius;

    nodes = [];

    projectiles = [];

    timerDisplay.innerText = "0.00";

    remainingDisplay.innerText = "60.00";

    statusMsg.innerText =
        "Collect coolant nodes. Avoid the Core.";

    statusMsg.style.color = colors.warning;

    startScreen.classList.add("hidden");

    endScreen.classList.add("hidden");

    spawnNode();
    spawnNode();
    spawnNode();

    animationID = requestAnimationFrame(gameLoop);
}


// --------------------------------------------------
// GAME LOOP
// --------------------------------------------------

function gameLoop(timestamp) {

    if (!lastTime) {
        lastTime = timestamp;
    }

    let deltaTime = (timestamp - lastTime) / 1000;

    deltaTime = Math.min(deltaTime, 0.05);

    lastTime = timestamp;

    if (gameState === "PLAYING") {

        update(deltaTime);

        draw();

        animationID = requestAnimationFrame(gameLoop);

    } else {

        draw();

        animationID = null;
    }
}


// --------------------------------------------------
// UPDATE
// --------------------------------------------------

function update(deltaTime) {

    timeSurvived += deltaTime;

    if (timeSurvived > GAME_LENGTH) {
        timeSurvived = GAME_LENGTH;
    }

    timerDisplay.innerText =
        timeSurvived.toFixed(2);

    remainingDisplay.innerText =
        Math.max(
            0,
            GAME_LENGTH - timeSurvived
        ).toFixed(2);


    // WIN CONDITION

    if (timeSurvived >= GAME_LENGTH) {

        winGame();

        return;
    }


    // CORE GROWTH

    star.currentRadius +=
        CORE_GROWTH_RATE * deltaTime;


    // NODE SPAWNING

    nodeSpawnTimer += deltaTime;

    if (nodeSpawnTimer >= nextNodeSpawn) {

        spawnNode();

        if (
            timeSurvived > 25 &&
            Math.random() < 0.22
        ) {
            spawnNode();
        }

        nodeSpawnTimer = 0;

        nextNodeSpawn = randomSpawnDelay();
    }


    // PLAYER VS NODES

    for (
        let i = nodes.length - 1;
        i >= 0;
        i--
    ) {

        const node = nodes[i];

        const distance = Math.hypot(
            player.x - node.x,
            player.y - node.y
        );

        if (
            distance <
            player.radius + node.radius
        ) {

            projectiles.push({
                x: player.x,
                y: player.y,
                radius: 4,
                speed: 430
            });

            nodes.splice(i, 1);
        }
    }


    // PROJECTILES

    for (
        let i = projectiles.length - 1;
        i >= 0;
        i--
    ) {

        const projectile = projectiles[i];

        const angle = Math.atan2(
            star.y - projectile.y,
            star.x - projectile.x
        );

        projectile.x +=
            Math.cos(angle) *
            projectile.speed *
            deltaTime;

        projectile.y +=
            Math.sin(angle) *
            projectile.speed *
            deltaTime;

        const distanceToCore = Math.hypot(
            star.x - projectile.x,
            star.y - projectile.y
        );

        if (
            distanceToCore <
            star.currentRadius
        ) {

            star.currentRadius = Math.max(
                star.baseRadius,
                star.currentRadius - COOLANT_SHRINK
            );

            projectiles.splice(i, 1);
        }
    }


    // PLAYER VS BLOOM

    const distanceToPlayer = Math.hypot(
        star.x - player.x,
        star.y - player.y
    );

    if (
        distanceToPlayer <=
        star.currentRadius + player.radius
    ) {

        loseGame();

        return;
    }
}


// --------------------------------------------------
// SPAWN TIMING
// --------------------------------------------------

function randomSpawnDelay() {

    return 1.0 + Math.random() * 0.7;
}


// --------------------------------------------------
// SPAWN NODE
// --------------------------------------------------

function spawnNode() {

    const nodeRadius = 8;

    const margin = 30;

    const safeDistance =
        star.currentRadius + 55;

    for (
        let attempt = 0;
        attempt < 30;
        attempt++
    ) {

        const x =
            margin +
            Math.random() *
            (canvas.width - margin * 2);

        const y =
            margin +
            Math.random() *
            (canvas.height - margin * 2);

        const distanceFromCore =
            Math.hypot(
                star.x - x,
                star.y - y
            );

        if (
            distanceFromCore >
            safeDistance
        ) {

            nodes.push({
                x: x,
                y: y,
                radius: nodeRadius,
                pulse: Math.random() * Math.PI * 2
            });

            return;
        }
    }
}


// --------------------------------------------------
// WIN
// --------------------------------------------------

function winGame() {

    gameState = "WIN";

    statusMsg.innerText =
        "CONTAINMENT SUCCESSFUL";

    statusMsg.style.color =
        colors.node;

    finalTime.innerText =
        "60.00";

    endTitle.innerText =
        "CONTAINMENT SUCCESSFUL";

    endTitle.style.color =
        colors.node;

    endMessage.innerText =
        "You survived the full Bloom cycle.";

    endScreen.classList.remove("hidden");
}


// --------------------------------------------------
// LOSE
// --------------------------------------------------

function loseGame() {

    gameState = "LOSE";

    statusMsg.innerText =
        "CRITICAL FAILURE";

    statusMsg.style.color =
        colors.coreRed;

    finalTime.innerText =
        timeSurvived.toFixed(2);

    endTitle.innerText =
        "CONTAINMENT FAILURE";

    endTitle.style.color =
        colors.coreRed;

    endMessage.innerText =
        "The Bloom reached your ship.";

    endScreen.classList.remove("hidden");
}


// --------------------------------------------------
// DRAW
// --------------------------------------------------

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // BACKGROUND

    ctx.fillStyle = colors.void;

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    // BLOOM

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        star.x,
        star.y,
        star.currentRadius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = colors.coreRed;

    ctx.shadowBlur = 40;

    ctx.shadowColor = colors.coreRed;

    ctx.fill();

    ctx.restore();


    // COLLISION BORDER

    ctx.beginPath();

    ctx.arc(
        star.x,
        star.y,
        star.currentRadius,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle = colors.warning;

    ctx.lineWidth = 2;

    ctx.stroke();


    // NODES

    for (
        let i = 0;
        i < nodes.length;
        i++
    ) {

        const node = nodes[i];

        node.pulse += 0.05;

        const pulseSize =
            Math.sin(node.pulse) * 1.5;

        ctx.save();

        ctx.beginPath();

        ctx.arc(
            node.x,
            node.y,
            node.radius + pulseSize,
            0,
            Math.PI * 2
        );

        ctx.fillStyle = colors.node;

        ctx.shadowBlur = 12;

        ctx.shadowColor = colors.node;

        ctx.fill();

        ctx.restore();
    }


    // PROJECTILES

    for (
        let i = 0;
        i < projectiles.length;
        i++
    ) {

        const projectile =
            projectiles[i];

        ctx.beginPath();

        ctx.arc(
            projectile.x,
            projectile.y,
            projectile.radius,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            colors.warning;

        ctx.fill();
    }


    // PLAYER

    ctx.save();

    ctx.beginPath();

    ctx.arc(
        player.x,
        player.y,
        player.radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle = "white";

    ctx.shadowBlur = 8;

    ctx.shadowColor = "white";

    ctx.fill();

    ctx.restore();
}


// --------------------------------------------------
// INITIAL SCREEN
// --------------------------------------------------

draw();
