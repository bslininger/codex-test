import "./styles.css";

import { addItem, createInventory, type AddItemResult, type Inventory } from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
let lastChangedSlotIndices: number[] = [];

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

function formatChangedSlots(changedSlotIndices: number[]): string {
    if (changedSlotIndices.length === 0) {
        return "none";
    }

    return changedSlotIndices.map((index) => String(index + 1)).join(", ");
}

function resetInventory(): void {
    inventory.slots.fill(null);
    lastChangedSlotIndices = [];
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

        lastChangedSlotIndices = result.changedSlotIndices;
        renderInventory(inventory);
        renderResult(result);
    });
});

elements.resetButton.addEventListener("click", resetInventory);

renderInventory(inventory);
