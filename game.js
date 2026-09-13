const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

import {Bullet, Player, ExperienceOrb, Enemy, clamp, getRandom} from "./classes.js"
import {openUpgradeMenu} from "./upgrade.js"
import {enemyTypes, enemyData} from "./enemyTypes.js"

function getRandomInt(a, b) {return Math.floor(getRandom(a,b))}
function spawnEnemyType(type, x, y) {
    if (type in enemyData) {
        let eT = enemyData[type]; // short for enemyType
        for (let i = 1; i <= eT.swarmAmount; i++) {
            const nx = clamp(x+getRandom(-50,50),0,800)
            const ny = clamp(y+getRandom(-50,50),0,800)
            Enemies.push(
                new Enemy(
                    nx,ny,type,
                    eT.speed, eT.size, eT.colour, 
                    clamp(eT.health*(1+(player.level/100)),0,200), eT.damage, eT.cooldown, 
                    eT.expDropped, eT.bulletSpeed
                ));
}}}

let frameCount = 0;
let lastTime = 0;
let gameState = "playing";
let prevLevel = 0;
let wave = 0;
let waveIntermission = 3
let waveTimer = 0
// Get Global MouseX and Y
let mouseX = 0;
let mouseY = 0;
window.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

const keys = {};
const PlayerBullets = [];
const EnemyBullets = [];
const ExperienceOrbs = [];
const Enemies = [];

function spawnEnemies(amount) {
    for (let index = 1; index <= amount; index++) {
        const availableEnemyTypes = enemyTypes.filter(
            (type) => player.level >= enemyData[type].minPlayerLvl
        )
        spawnEnemyType(availableEnemyTypes[getRandomInt(0, availableEnemyTypes.length)], getRandom(0,800), getRandom(0,800));
    }}

const player = new Player(100,100,150,30,"red",100,5)
spawnEnemies(1);
window.game = { player, Enemies, ExperienceOrbs, ExperienceOrb, waveIntermission, wave, enemyData }; // Debugging

document.getElementById("restart-button").addEventListener("click", () => {
    window.location.reload();
});

