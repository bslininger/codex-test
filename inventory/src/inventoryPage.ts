import "./styles.css";

import {
    addItem,
    buyItem,
    createMoney,
    createHeldSlot,
    createInventory,
    interactHeldSlotWithInventorySlot,
    pullQuantityFromInventorySlotToHeldSlot,
    sellHeldItem,
    type Inventory,
} from "./inventoryModel.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";
import {
    moveHeldItemFollowerToPointer,
    renderAddItemResult,
    renderBuyItemResult,
    renderHeldSlot,
    renderHeldSlotInteractionResult,
    renderInventory,
    renderMoney,
    renderPullQuantityResult,
    renderSellHeldItemResult,
} from "./inventoryView.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
const heldSlot = createHeldSlot();
const playerMoney = createMoney();
let lastChangedSlotIndices: number[] = [];
let quantityDialogMode: QuantityDialogMode | null = null;

type QuantityDialogMode = {
    kind: "pull-from-slot";
    sourceIndex: number;
};

const elements = {
    moneyDisplay: getElement<HTMLDivElement>("#money-display"),
    slotGrid: getElement<HTMLDivElement>("#slot-grid"),
    resetButton: getElement<HTMLButtonElement>("#reset-button"),
    sellHeldButton: getElement<HTMLButtonElement>("#sell-held-button"),
    resultOutput: getElement<HTMLOutputElement>("#result-output"),
    quantityDialog: getElement<HTMLDialogElement>("#quantity-dialog"),
    quantityForm: getElement<HTMLFormElement>("#quantity-form"),
    quantitySlider: getElement<HTMLInputElement>("#quantity-slider"),
    quantityInput: getElement<HTMLInputElement>("#quantity-input"),
    quantityCancelButton: getElement<HTMLButtonElement>("#quantity-cancel-button"),
    itemButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-item-id]")),
    purchaseButtons: Array.from(document.querySelectorAll<HTMLButtonElement>("[data-buy-item-id]")),
};

function getElement<T extends HTMLElement>(selector: string): T {
    const element = document.querySelector<T>(selector);

    if (!element) {
        throw new Error(`Missing element: ${selector}`);
    }

    return element;
}

function handleSlotClick(event: MouseEvent | KeyboardEvent, index: number): void {
    const slot = inventory.slots[index];

    if (!heldSlot.entry && slot && slot.quantity > 1 && event.ctrlKey) {
        pullQuantity(index, 1);
        return;
    }

    if (!heldSlot.entry && slot && slot.quantity > 1 && event.shiftKey) {
        openQuantityDialog({
            kind: "pull-from-slot",
            sourceIndex: index,
        }, slot.quantity);
        return;
    }

    const result = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, index);

    lastChangedSlotIndices = result.changedSlotIndices;
    refreshInventoryView();
    renderHeldSlot(heldSlot);
    renderHeldSlotInteractionResult(elements.resultOutput, result);
}

function pullQuantity(sourceIndex: number, quantity: number): void {
    const result = pullQuantityFromInventorySlotToHeldSlot(heldSlot, inventory, sourceIndex, quantity);

    lastChangedSlotIndices = result.changedSlotIndices;
    refreshInventoryView();
    renderHeldSlot(heldSlot);
    renderPullQuantityResult(elements.resultOutput, result);
}

function openQuantityDialog(mode: QuantityDialogMode, maxQuantity: number): void {
    if (!Number.isInteger(maxQuantity) || maxQuantity < 1) {
        throw new Error("Quantity dialog max must be a positive integer.");
    }

    quantityDialogMode = mode;

    elements.quantitySlider.max = String(maxQuantity);
    elements.quantityInput.max = String(maxQuantity);
    elements.quantitySlider.value = "1";
    elements.quantityInput.value = "1";
    elements.quantityDialog.showModal();
    elements.quantityInput.focus();
}

function closeQuantityDialog(): void {
    quantityDialogMode = null;
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
    playerMoney.gold = 0;
    playerMoney.silver = 0;
    playerMoney.copper = 0;
    lastChangedSlotIndices = [];
    closeQuantityDialog();
    elements.resultOutput.value = "";
    refreshInventoryView();
    renderHeldSlot(heldSlot);
    renderMoney(elements.moneyDisplay, playerMoney);
}

function refreshInventoryView(): void {
    renderInventory({
        slotGridElement: elements.slotGrid,
        inventory,
        itemDefinitions: ITEM_DEFINITIONS,
        lastChangedSlotIndices,
        onSlotClick: handleSlotClick,
    });
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
        refreshInventoryView();
        renderHeldSlot(heldSlot);
        renderAddItemResult(elements.resultOutput, result);
    });
});

elements.purchaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const itemId = button.dataset.buyItemId;
        const quantity = Number(button.dataset.buyQuantity);

        if (!itemId) {
            throw new Error("Purchase button is missing an item id.");
        }

        const result = buyItem(inventory, ITEM_DEFINITIONS, playerMoney, itemId, quantity);

        lastChangedSlotIndices = result.kind === "bought" ? result.changedSlotIndices : [];
        refreshInventoryView();
        renderHeldSlot(heldSlot);
        renderMoney(elements.moneyDisplay, playerMoney);
        renderBuyItemResult(elements.resultOutput, ITEM_DEFINITIONS, result);
    });
});

elements.sellHeldButton.addEventListener("click", () => {
    if (!heldSlot.entry) {
        elements.resultOutput.value = "Sell: hold an item first";
        return;
    }

    const result = sellHeldItem(heldSlot, ITEM_DEFINITIONS, playerMoney);

    renderHeldSlot(heldSlot);
    renderMoney(elements.moneyDisplay, playerMoney);
    renderSellHeldItemResult(elements.resultOutput, ITEM_DEFINITIONS, result);
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

    if (quantityDialogMode === null) {
        throw new Error("Quantity dialog submitted without a mode.");
    }

    const quantity = Number(elements.quantityInput.value);
    const mode = quantityDialogMode;

    closeQuantityDialog();

    if (mode.kind === "pull-from-slot") {
        pullQuantity(mode.sourceIndex, quantity);
        return;
    }
});

elements.resetButton.addEventListener("click", resetInventory);

document.addEventListener("mousemove", (event) => {
    moveHeldItemFollowerToPointer(event);
});

refreshInventoryView();
renderHeldSlot(heldSlot);
renderMoney(elements.moneyDisplay, playerMoney);
