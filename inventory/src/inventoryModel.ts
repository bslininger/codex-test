export type ItemDefinition = {
    id: string;
    name: string;
    maxStackSize: number;
};

export type InventoryEntry = {
    itemId: string;
    quantity: number;
};

export type InventorySlot = InventoryEntry | null;

export type Inventory = {
    slots: InventorySlot[];
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

export function createInventory(slotCount: number): Inventory {
    return {
        slots: Array.from({ length: slotCount }, () => null),
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
