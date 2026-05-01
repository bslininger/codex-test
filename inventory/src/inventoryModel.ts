export type ItemDefinition = {
    id: string;
    name: string;
    maxStackSize: number;
    valueCopper: number;
};

export type InventoryEntry = {
    itemId: string;
    quantity: number;
};

export type InventorySlot = InventoryEntry | null;

export type Inventory = {
    slots: InventorySlot[];
};

export type HeldSlot = {
    entry: InventorySlot;
};

export type Money = {
    gold: number;
    silver: number;
    copper: number;
};

export type AddItemResult = {
    addedQuantity: number;
    leftoverQuantity: number;
    changedSlotIndices: number[];
};

export type MoveSlotResult =
    | {
          kind: "no-op";
          reason: "same-slot" | "empty-source" | "target-stack-full";
          changedSlotIndices: [];
      }
    | {
          kind: "moved";
          changedSlotIndices: number[];
      }
    | {
          kind: "merged";
          movedQuantity: number;
          changedSlotIndices: number[];
      }
    | {
          kind: "swapped";
          changedSlotIndices: number[];
      };

export type HeldSlotInteractionResult =
    | {
          kind: "no-op";
          reason: "empty-held-and-empty-target" | "target-stack-full";
          changedSlotIndices: [];
      }
    | {
          kind: "picked-up";
          changedSlotIndices: number[];
      }
    | {
          kind: "placed";
          changedSlotIndices: number[];
      }
    | {
          kind: "merged";
          movedQuantity: number;
          changedSlotIndices: number[];
      }
    | {
          kind: "swapped";
          changedSlotIndices: number[];
      };

export type PullQuantityResult = {
    kind: "pulled";
    quantity: number;
    fullStack: boolean;
    changedSlotIndices: number[];
};

export type SellHeldItemResult = {
    kind: "sold";
    itemId: string;
    quantity: number;
    valueCopper: number;
    moneyAdded: Money;
};

export function createInventory(slotCount: number): Inventory {
    return {
        slots: Array.from({ length: slotCount }, () => null),
    };
}

export function createHeldSlot(): HeldSlot {
    return {
        entry: null,
    };
}

export function createMoney(gold = 0, silver = 0, copper = 0): Money {
    validateMoneyAmount(gold, "gold");
    validateMoneyAmount(silver, "silver");
    validateMoneyAmount(copper, "copper");

    return {
        gold,
        silver,
        copper,
    };
}

export function addItem(
    inventory: Inventory,
    itemDefinitions: Record<string, ItemDefinition>,
    itemId: string,
    quantity: number,
): AddItemResult {
    const itemDefinition = itemDefinitions[itemId];

    if (!itemDefinition) {
        throw new Error(`Unknown item id: ${itemId}`);
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a positive integer.");
    }

    let remainingQuantity = quantity;
    const changedSlotIndices = new Set<number>();

    for (let index = 0; index < inventory.slots.length; index += 1) {
        const slot = inventory.slots[index];

        if (!slot || slot.itemId !== itemId || slot.quantity >= itemDefinition.maxStackSize) {
            continue;
        }

        const availableSpace = itemDefinition.maxStackSize - slot.quantity;
        const quantityToAdd = Math.min(availableSpace, remainingQuantity);

        slot.quantity += quantityToAdd;
        remainingQuantity -= quantityToAdd;
        changedSlotIndices.add(index);

        if (remainingQuantity === 0) {
            return buildAddItemResult(quantity, remainingQuantity, changedSlotIndices);
        }
    }

    for (let index = 0; index < inventory.slots.length; index += 1) {
        const slot = inventory.slots[index];

        if (slot !== null) {
            continue;
        }

        const quantityToAdd = Math.min(itemDefinition.maxStackSize, remainingQuantity);

        inventory.slots[index] = {
            itemId,
            quantity: quantityToAdd,
        };

        remainingQuantity -= quantityToAdd;
        changedSlotIndices.add(index);

        if (remainingQuantity === 0) {
            return buildAddItemResult(quantity, remainingQuantity, changedSlotIndices);
        }
    }

    return buildAddItemResult(quantity, remainingQuantity, changedSlotIndices);
}

