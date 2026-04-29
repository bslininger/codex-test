import { addItem, createInventory } from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const inventory = createInventory(3);

addItem(inventory, ITEM_DEFINITIONS, "health-potion", 6);
addItem(inventory, ITEM_DEFINITIONS, "apple", 3);

const result = addItem(inventory, ITEM_DEFINITIONS, "health-potion", 8);

console.log("Add result:");
console.log(result);
console.log("Inventory:");
console.log(inventory.slots);
