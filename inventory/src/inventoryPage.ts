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
let quantityDialogSourceIndex: number | null = null;

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
        openQuantityDialog(index);
        return;
    }

    const result = interactHeldSlotWithInventorySlot(heldSlot, inventory, ITEM_DEFINITIONS, index);

    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventoryPage();
    renderHeldSlot(heldSlot);
    renderHeldSlotInteractionResult(elements.resultOutput, result);
}

function pullQuantity(sourceIndex: number, quantity: number): void {
    const result = pullQuantityFromInventorySlotToHeldSlot(heldSlot, inventory, sourceIndex, quantity);

    lastChangedSlotIndices = result.changedSlotIndices;
    renderInventoryPage();
    renderHeldSlot(heldSlot);
    renderPullQuantityResult(elements.resultOutput, result);
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
    playerMoney.gold = 0;
    playerMoney.silver = 0;
    playerMoney.copper = 0;
    lastChangedSlotIndices = [];
    closeQuantityDialog();
    elements.resultOutput.value = "";
    renderInventoryPage();
    renderHeldSlot(heldSlot);
    renderMoney(elements.moneyDisplay, playerMoney);
}

function renderInventoryPage(): void {
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
        renderInventoryPage();
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
        renderInventoryPage();
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

    if (quantityDialogSourceIndex === null) {
        throw new Error("Quantity dialog submitted without a source slot.");
    }

    const quantity = Number(elements.quantityInput.value);
    const sourceIndex = quantityDialogSourceIndex;

    closeQuantityDialog();
    pullQuantity(sourceIndex, quantity);
});

elements.resetButton.addEventListener("click", resetInventory);

document.addEventListener("mousemove", (event) => {
    moveHeldItemFollowerToPointer(event);
});

renderInventoryPage();
renderHeldSlot(heldSlot);
renderMoney(elements.moneyDisplay, playerMoney);
