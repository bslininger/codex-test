import type { ItemDefinition } from "./inventoryModel.js";

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
    "health-potion": {
        id: "health-potion",
        name: "Health Potion",
        maxStackSize: 10,
        valueCopper: 125,
    },
    apple: {
        id: "apple",
        name: "Apple",
        maxStackSize: 20,
        valueCopper: 35,
    },
    sword: {
        id: "sword",
        name: "Iron Sword",
        maxStackSize: 1,
        valueCopper: 4580,
    },
};
