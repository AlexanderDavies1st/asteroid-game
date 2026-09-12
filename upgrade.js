const upgrades = [
    {
        name: "Blitz",
        description: "+20 movement speed",
        maxLevel: 5,
        apply(player) {player.speed += 20;}
    },
    {
        name: "Health Pack",
        description: "+20 health and +20 max health",
        maxLevel: 5,
        apply(player) {
            player.health += 20;
            player.maxHealth += 20;
        }
    },
    {
        name: "Chunky Shooter",
        description: "+2 bullet size",
        maxLevel: 5,
        apply(player) {player.bulletSize += 2;}
    },
    {
        name: "Sharp Shooter",
        description: "+30 bullet speed",
        maxLevel: 5,
        apply(player) {player.bulletSpeed += 30;}
    },
    {
        name: "Fastest in the West",
        description: "*0.9 Shooting Cooldown",
        maxLevel: 5,
        apply(player) {player.maxCooldown *= 0.9;}
    },
    {
        name: "Live Laugh Life",
        description: "+0.5 Lives. 2 Upgrades means a Life",
        maxLevel: 4,
        apply(player) {player.lives += 0.5;}
    },
    {
        name: "Heavy Bullets",
        description: "+10 damage",
        maxLevel: 5,
        apply(player) {player.damage += 10;}
    },
    {
        name: "Experience Rangler",
        description: "+20 Exp Speed",
        maxLevel: 5,
        apply(player) {player.expSpeed += 20;}
    },
    {
        name: "Experience Gainer",
        description: "+0.05 Level Gain",
        maxLevel: 5,
        apply(player) {player.lvlGain += 0.05;}
    },
    {
        name: "Magnet",
        description: "+20 exp orb sight range",
        maxLevel: 5,
        apply(player) {player.expRange += 20;}
    },
    {
        name: "Experience Catcher",
        description: "+20 exp orb catch range",
        maxLevel: 5,
        apply(player) {player.expCatchRange += 20;}
    }
];

function getRandomUpgrades(source, amount) {
    const shuffled = [...source];

    for (let index = shuffled.length - 1; index > 0; index--) {
        const randomIndex = Math.floor(Math.random() * (index + 1));
        [shuffled[index], shuffled[randomIndex]] =
            [shuffled[randomIndex], shuffled[index]];
    }

    return shuffled.slice(0, amount);
}

function getUpgradeLevel(player, upgrade) {
    return player.upgradeLevels?.[upgrade.name] ?? 0;
}

export function openUpgradeMenu(player, onUpgradeSelected) {
    const menu = document.getElementById("upgrade-menu");
    const options = document.getElementById("upgrade-options");

    options.replaceChildren();

    const availableUpgrades = upgrades.filter(
        (upgrade) => getUpgradeLevel(player, upgrade) < upgrade.maxLevel
    );

    for (const upgrade of getRandomUpgrades(availableUpgrades, Math.min(3, availableUpgrades.length))) {
        const button = document.createElement("button");
        const level = getUpgradeLevel(player, upgrade);

        button.textContent = `${upgrade.name} (${level}/${upgrade.maxLevel}): ${upgrade.description}`;

        button.addEventListener("click", () => {
            upgrade.apply(player);
            player.upgradeLevels ??= {};
            player.upgradeLevels[upgrade.name] = level + 1;
            menu.hidden = true;
            onUpgradeSelected();
        });

        options.appendChild(button);
    }

    const skipButton = document.createElement("button");
    skipButton.type = "button";
    skipButton.textContent = "Skip";
    skipButton.addEventListener("click", () => {
        menu.hidden = true;
        onUpgradeSelected();
    });
    options.appendChild(document.createElement("br"));
    options.appendChild(document.createElement("br"));
    options.appendChild(skipButton);

    menu.hidden = false;
}