window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (key === "escape" || key === "`") {
        if (gameState === "paused") { 
            gameState = "playing"; 
            document.getElementById("pause-screen").hidden = true; 
        } 
        else if (gameState === "playing") { 
            gameState = "paused"; 
            document.getElementById("pause-screen").hidden = false; 
        }
    } else if (key === "e" && player.abilities.has("dash") && player.abilityCooldowns["dash"] <= 0) {
        player.abilityCooldowns["dash"] = 2 // Cooldown
        // Normalise Vector
        const rect = canvas.getBoundingClientRect();

        const targetX = (mouseX - rect.left) * (canvas.width / rect.width);
        const targetY = (mouseY - rect.top) * (canvas.height / rect.height);

        const dirX = targetX - player.x;
        const dirY = targetY - player.y;
        const distance = Math.sqrt(dirX*dirX+dirY*dirY);
        let normX = 0;
        let normY = 0;
        if (distance > 0) {
            normX = dirX / distance;
            normY = dirY / distance;
        }
        // Move
        player.x += normX * player.speed
        player.y += normY * player.speed

        if (distance > 0) {
            normX = dirX / distance;
            normY = dirY / distance;
        }
    } else if (key === "r" && player.abilities.has("teleport") && player.abilityCooldowns["teleport"] <= 0) {
        player.abilityCooldowns["teleport"] = 15;
        player.x = getRandom(0,800);
        player.y = getRandom(0,800);
    } else if (key === "t" && player.abilities.has("medkit") && player.abilityCooldowns["medkit"] <= 0) {
        player.abilityCooldowns["medkit"] = 20;
        player.health += 30
    }
    keys[key] = true;
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
        if (x.type === "Burst") {
            if ((x.burstShotsRemaining === undefined || x.burstShotsRemaining <= 0) && x.currentCooldown <= 0) {
                x.currentCooldown = x.maxCooldown;
                x.burstShotsRemaining = 3;
                x.burstTimer = 0;
                x.burstAngle = Math.atan2(player.y - x.y, player.x - x.x);
            }

            if (x.burstShotsRemaining > 0) {
                x.burstTimer -= deltaTime;

                if (x.burstTimer <= 0) {
                    EnemyBullets.push(new Bullet(
                        x.x, x.y,
                        x.x + Math.cos(x.burstAngle) * 1000,
                        x.y + Math.sin(x.burstAngle) * 1000,
                        x.bulletSpeed, x.colour, x.size / 7, x.damage
                    ));
                    x.burstShotsRemaining -= 1;
                    x.burstTimer = 0.15;
                }
            }

            continue;
        }

        if (x.currentCooldown <= 0) {
            x.currentCooldown = x.maxCooldown;
            // Shoot
            if (x.type === "Shotgun") {
                const spread = 0.5;

                for (let offset = -1; offset <= 1; offset++) {
                    const targetX = player.x + offset * spread * 100;
                    const targetY = player.y;

                    EnemyBullets.push(new Bullet(
                        x.x, x.y, targetX, targetY,
                        x.bulletSpeed, x.colour, x.size / 7, x.damage
                    ));
                }
            } else { EnemyBullets.push(new Bullet(x.x,x.y,player.x,player.y,x.bulletSpeed,x.colour,x.size/6,x.damage,(x.type === "Homing"),player)) }
            // After Shoot
            if (x.type === "Teleporter") {
                x.x = getRandom(0,800);
                x.y = getRandom(0,800);
            }
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
    // Delete Bullets if out of Bounding Box or if Lifetime is above 20 secs
    // Player
    for (let index = PlayerBullets.length - 1; index >= 0; index--) {
        const bulobj = PlayerBullets[index];
        if (bulobj.lifetime >= 20 || bulobj.x < -bulobj.size || bulobj.x > 800+bulobj.size || bulobj.y < -bulobj.size || bulobj.y > 800+bulobj.size) {PlayerBullets.splice(index, 1);}
    }
    // Enemy
    for (let index = EnemyBullets.length - 1; index >= 0; index--) {
        const bulobj = EnemyBullets[index];
        if (bulobj.lifetime >= 20 || bulobj.x < -bulobj.size || bulobj.x > 800+bulobj.size || bulobj.y < -bulobj.size || bulobj.y > 800+bulobj.size) {EnemyBullets.splice(index, 1);}
    }

    // Exp Update
    combineExperienceOrbs();
    for (let index = ExperienceOrbs.length - 1; index >= 0; index--) {
        const orb = ExperienceOrbs[index];
        if (orb.update(deltaTime, player)) {
            player.level += player.lvlGain * orb.xpOrbsContained;
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
        if (Math.floor(player.level) % 5 === 1) { player.health += 5; }
        gameState = "upgrade";
        openUpgradeMenu(player, () => {
            prevLevel += 1;
            gameState = "playing";
        });
    }
    // Enemies Wave Spawn
    if (Enemies.length === 0) {
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

function combineExperienceOrbs() {
    const mergeDistance = 24;
    const mergeDistanceSquared = mergeDistance * mergeDistance;

    for (let i = 0; i < ExperienceOrbs.length; i++) {
        const mainOrb = ExperienceOrbs[i];

        for (let j = ExperienceOrbs.length - 1; j > i; j--) {
            const otherOrb = ExperienceOrbs[j];

            const dx = mainOrb.x - otherOrb.x;
            const dy = mainOrb.y - otherOrb.y;

            if (dx * dx + dy * dy <= mergeDistanceSquared) {
                const mainAmount = mainOrb.xpOrbsContained;
                const otherAmount = otherOrb.xpOrbsContained;
                const totalAmount = mainAmount + otherAmount;

                // Keep the merged orb centered between both orbs.
                mainOrb.x =
                    (mainOrb.x * mainAmount + otherOrb.x * otherAmount) /
                    totalAmount;
                mainOrb.y =
                    (mainOrb.y * mainAmount + otherOrb.y * otherAmount) /
                    totalAmount;

                mainOrb.xpOrbsContained = totalAmount;
                ExperienceOrbs.splice(j, 1);
            }
        }
    }
}

function toSentenceCase(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
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
    ctx.fillText("Wave: " + wave, 0, 69);
    ctx.fillText("Lives: " + Math.floor(player.lives), 0, 84);
    let abilityCdY = 99;
    ctx.font = '10px Arial';
    for (const ability of player.abilities) {
        const cooldown = player.abilityCooldowns[ability] ?? 0;
        const cooldownText = cooldown > 0 ? Math.ceil(cooldown*10)/10 : "Ready";
        ctx.fillText(`${toSentenceCase(ability)}: ${cooldownText}`, 0, abilityCdY);
        abilityCdY += 10;
    }
    // Bullets
    for (let x of [...PlayerBullets, ...EnemyBullets]) {
        ctx.fillStyle = x.colour;
        drawCircle(ctx, x.x, x.y, x.size);
    }
    // Exp Orbs
    for (let x of ExperienceOrbs) {
        ctx.fillStyle = "#7af3f1"
        drawCircle(ctx, x.x, x.y, 3 + (x.xpOrbsContained/4) - 0.25);
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

function drawTransparentBox() {
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
        drawTransparentBox();
    } else if (gameState === "paused") {
        draw(deltaTime);
        drawTransparentBox();
    }

    requestAnimationFrame(gameLoop);
}

draw(1 / 60);
requestAnimationFrame(gameLoop);