import "./styles.css";

import {
    addItem,
    createHeldSlot,
    createInventory,
    interactHeldSlotWithInventorySlot,
    type AddItemResult,
    type HeldSlot,
    type HeldSlotInteractionResult,
    type Inventory,
} from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
const heldSlot = createHeldSlot();
let lastChangedSlotIndices: number[] = [];

const elements = {
    heldSlot: getElement<HTMLDivElement>("#held-slot"),
    slotGrid: getElement<HTMLDivElement>("#slot-grid"),
    resetButton: getElement<HTMLButtonElement>("#reset-button"),
    resultOutput: getElement<HTMLOutputElement>("#result-output"),
    itemButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-item-id]")),
};

function getElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Missing element: ${selector}`);
    }

    return element;
}

function renderInventory(inventoryToRender: Inventory): void {
    elements.slotGrid.replaceChildren(
        ...inventoryToRender.slots.map((slot, index) => {
            const slotElement = document.createElement("div");
            slotElement.className = "slot";

            if (lastChangedSlotIndices.includes(index)) {
                slotElement.classList.add("is-changed");
            }

            slotElement.tabIndex = 0;
            slotElement.setAttribute("role", "button");
            slotElement.setAttribute("aria-label", `Slot ${index + 1}`);

            const indexElement = document.createElement("div");
            indexElement.className = "slot-index";
            indexElement.textContent = `Slot ${index + 1}`;

            const nameElement = document.createElement("div");
            nameElement.className = "slot-name";

            const metaElement = document.createElement("div");
            metaElement.className = "slot-meta";

            if (!slot) {
                slotElement.classList.add("is-empty");
                nameElement.textContent = "Empty";
                metaElement.textContent = "";
            } else {
                const itemDefinition = ITEM_DEFINITIONS[slot.itemId];
                nameElement.textContent = itemDefinition?.name ?? slot.itemId;
                metaElement.textContent = `${slot.quantity} / ${itemDefinition?.maxStackSize ?? "?"}`;
            }

            slotElement.append(indexElement, nameElement, metaElement);
            slotElement.addEventListener("click", () => handleSlotClick(index));
            slotElement.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSlotClick(index);
                }
            });

            return slotElement;
        }),
    );
}

function renderHeldSlot(heldSlotToRender: HeldSlot): void {
    elements.heldSlot.replaceChildren();
    elements.heldSlot.className = "held-slot";

    const labelElement = document.createElement("div");
    labelElement.className = "held-label";
    labelElement.textContent = "Held";

    const nameElement = document.createElement("div");
    nameElement.className = "held-name";

    const metaElement = document.createElement("div");
    metaElement.className = "held-meta";

    if (!heldSlotToRender.entry) {
        elements.heldSlot.classList.add("is-empty");
        nameElement.textContent = "Empty";
        metaElement.textContent = "";
    } else {
        const itemDefinition = ITEM_DEFINITIONS[heldSlotToRender.entry.itemId];
        nameElement.textContent = itemDefinition?.name ?? heldSlotToRender.entry.itemId;
        metaElement.textContent = `Quantity: ${heldSlotToRender.entry.quantity}`;
    }

    elements.heldSlot.append(labelElement, nameElement, metaElement);
}

function renderResult(result: AddItemResult): void {
    elements.resultOutput.value = [
        `Added: ${result.addedQuantity}`,
        `Left over: ${result.leftoverQuantity}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

function renderHeldSlotInteractionResult(result: HeldSlotInteractionResult): void {
    if (result.kind === "no-op") {
        elements.resultOutput.value = `Held slot: ${formatHeldSlotNoOpReason(result.reason)}`;
        return;
    }

    if (result.kind === "merged") {
        elements.resultOutput.value = [
            `Move: merged ${result.movedQuantity}`,
            `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
        ].join(" | ");
        return;
    }

    elements.resultOutput.value = [
        `Held slot: ${formatInteractionKind(result.kind)}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

function formatChangedSlots(changedSlotIndices: number[]): string {
    if (changedSlotIndices.length === 0) {
        return "none";
    }

    return changedSlotIndices.map((index) => String(index + 1)).join(", ");
}

function formatHeldSlotNoOpReason(
    reason: Extract<HeldSlotInteractionResult, { kind: "no-op" }>["reason"],
): string {
    if (reason === "empty-held-and-empty-target") {
        return "nothing to pick up or place";
    }

    return "target stack is full";
}

function formatInteractionKind(kind: Exclude<HeldSlotInteractionResult["kind"], "merged" | "no-op">): string {
    if (kind === "picked-up") {
        return "picked up";
    }

    return kind;
}

function handleSlotClick(index: number): void {
    const result = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, index);

    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventory(inventory);
    renderHeldSlot(heldSlot);
    renderHeldSlotInteractionResult(result);
}

function resetInventory(): void {
    inventory.slots.fill(null);
    heldSlot.entry = null;
    lastChangedSlotIndices = [];
    elements.resultOutput.value = "";
    renderInventory(inventory);
    renderHeldSlot(heldSlot);
}

elements.itemButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const itemId = button.dataset.itemId;
        const quantity = Number(button.dataset.quantity);

        if (!itemId) {
            throw new Error("Item button is missing an item id.");
        }

        const result = addItem(inventory, ITEM_DEFINITIONS, itemId, quantity);

        lastChangedSlotIndices = result.changedSlotIndices;
        renderInventory(inventory);
        renderHeldSlot(heldSlot);
        renderResult(result);
    });
});

elements.resetButton.addEventListener("click", resetInventory);

renderInventory(inventory);
renderHeldSlot(heldSlot);