export function moveSlot(
    inventory: Inventory,
    itemDefinitions: Record<string, ItemDefinition>,
    fromIndex: number,
    toIndex: number,
): MoveSlotResult {
    validateSlotIndex(inventory, fromIndex);
    validateSlotIndex(inventory, toIndex);

    if (fromIndex === toIndex) {
        return {
            kind: "no-op",
            reason: "same-slot",
            changedSlotIndices: [],
        };
    }

    const fromSlot = inventory.slots[fromIndex];
    const toSlot = inventory.slots[toIndex];

    if (!fromSlot) {
        return {
            kind: "no-op",
            reason: "empty-source",
            changedSlotIndices: [],
        };
    }

    if (!toSlot) {
        inventory.slots[toIndex] = fromSlot;
        inventory.slots[fromIndex] = null;

        return {
            kind: "moved",
            changedSlotIndices: [fromIndex, toIndex],
        };
    }

    if (fromSlot.itemId === toSlot.itemId) {
        const itemDefinition = itemDefinitions[fromSlot.itemId];

        if (!itemDefinition) {
            throw new Error(`Unknown item id: ${fromSlot.itemId}`);
        }

        const availableSpace = itemDefinition.maxStackSize - toSlot.quantity;

        if (availableSpace <= 0) {
            return {
                kind: "no-op",
                reason: "target-stack-full",
                changedSlotIndices: [],
            };
        }

        const movedQuantity = Math.min(availableSpace, fromSlot.quantity);

        toSlot.quantity += movedQuantity;
        fromSlot.quantity -= movedQuantity;

        if (fromSlot.quantity === 0) {
            inventory.slots[fromIndex] = null;
        }

        return {
            kind: "merged",
            movedQuantity,
            changedSlotIndices: [fromIndex, toIndex],
        };
    }

    inventory.slots[fromIndex] = toSlot;
    inventory.slots[toIndex] = fromSlot;

    return {
        kind: "swapped",
        changedSlotIndices: [fromIndex, toIndex],
    };
}

export function interactHeldSlotWithInventorySlot(
    heldSlot: HeldSlot,
    inventory: Inventory,
    itemDefinitions: Record<string, ItemDefinition>,
    targetIndex: number,
): HeldSlotInteractionResult {
    validateSlotIndex(inventory, targetIndex);

    const heldEntry = heldSlot.entry;
    const targetSlot = inventory.slots[targetIndex];

    if (!heldEntry && !targetSlot) {
        return {
            kind: "no-op",
            reason: "empty-held-and-empty-target",
            changedSlotIndices: [],
        };
    }

    if (!heldEntry && targetSlot) {
        heldSlot.entry = targetSlot;
        inventory.slots[targetIndex] = null;

        return {
            kind: "picked-up",
            changedSlotIndices: [targetIndex],
        };
    }

    if (heldEntry && !targetSlot) {
        inventory.slots[targetIndex] = heldEntry;
        heldSlot.entry = null;

        return {
            kind: "placed",
            changedSlotIndices: [targetIndex],
        };
    }

    if (!heldEntry || !targetSlot) {
        throw new Error("Unexpected held slot interaction state.");
    }

    if (heldEntry.itemId === targetSlot.itemId) {
        const itemDefinition = itemDefinitions[heldEntry.itemId];

        if (!itemDefinition) {
            throw new Error(`Unknown item id: ${heldEntry.itemId}`);
        }

        const availableSpace = itemDefinition.maxStackSize - targetSlot.quantity;

        if (availableSpace <= 0) {
            return {
                kind: "no-op",
                reason: "target-stack-full",
                changedSlotIndices: [],
            };
        }

        const movedQuantity = Math.min(availableSpace, heldEntry.quantity);

        targetSlot.quantity += movedQuantity;
        heldEntry.quantity -= movedQuantity;

        if (heldEntry.quantity === 0) {
            heldSlot.entry = null;
        }

        return {
            kind: "merged",
            movedQuantity,
            changedSlotIndices: [targetIndex],
        };
    }

    heldSlot.entry = targetSlot;
    inventory.slots[targetIndex] = heldEntry;

    return {
        kind: "swapped",
        changedSlotIndices: [targetIndex],
    };
}

