
class EnemyType {
    constructor(speed, radius, colour, damage, cooldown, expDropped, health, minPlayerLvl, swarmAmount, bulletSpeed, burstCount) {
        this.speed = speed;
        this.size = radius;
        this.colour = colour;
        this.damage = damage;
        this.cooldown = cooldown;
        this.expDropped = expDropped;
        this.health = health;
        this.minPlayerLvl = minPlayerLvl;
        this.swarmAmount = swarmAmount;
        this.bulletSpeed = bulletSpeed;
        this.burstCount = burstCount;
    }
}


export const enemyData = {
    Speed: new EnemyType(160,15,"#8cd1f1",4,0.7,2,15,0,1,300,1),
    Tank: new EnemyType(75,35,"#315ad4",10,1.5,4,30,0,1,350,1),
    Normal: new EnemyType(100,25,"#558bd7",7,1,3,20,0,1,300,1),
    Sniper: new EnemyType(50,30,"#e4f18c",15,2.5,5,50,5,1,750,1),
    Swarm: new EnemyType(120,10,"#b5ca30",3,1.2,1,5,7,5,200,1),
    Teleporter: new EnemyType(100,25,"#7bdea6",8,1.2,4,20,7,1,500,1),
    MineLayer: new EnemyType(100,25,"#2ec175",15,1,3,50,10,3,0,1),
    Shotgun: new EnemyType(80,30,"#d68cff",8,2,5,35,10,1,350,1),
    Homing: new EnemyType(60,20,"#ae12c6",15,1.5,5,65,15,1,200,1),
    Burst: new EnemyType(70,25,"#a32cdb",8,2,5,70,15,1,300,3),
    Boss: new EnemyType(0,40,"#000000",50,1,30,300,50,1,1000,3)
};
export const enemyTypes = Object.keys(enemyData);