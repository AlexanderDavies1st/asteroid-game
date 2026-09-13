export class Player {
    constructor(x, y, speed, radius, colour, startHP, damage) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.size = radius;
        this.colour = colour;
        this.health = startHP;
        this.maxHealth = startHP;
        this.level = 0;
        this.damage = damage;
        this.bulletSpeed = 150;
        this.bulletSize = radius/6;
        this.maxCooldown = 0.5;
        this.currentCooldown = 0;
        this.lives = 1;
        this.lvlGain = 0.05;
        this.expSpeed = 30;
        this.expRange = 150;
        this.expCatchRange = radius;
        this.abilities = new Set();
        this.abilityCooldowns = {};
    }

    update(deltaTime, keys) {
        // Movement
        this.x += (Number(keys["d"] || keys["arrowright"] || false) - Number(keys["a"] || keys["arrowleft"] || false)) * this.speed * deltaTime;
        this.y += (Number(keys["s"] || keys["arrowdown"] || false) - Number(keys["w"] || keys["arrowup"] || false)) * this.speed * deltaTime;
        this.x = clamp(this.x, this.size, 800-this.size);
        this.y = clamp(this.y, this.size, 800-this.size);
        // Cooldown
        if (this.currentCooldown > 0) {this.currentCooldown -= deltaTime;}
        if (this.currentCooldown < 0) {this.currentCooldown = 0;}
        // Ability Cooldowns
        for (const ability of this.abilities) {
            if (this.abilityCooldowns[ability] > 0) { this.abilityCooldowns[ability] -= deltaTime; }
            if (this.abilityCooldowns[ability] < 0) { this.abilityCooldowns[ability] = 0; }
        }
    }
}

export class Enemy {
    constructor(x, y, type, speed, radius, colour, startHP, damage, cooldown, expDropped, bulletSpeed) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.speed = speed;
        this.size = radius;
        this.colour = colour;
        this.health = startHP;
        this.maxHealth = startHP;
        this.damage = damage;
        this.maxCooldown = cooldown;
        this.currentCooldown = cooldown;
        this.expDropped = expDropped;
        this.bulletSpeed = bulletSpeed;
    }

    update(deltaTime, target) {
        // Movement
        const vx = target.x - this.x;
        const vy = target.y - this.y;
        const distance = Math.sqrt(vx * vx + vy * vy);
        if (distance > 0) {
            this.x += (vx / distance) * deltaTime * this.speed + getRandom(-0.5,0.5);
            this.y += (vy / distance) * deltaTime * this.speed + getRandom(-0.5,0.5);
        }
        // Cooldown
        if (this.currentCooldown != 0) {this.currentCooldown -= deltaTime;}
        if (this.currentCooldown < 0) {this.currentCooldown = 0;}
    }
}

export class Bullet {
    constructor(startX, startY, targetX, targetY, speed, colour, radius, damage, homing, homingTarget) {
        this.x = startX;
        this.y = startY;
        this.speed = speed;
        this.prevX = startX;
        this.prevY = startY;
        this.colour = colour;
        this.size = radius;
        this.damage = damage;
        this.lifetime = 0;
        this.homing = homing;
        this.homingTarget = homingTarget;

        const dx = targetX - startX;
        const dy = targetY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Prevent division by zero
        this.vx = distance > 0 ? (dx / distance) * this.speed : 0;
        this.vy = distance > 0 ? (dy / distance) * this.speed : 0;
    }

    update(deltaTime) {
        if (this.homing && this.lifetime <= 1) {
            const dx = this.homingTarget.x - this.x;
            const dy = this.homingTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            // Prevent division by zero
            this.vx = distance > 0 ? (dx / distance) * this.speed : 0;
            this.vy = distance > 0 ? (dy / distance) * this.speed : 0;
        }
        this.prevX = this.x
        this.prevY = this.y
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.lifetime += deltaTime;
    }

    getDistanceToObject(object) {
        // Prevent Errors
        if (!object) {return 1000;}
        // Get variables
        const target = {x: object.x, y: object.y}
        const lineStart = {x: this.prevX, y: this.prevY}
        const lineEnd = {x: this.x, y: this.y}
        // Use Function
        const closestPoint = getClosestPointOnLine(lineStart, lineEnd, target);
        // Return
        return getDistance(closestPoint.x, closestPoint.y, object.x, object.y);
    }
}

export class ExperienceOrb {
    constructor(x,y,uncollectable) {
        this.x = x
        this.y = y
        this.uncollectable = !!uncollectable
        this.xpOrbsContained = 1
    }
    update(deltaTime, player) {
        let playerdist = getDistance(this.x,this.y,player.x,player.y);
        if (playerdist < player.expCatchRange + ((this.xpOrbsContained/4) - 0.25) && !this.uncollectable) { return true; }
        if (playerdist < player.expRange) {
            let vx = player.x - this.x
            let vy = player.y - this.y
            this.x += vx * deltaTime / (playerdist/player.expSpeed);
            this.y += vy * deltaTime / (playerdist/player.expSpeed);
        }
        return false;
    }
}

// Functions
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
export function getRandom(a, b) {return Math.random() * (b - a) + a;}

function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

function getClosestPointOnLine(A, B, P) {
    // Get direction vector
    const dx = B.x - A.x;
    const dy = B.y - A.y;
    
    // Get vector from line start to target point
    const vx = P.x - A.x;
    const vy = P.y - A.y;
    
    // Calculate dot products to find the projection factor
    const dotProduct_v_d = (vx * dx) + (vy * dy);
    const dotProduct_d_d = (dx * dx) + (dy * dy);
    
    // Prevent division by zero
    if (dotProduct_d_d === 0) return { x: A.x, y: A.y };
    
    const t = Math.max(0, Math.min(1, dotProduct_v_d / dotProduct_d_d));
    
    // Return
    return {
        x: A.x + t * dx,
        y: A.y + t * dy
    };
}