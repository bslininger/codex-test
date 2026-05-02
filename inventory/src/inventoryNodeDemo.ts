import {
    addItem,
    createHeldSlot,
    createInventory,
    createMoney,
    interactHeldSlotWithInventorySlot,
    moveSlot,
    pullQuantityFromInventorySlotToHeldSlot,
    sellHeldItem,
    spendMoney,
    getAddItemCapacity,
    buyItem,
} from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

let inventory = createInventory(3);

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

heldSlot.entry = null;
const pullResult = pullQuantityFromInventorySlotToHeldSlot(heldSlot, inventory, 2, 3);

console.log("Pull quantity result:");
console.log(pullResult);
console.log("Held slot after pull:");
console.log(heldSlot);
console.log("Inventory after pull:");
console.log(inventory.slots);

let money = createMoney();
const sellResult = sellHeldItem(heldSlot, ITEM_DEFINITIONS, money);

console.log("Sell result:");
console.log(sellResult);
console.log("Money after sale:");
console.log(money);

money = createMoney(1, 5, 50);
let spendMoneyResult = spendMoney(money, 290);

console.log("Spend money result 1:");
console.log(spendMoneyResult);
console.log("Money after spending:");
console.log(money);

spendMoneyResult = spendMoney(money, 315);

console.log("Spend money result 2:");
console.log(spendMoneyResult);
console.log("Money after spending:");
console.log(money);

money = createMoney(0, 0, 500);
spendMoneyResult = spendMoney(money, 195);

console.log("Spend money result 3:");
console.log(spendMoneyResult);
console.log("Money after spending:");
console.log(money);

spendMoneyResult = spendMoney(money, 20000);

console.log("Spend money result 4:");
console.log(spendMoneyResult);
console.log("Money after spending:");
console.log(money);

inventory = createInventory(3);
addItem(inventory, ITEM_DEFINITIONS, "health-potion", 6);
addItem(inventory, ITEM_DEFINITIONS, "apple", 3);
const itemsToAdd = ["health-potion", "apple", "sword"];
const capacitiesToAdd = itemsToAdd.map((itemId) => getAddItemCapacity(inventory, ITEM_DEFINITIONS, itemId));

console.log("Inventory:");
console.log(inventory.slots);
console.log("Remaining item capacities:");
console.log(itemsToAdd.map((itemId, index) => `${itemId}: ${capacitiesToAdd[index]}`).join("; "));

money = createMoney(0, 40, 0);
let moneyBeforePurchase = { ...money };
let buyItemResult = buyItem(inventory, ITEM_DEFINITIONS, money, "sword", 1);

console.log("Buy item result 1:");
console.log(buyItemResult);
console.log("Money before purchase:");
console.log(moneyBeforePurchase);
console.log("Inventory after purchase:");
console.log(inventory);
console.log("Money after purchase");
console.log(money);

moneyBeforePurchase = { ...money };
buyItemResult = buyItem(inventory, ITEM_DEFINITIONS, money, "health-potion", 15);

console.log("Buy item result 2:");
console.log(buyItemResult);
console.log("Money before purchase:");
console.log(moneyBeforePurchase);
console.log("Inventory after purchase:");
console.log(inventory);
console.log("Money after purchase");
console.log(money);

moneyBeforePurchase = { ...money };
buyItemResult = buyItem(inventory, ITEM_DEFINITIONS, money, "apple", 37);

console.log("Buy item result 3:");
console.log(buyItemResult);
console.log("Money before purchase:");
console.log(moneyBeforePurchase);
console.log("Inventory after purchase:");
console.log(inventory);
console.log("Money after purchase");
console.log(money);