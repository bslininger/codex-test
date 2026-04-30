import { addItem, createInventory, moveSlot } from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const inventory = createInventory(3);

addItem(inventory, ITEM_DEFINITIONS, "health-potion", 6);
addItem(inventory, ITEM_DEFINITIONS, "apple", 3);

const result = addItem(inventory, ITEM_DEFINITIONS, "health-potion", 8);

console.log("Add result:");
console.log(result);
console.log("Inventory:");
console.log(inventory.slots);

const moveResult = moveSlot(inventory, ITEM_DEFINITIONS, 0, 2);

console.log("Move result:");
console.log(moveResult);
console.log("Inventory after move:");
console.log(inventory.slots);
