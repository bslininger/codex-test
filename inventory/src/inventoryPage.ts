import "./styles.css";

import {
    addItem,
    createInventory,
    moveSlot,
    type AddItemResult,
    type Inventory,
    type MoveSlotResult,
} from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
let lastChangedSlotIndices: number[] = [];
let selectedSlotIndex: number | null = null;

const elements = {
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

            if (selectedSlotIndex === index) {
                slotElement.classList.add("is-selected");
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

function renderResult(result: AddItemResult): void {
    elements.resultOutput.value = [
        `Added: ${result.addedQuantity}`,
        `Left over: ${result.leftoverQuantity}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

function renderMoveResult(result: MoveSlotResult): void {
    if (result.kind === "no-op") {
        elements.resultOutput.value = `Move: ${formatNoOpReason(result.reason)}`;
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
        `Move: ${result.kind}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

function formatChangedSlots(changedSlotIndices: number[]): string {
    if (changedSlotIndices.length === 0) {
        return "none";
    }

    return changedSlotIndices.map((index) => String(index + 1)).join(", ");
}

function formatNoOpReason(reason: Extract<MoveSlotResult, { kind: "no-op" }>["reason"]): string {
    if (reason === "same-slot") {
        return "same slot";
    }

    if (reason === "empty-source") {
        return "empty source slot";
    }

    return "target stack is full";
}

function handleSlotClick(index: number): void {
    if (selectedSlotIndex === null) {
        selectedSlotIndex = index;
        lastChangedSlotIndices = [];
        elements.resultOutput.value = `Selected slot ${index + 1}`;
        renderInventory(inventory);
        return;
    }

    const result = moveSlot(inventory, ITEM_DEFINITIONS, selectedSlotIndex, index);

    selectedSlotIndex = null;
    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventory(inventory);
    renderMoveResult(result);
}

function resetInventory(): void {
    inventory.slots.fill(null);
    lastChangedSlotIndices = [];
    selectedSlotIndex = null;
    elements.resultOutput.value = "";
    renderInventory(inventory);
}

elements.itemButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const itemId = button.dataset.itemId;
        const quantity = Number(button.dataset.quantity);

        if (!itemId) {
            throw new Error("Item button is missing an item id.");
        }

        const result = addItem(inventory, ITEM_DEFINITIONS, itemId, quantity);

        selectedSlotIndex = null;
        lastChangedSlotIndices = result.changedSlotIndices;
        renderInventory(inventory);
        renderResult(result);
    });
});

elements.resetButton.addEventListener("click", resetInventory);

renderInventory(inventory);
