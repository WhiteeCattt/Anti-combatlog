import { world, system, Player, ItemStack } from "@minecraft/server";
import config from "./config.js";
console.warn("[Anti-combatlog] §l§aReloaded!")

function getScore(target, objective) {
  try {
    const oB = world.scoreboard.getObjective(objective);
    if (typeof target == "string")
      return oB.getScore(
        oB.getParticipants().find((pT) => pT.displayName == target)
      );
    return oB.getScore(target.scoreboardIdentity);
  } catch {
    return 0;
  }
}

const overworld = world.getDimension("overworld")
overworld.runCommandAsync(`scoreboard objectives add ${config.object} dummy`)
let cache = {}


/**
 * Copyright (C) 2024 WhiteeCattt
 * GitHub: https://github.com/WhiteeCattt/
 * Project: https://github.com/WhiteeCattt/Anti-combatlog
 * Discord: WhiteeCattt
*/
world.afterEvents.entityDie.subscribe(({ deadEntity: player }) => {
    if (getScore(player, config.object) < 1) return;
    player.runCommandAsync(`scoreboard players set @s ${config.object} 0`).then(() => {
        player.sendMessage(config.prefix + "You've left PvP mode!")
    })
}, { entityTypes: ["minecraft:player"] } )


world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn) return;
    if (getScore(player, config.object) < 1) return;
    player.runCommandAsync(`scoreboard players set @s ${config.object} 0`)
    player.sendMessage(config.prefix + "You were killed for leaving the game during PvP!")
    player.getComponent("inventory").container.clearAll()
    for (const equipment of ["Offhand", "Head", "Chest", "Legs", "Feet"]) {
        player.getComponent("equippable").setEquipment(equipment, new ItemStack("air"))
    }
    player.kill()
})


/**
 * Copyright (C) 2024 WhiteeCattt
 * GitHub: https://github.com/WhiteeCattt/
 * Project: https://github.com/WhiteeCattt/Anti-combatlog
 * Discord: WhiteeCattt
*/
world.afterEvents.entityHurt.subscribe((data) => {
    const player = data.hurtEntity
    const target = data.damageSource.damagingEntity
    if (!target || target.typeId !== "minecraft:player") return;
    if (getScore(player, config.object) < 1) {
        player.sendMessage(config.prefix + "You have entered PvP mode!")
    }
    if (getScore(target, config.object) < 1) {
        target.sendMessage(config.prefix + "You have entered PvP mode!")
    }
    player.runCommandAsync(`scoreboard players set @s${config.object} ${config.time}`)
    target.runCommandAsync(`scoreboard players set @s ${config.object} ${config.time}`)
}, { entityTypes: ["minecraft:player"] })



/**
 * Copyright (C) 2024 WhiteeCattt
 * GitHub: https://github.com/WhiteeCattt/
 * Project: https://github.com/WhiteeCattt/Anti-combatlog
 * Discord: WhiteeCattt
*/
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (getScore(player, config.object) > 0) {
            player.runCommandAsync(`scoreboard players remove @s ${config.object} 1`).then(() => {
                if (getScore(player, config.object) < 1) {
                    player.sendMessage(config.prefix + "You've left PvP mode!")
                    cache[player.name] = undefined
                } else {
                    player.runCommandAsync(`titleraw @s actionbar {"rawtext":[{"text":"Combat log: §g${getScore(player, config.object)}§rs"}]}`)
                }
            })
        }
    }
}, 20)



/**
 * Copyright (C) 2024 WhiteeCattt
 * GitHub: https://github.com/WhiteeCattt/
 * Project: https://github.com/WhiteeCattt/Anti-combatlog
 * Discord: WhiteeCattt
*/
system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
        if (getScore(player, config.object) > 0) {
            let items = []
            for (let i = 0; i < 36; i++) {
                const item = player.getComponent("inventory").container.getItem(i)
                if (item) { items.push(item) }
            }
            for (const equipment of ["Offhand", "Head", "Chest", "Legs", "Feet"]) {
                const item = player.getComponent("equippable").getEquipment(equipment)
                if (item) { items.push(item) }
            }
            cache[player.name] = items
        }
    }
})


/**
 * Copyright (C) 2024 WhiteeCattt
 * GitHub: https://github.com/WhiteeCattt/
 * Project: https://github.com/WhiteeCattt/Anti-combatlog
 * Discord: WhiteeCattt
*/
world.beforeEvents.playerLeave.subscribe(({ player }) => {
    const { name, location, dimension } = player
    if (getScore(player, config.object) < 1) return;
    system.run(() => {
        for (const item of cache[name]) {
            dimension.spawnItem(item, location)
        }
        world.sendMessage(`Player §g$${name}§r was killed for quitting during PvP!`)
    })
})