export function pullQuantityFromInventorySlotToHeldSlot(
    heldSlot: HeldSlot,
    inventory: Inventory,
    sourceIndex: number,
    quantity: number,
): PullQuantityResult {
    validateSlotIndex(inventory, sourceIndex);

    if (heldSlot.entry) {
        throw new Error("Cannot pull quantity while held slot is occupied.");
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        throw new Error("Quantity must be a positive integer.");
    }

    const sourceSlot = inventory.slots[sourceIndex];

    if (!sourceSlot) {
        throw new Error(`Cannot pull quantity from empty slot: ${sourceIndex}`);
    }

    if (quantity > sourceSlot.quantity) {
        throw new Error(`Cannot pull ${quantity} from stack of ${sourceSlot.quantity}.`);
    }

    const fullStack = quantity === sourceSlot.quantity;

    if (fullStack) {
        heldSlot.entry = sourceSlot;
        inventory.slots[sourceIndex] = null;
    } else {
        sourceSlot.quantity -= quantity;
        heldSlot.entry = {
            itemId: sourceSlot.itemId,
            quantity,
        };
    }

    return {
        kind: "pulled",
        quantity,
        fullStack,
        changedSlotIndices: [sourceIndex],
    };
}

export function convertCopperToLowestTerms(valueCopper: number): Money {
    validateMoneyAmount(valueCopper, "valueCopper");

    const gold = Math.floor(valueCopper / 10_000);
    const remainingAfterGold = valueCopper % 10_000;
    const silver = Math.floor(remainingAfterGold / 100);
    const copper = remainingAfterGold % 100;

    return {
        gold,
        silver,
        copper,
    };
}

export function addMoney(money: Money, moneyToAdd: Money): void {
    validateMoney(moneyToAdd);

    money.gold += moneyToAdd.gold;
    money.silver += moneyToAdd.silver;
    money.copper += moneyToAdd.copper;
}

export function sellHeldItem(
    heldSlot: HeldSlot,
    itemDefinitions: Record<string, ItemDefinition>,
    money: Money,
): SellHeldItemResult {
    const heldEntry = heldSlot.entry;

    if (!heldEntry) {
        throw new Error("Cannot sell an empty held slot.");
    }

    const itemDefinition = itemDefinitions[heldEntry.itemId];

    if (!itemDefinition) {
        throw new Error(`Unknown item id: ${heldEntry.itemId}`);
    }

    const valueCopper = itemDefinition.valueCopper * heldEntry.quantity;
    const moneyAdded = convertCopperToLowestTerms(valueCopper);

    addMoney(money, moneyAdded);
    heldSlot.entry = null;

    return {
        kind: "sold",
        itemId: heldEntry.itemId,
        quantity: heldEntry.quantity,
        valueCopper,
        moneyAdded,
    };
}

function buildAddItemResult(
    requestedQuantity: number,
    remainingQuantity: number,
    changedSlotIndices: Set<number>,
): AddItemResult {
    return {
        addedQuantity: requestedQuantity - remainingQuantity,
        leftoverQuantity: remainingQuantity,
        changedSlotIndices: Array.from(changedSlotIndices),
    };
}

function validateSlotIndex(inventory: Inventory, index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= inventory.slots.length) {
        throw new Error(`Slot index out of range: ${index}`);
    }
}

function validateMoney(money: Money): void {
    validateMoneyAmount(money.gold, "gold");
    validateMoneyAmount(money.silver, "silver");
    validateMoneyAmount(money.copper, "copper");
}

function validateMoneyAmount(amount: number, label: string): void {
    if (!Number.isInteger(amount) || amount < 0) {
        throw new Error(`${label} must be a non-negative integer.`);
    }
}
