import "./styles.css";

import {
    addItem,
    createHeldSlot,
    createInventory,
    interactHeldSlotWithInventorySlot,
    pullQuantityFromInventorySlotToHeldSlot,
    type AddItemResult,
    type HeldSlot,
    type HeldSlotInteractionResult,
    type Inventory,
    type PullQuantityResult,
} from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
const heldSlot = createHeldSlot();
let lastChangedSlotIndices: number[] = [];
let quantityDialogSourceIndex: number | null = null;

const elements = {
    heldSlot: getElement<HTMLDivElement>("#held-slot"),
    slotGrid: getElement<HTMLDivElement>("#slot-grid"),
    resetButton: getElement<HTMLButtonElement>("#reset-button"),
    resultOutput: getElement<HTMLOutputElement>("#result-output"),
    quantityDialog: getElement<HTMLDialogElement>("#quantity-dialog"),
    quantityForm: getElement<HTMLFormElement>("#quantity-form"),
    quantitySlider: getElement<HTMLInputElement>("#quantity-slider"),
    quantityInput: getElement<HTMLInputElement>("#quantity-input"),
    quantityCancelButton: getElement<HTMLButtonElement>("#quantity-cancel-button"),
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
            slotElement.addEventListener("click", (event) => handleSlotClick(event, index));
            slotElement.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSlotClick(event, index);
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

function renderPullQuantityResult(result: PullQuantityResult): void {
    elements.resultOutput.value = [
        `Pulled: ${result.quantity}`,
        result.fullStack ? "Full stack" : "Partial stack",
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

function handleSlotClick(event: MouseEvent | KeyboardEvent, index: number): void {
    const slot = inventory.slots[index];

    if (!heldSlot.entry && slot && slot.quantity > 1 && event.ctrlKey) {
        pullQuantity(index, 1);
        return;
    }

    if (!heldSlot.entry && slot && slot.quantity > 1 && event.shiftKey) {
        openQuantityDialog(index);
        return;
    }

    const result = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, index);

    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventory(inventory);
    renderHeldSlot(heldSlot);
    renderHeldSlotInteractionResult(result);
}

function pullQuantity(sourceIndex: number, quantity: number): void {
    const result = pullQuantityFromInventorySlotToHeldSlot(heldSlot, inventory, sourceIndex, quantity);

    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventory(inventory);
    renderHeldSlot(heldSlot);
    renderPullQuantityResult(result);
}

function openQuantityDialog(sourceIndex: number): void {
    const slot = inventory.slots[sourceIndex];

    if (!slot) {
        throw new Error(`Cannot open quantity dialog for empty slot: ${sourceIndex}`);
    }

    quantityDialogSourceIndex = sourceIndex;

    elements.quantitySlider.max = String(slot.quantity);
    elements.quantityInput.max = String(slot.quantity);
    elements.quantitySlider.value = "1";
    elements.quantityInput.value = "1";
    elements.quantityDialog.showModal();
    elements.quantityInput.focus();
}

function closeQuantityDialog(): void {
    quantityDialogSourceIndex = null;
    elements.quantityDialog.close();
}

function syncQuantityControls(source: HTMLInputElement, target: HTMLInputElement): void {
    const min = Number(source.min);
    const max = Number(source.max);
    const fallbackValue = Number(source.value || source.min);
    const clampedValue = Math.min(Math.max(fallbackValue, min), max);
    const nextValue = String(clampedValue);

    source.value = nextValue;
    target.value = nextValue;
}

function resetInventory(): void {
    inventory.slots.fill(null);
    heldSlot.entry = null;
    lastChangedSlotIndices = [];
    closeQuantityDialog();
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

elements.quantitySlider.addEventListener("input", () => {
    syncQuantityControls(elements.quantitySlider, elements.quantityInput);
});

elements.quantityInput.addEventListener("input", () => {
    syncQuantityControls(elements.quantityInput, elements.quantitySlider);
});

elements.quantityCancelButton.addEventListener("click", closeQuantityDialog);

elements.quantityForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (quantityDialogSourceIndex === null) {
        throw new Error("Quantity dialog submitted without a source slot.");
    }

    const quantity = Number(elements.quantityInput.value);
    const sourceIndex = quantityDialogSourceIndex;

    closeQuantityDialog();
    pullQuantity(sourceIndex, quantity);
});

elements.resetButton.addEventListener("click", resetInventory);

renderInventory(inventory);
renderHeldSlot(heldSlot);
