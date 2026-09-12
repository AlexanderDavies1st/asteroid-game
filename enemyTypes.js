
class EnemyType {
    constructor(speed, radius, colour, damage, cooldown, expDropped, health) {
        this.speed = speed;
        this.size = radius;
        this.colour = colour;
        this.damage = damage;
        this.cooldown = cooldown;
        this.expDropped = expDropped;
        this.health = health;
    }
}


export const enemyData = {
    Speed: new EnemyType(160,15,"lightblue",2,0.7,2,15),
    Tank: new EnemyType(75,35,"darkblue",7,1.5,4,30),
    Normal: new EnemyType(100,25,"blue",4,1,3,20)
};
export const enemyTypes = Object.keys(enemyData);