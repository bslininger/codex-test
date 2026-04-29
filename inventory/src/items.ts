import type { ItemDefinition } from "./inventory.js";

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
    "health-potion": {
        id: "health-potion",
        name: "Health Potion",
        maxStackSize: 10,
    },
    apple: {
        id: "apple",
        name: "Apple",
        maxStackSize: 20,
    },
    sword: {
        id: "sword",
        name: "Iron Sword",
        maxStackSize: 1,
    },
};
