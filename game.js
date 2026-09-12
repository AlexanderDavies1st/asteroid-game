const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

import {Bullet, Player, ExperienceOrb, Enemy, clamp} from "./classes.js"
import {openUpgradeMenu} from "./upgrade.js"
import {enemyTypes, enemyData} from "./enemyTypes.js"

function getRandom(a, b) {return Math.random() * (b - a) + a;}
function getRandomInt(a, b) {return Math.floor(getRandom(a,b))}
function spawnEnemyType(type, x, y) {
    if (type in enemyData) {
        let eT = enemyData[type]; // short for enemyType
        Enemies.push(new Enemy(x,y,eT.speed, eT.size, eT.colour, eT.health, eT.damage, eT.cooldown, eT.expDropped));
    }}

let frameCount = 0;
let lastTime = 0;
let gameState = "playing";
let prevLevel = 0;
let wave = 0;
let waveIntermission = 3
let waveTimer = 0

const keys = {};
const PlayerBullets = [];
const EnemyBullets = [];
const ExperienceOrbs = [];
const Enemies = [];

function spawnEnemies(amount) {
    for (let index = 1; index <= amount; index++) {
        spawnEnemyType(enemyTypes[getRandomInt(0, enemyTypes.length)], getRandom(0,800), getRandom(0,800));
    }}

spawnEnemies(1);
const player = new Player(100,100,150,30,"red",100,10)
window.game = { player, Enemies }; // Debugging

document.getElementById("restart-button").addEventListener("click", () => {
    window.location.reload();
});

window.addEventListener("keydown", (event) => {
    keys[event.key.toLowerCase()] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key.toLowerCase()] = false;
});

window.addEventListener("mousedown", (event) => {
    if (gameState !== "playing") {return;}
    if (player.currentCooldown != 0) {return;}
    player.currentCooldown = player.maxCooldown
    const rect = canvas.getBoundingClientRect();
    
    // Get mouseX and mouseY
    const mouseX = (event.clientX - rect.left) * (canvas.width / rect.width);
    const mouseY = (event.clientY - rect.top) * (canvas.height / rect.height);

    PlayerBullets.push(new Bullet(player.x,player.y,mouseX,mouseY,player.bulletSpeed,"red",player.bulletSize,player.damage))
});

// Useful Functions
function drawCircle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x,y,radius,0,Math.PI*2);
    ctx.fill();
}

// Updates
function update(deltaTime) {
    // Player Update
    player.update(deltaTime, keys);
    // Enemy Update
    // Main
    for (let x of Enemies) {
        x.update(deltaTime, player);
    }
    // Shooting
    for (let x of Enemies) {
        if (x.currentCooldown <= 0) {
            x.currentCooldown = x.maxCooldown;
            EnemyBullets.push(new Bullet(x.x,x.y,player.x,player.y,250,x.colour,x.size/6,x.damage))
        }
    }
    // Collision
    for (let x of Enemies) {
        for (let index = PlayerBullets.length - 1; index >= 0; index--) {
            let b = PlayerBullets[index];
            if (b.getDistanceToObject(x) < x.size + b.size) {
                x.health -= b.damage;
                PlayerBullets.splice(index, 1);
            }
        }
    }
    // Death
    for (let index = Enemies.length - 1; index >= 0; index--) {
        if (Enemies[index].health <= 0) {
            const EnemyObj = Enemies[index]
            for (let index = 1; index <= EnemyObj.expDropped; index++) {
                ExperienceOrbs.push(new ExperienceOrb(
                    clamp(EnemyObj.x+getRandom(-50,50),0,800),
                    clamp(EnemyObj.y+getRandom(-50,50),0,800)
                ))
            }
            Enemies.splice(index, 1);
        }
    }
    // Bullets
    for (let x of [...PlayerBullets, ...EnemyBullets]) {
        x.update(deltaTime);
    }
    // Delete Bullets if out of Bounding Box
    // Player
    for (let index = PlayerBullets.length - 1; index >= 0; index--) {
        const bulobj = PlayerBullets[index];
        if (bulobj.x < -bulobj.size || bulobj.x > 800+bulobj.size || bulobj.y < -bulobj.size || bulobj.y > 800+bulobj.size) {PlayerBullets.splice(index, 1);}
    }
    // Enemy
    for (let index = EnemyBullets.length - 1; index >= 0; index--) {
        const bulobj = EnemyBullets[index];
        if (bulobj.x < -bulobj.size || bulobj.x > 800+bulobj.size || bulobj.y < -bulobj.size || bulobj.y > 800+bulobj.size) {EnemyBullets.splice(index, 1);}
    }

    // Exp Update
    for (let index = ExperienceOrbs.length - 1; index >= 0; index--) {
        const orb = ExperienceOrbs[index];
        if (orb.update(deltaTime, player)) {
            player.level += player.lvlGain;
            ExperienceOrbs.splice(index, 1);
        }
    }
    // Player Damage
    for (let index = EnemyBullets.length - 1; index >= 0; index--) {
        const bullet = EnemyBullets[index];
        if (bullet.getDistanceToObject(player) < player.size + bullet.size) {
            player.health -= bullet.damage;
            EnemyBullets.splice(index, 1);
        }
    }
    // Player Dead State
    if (player.health <= 0) {
        player.lives -= 1;
        player.health = player.maxHealth
    }
    if (Math.floor(player.lives) <= 0) {dead();}
    // Level up
    if (Math.floor(player.level) > prevLevel) {
        gameState = "upgrade";
        openUpgradeMenu(player, () => {
            prevLevel += 1;
            gameState = "playing";
        });
    }
    // Enemies Wave Spawn
    if (Enemies.length == 0) {
        if (waveTimer >= waveIntermission) {
            waveTimer = 0;
            wave += 1;
            spawnEnemies(Math.floor(wave/4)+1);
        }
        else {waveTimer += deltaTime;}
    }
}

function dead() {
    gameState = "dead";
    document.getElementById("death-screen").hidden = false;
}

function draw(deltaTime) {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear
    // Text
    ctx.font = '24px Arial';
    ctx.fillStyle = '#555555';
    frameCount++;
    ctx.fillText("FPS: " + Math.floor(1/deltaTime), 0, 24);

    ctx.font = '15px Arial';
    ctx.fillText("HP: " + player.health, 0, 39);
    ctx.fillText("Level: " + (Math.floor(player.level*100))/100, 0, 54);
    ctx.fillText("Wave: " + wave, 0, 69)
    // Bullets
    for (let x of [...PlayerBullets, ...EnemyBullets]) {
        ctx.fillStyle = x.colour;
        drawCircle(ctx, x.x, x.y, x.size);
    }
    // Exp Orbs
    for (let x of ExperienceOrbs) {
        ctx.fillStyle = "#7af3f1"
        drawCircle(ctx, x.x, x.y, 3);
    }
    // Enemies
    for (let x of Enemies) {
        ctx.fillStyle = x.colour;
        drawCircle(ctx, x.x, x.y, x.size);
    }
    // Player
    ctx.fillStyle = player.colour;
    drawCircle(ctx, player.x, player.y, player.size);
}

function drawUpgradeScreen() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function gameLoop(currentTime) {
    if (!lastTime) {
        lastTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }
    const deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    if (gameState === "playing") {
        update(deltaTime);
        draw(deltaTime);
    } else if (gameState === "upgrade") {
        draw(deltaTime);
        drawUpgradeScreen();
    }

    requestAnimationFrame(gameLoop);
}

draw(1 / 60);
requestAnimationFrame(gameLoop);