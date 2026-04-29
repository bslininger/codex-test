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
