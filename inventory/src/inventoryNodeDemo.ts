import {
    addItem,
    createHeldSlot,
    createInventory,
    interactHeldSlotWithInventorySlot,
    moveSlot,
} from "./inventoryModel.js";
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

const heldSlot = createHeldSlot();
const pickUpResult = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, 0);
const heldMergeResult = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, 2);

console.log("Pick up result:");
console.log(pickUpResult);
console.log("Held merge result:");
console.log(heldMergeResult);
console.log("Held slot:");
console.log(heldSlot);
console.log("Inventory after held interactions:");
console.log(inventory.slots);
