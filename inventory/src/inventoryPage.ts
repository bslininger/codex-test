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
    type AddItemResult,
    type BuyItemResult,
    type HeldSlot,
    type HeldSlotInteractionResult,
    type Inventory,
    type Money,
    type PullQuantityResult,
    type SellHeldItemResult,
} from "./inventoryModel.js";
import { createItemTooltip } from "./itemTooltip.js";
import { ITEM_DEFINITIONS } from "./itemDefinitions.js";
import { createItemSprite, createMoneyAmountDisplayElements } from "./viewHelpers.js";

const slotCount = 8;
const inventory = createInventory(slotCount);
const heldSlot = createHeldSlot();
const playerMoney = createMoney();
let lastChangedSlotIndices: number[] = [];
let quantityDialogSourceIndex: number | null = null;
let activeTooltip: HTMLElement | null = null;
let heldItemFollower: HTMLElement | null = null;
let lastPointerPosition: { clientX: number; clientY: number } | null = null;

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

function renderInventory(inventoryToRender: Inventory): void {
    removeActiveTooltip();

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

            if (!slot) {
                slotElement.classList.add("is-empty");
            } else {
                const itemDefinition = ITEM_DEFINITIONS[slot.itemId];
                const imageElement = createItemSprite(slot.itemId);
                slotElement.setAttribute(
                    "aria-label",
                    `Slot ${index + 1}: ${itemDefinition?.name ?? slot.itemId}, quantity ${slot.quantity}`,
                );

                slotElement.append(imageElement);

                if (slot.quantity > 1) {
                    const quantityElement = document.createElement("div");
                    quantityElement.className = "slot-quantity";
                    quantityElement.textContent = String(slot.quantity);
                    slotElement.append(quantityElement);
                }

                slotElement.addEventListener("mouseenter", (event) => {
                    showItemTooltip(itemDefinition, slot.quantity, event);
                });
                slotElement.addEventListener("mousemove", moveActiveTooltip);
                slotElement.addEventListener("mouseleave", removeActiveTooltip);
            }

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
    renderHeldItemFollower(heldSlotToRender);
}

function renderHeldItemFollower(heldSlotToRender: HeldSlot): void {
    heldItemFollower?.remove();
    heldItemFollower = null;

    if (!heldSlotToRender.entry) {
        return;
    }

    heldItemFollower = createHeldItemFollowerElement(heldSlotToRender.entry);
    document.body.append(heldItemFollower);

    if (lastPointerPosition) {
        moveHeldItemFollower(lastPointerPosition);
    }
}

function createHeldItemFollowerElement(entry: NonNullable<HeldSlot["entry"]>): HTMLElement {
    const followerElement = document.createElement("div");
    followerElement.className = "held-item-follower";
    followerElement.setAttribute("aria-hidden", "true");
    followerElement.append(createItemSprite(entry.itemId));

    if (entry.quantity > 1) {
        const quantityElement = document.createElement("div");
        quantityElement.className = "slot-quantity";
        quantityElement.textContent = String(entry.quantity);
        followerElement.append(quantityElement);
    }

    return followerElement;
}

function renderMoney(money: Money): void {
    elements.moneyDisplay.replaceChildren(...createMoneyAmountDisplayElements(money));
}

function renderResult(result: AddItemResult): void {
    elements.resultOutput.value = [
        `Added: ${result.addedQuantity}`,
        `Left over: ${result.leftoverQuantity}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

function renderSellHeldItemResult(result: SellHeldItemResult): void {
    const itemDefinition = ITEM_DEFINITIONS[result.itemId];

    elements.resultOutput.value = [
        `Sold: ${result.quantity} ${itemDefinition?.name ?? result.itemId}`,
        `Value: ${result.valueCopper} copper`,
    ].join(" | ");
}

function renderBuyItemResult(result: BuyItemResult): void {
    const itemDefinition = ITEM_DEFINITIONS[result.itemId];
    const itemName = itemDefinition?.name ?? result.itemId;

    if (result.kind === "bought") {
        elements.resultOutput.value = [
            `Bought: ${result.quantity} ${itemName}`,
            `Cost: ${result.totalPriceCopper} copper`,
            `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
        ].join(" | ");
        return;
    }

    if (result.kind === "not-enough-money") {
        elements.resultOutput.value = [
            `Could not buy ${result.quantity} ${itemName}`,
            `Need: ${result.totalPriceCopper} copper`,
            `Have: ${result.availableCopper} copper`,
        ].join(" | ");
        return;
    }

    elements.resultOutput.value = [
        `Could not buy ${result.quantity} ${itemName}`,
        `Inventory space: ${result.availableCapacity}`,
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

function showItemTooltip(item: (typeof ITEM_DEFINITIONS)[string], quantity: number, event: MouseEvent): void {
    removeActiveTooltip();
    activeTooltip = createItemTooltip(item, quantity);
    document.body.append(activeTooltip);
    moveActiveTooltip(event);
}

function moveActiveTooltip(event: MouseEvent): void {
    if (!activeTooltip) {
        return;
    }

    const cursorOffset = 10;
    const pageMargin = 8;
    const tooltipRect = activeTooltip.getBoundingClientRect();
    let left = event.clientX - tooltipRect.width - cursorOffset;
    let top = event.clientY - tooltipRect.height - cursorOffset;

    if (left < pageMargin) {
        left = event.clientX + cursorOffset;
    }

    if (top < pageMargin) {
        top = pageMargin;
    }

    if (left + tooltipRect.width > window.innerWidth - pageMargin) {
        left = window.innerWidth - tooltipRect.width - pageMargin;
    }

    activeTooltip.style.left = `${left}px`;
    activeTooltip.style.top = `${top}px`;
}

function moveHeldItemFollower(position: { clientX: number; clientY: number }): void {
    if (!heldItemFollower) {
        return;
    }

    const cursorOffset = 10;
    heldItemFollower.style.left = `${position.clientX + cursorOffset}px`;
    heldItemFollower.style.top = `${position.clientY + cursorOffset}px`;
}

function removeActiveTooltip(): void {
    activeTooltip?.remove();
    activeTooltip = null;
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
    playerMoney.gold = 0;
    playerMoney.silver = 0;
    playerMoney.copper = 0;
    lastChangedSlotIndices = [];
    closeQuantityDialog();
    elements.resultOutput.value = "";
    renderInventory(inventory);
    renderHeldSlot(heldSlot);
    renderMoney(playerMoney);
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

elements.purchaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
        const itemId = button.dataset.buyItemId;
        const quantity = Number(button.dataset.buyQuantity);

        if (!itemId) {
            throw new Error("Purchase button is missing an item id.");
        }

        const result = buyItem(inventory, ITEM_DEFINITIONS, playerMoney, itemId, quantity);

        lastChangedSlotIndices = result.kind === "bought" ? result.changedSlotIndices : [];
        renderInventory(inventory);
        renderHeldSlot(heldSlot);
        renderMoney(playerMoney);
        renderBuyItemResult(result);
    });
});

elements.sellHeldButton.addEventListener("click", () => {
    if (!heldSlot.entry) {
        elements.resultOutput.value = "Sell: hold an item first";
        return;
    }

    const result = sellHeldItem(heldSlot, ITEM_DEFINITIONS, playerMoney);

    renderHeldSlot(heldSlot);
    renderMoney(playerMoney);
    renderSellHeldItemResult(result);
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
    lastPointerPosition = {
        clientX: event.clientX,
        clientY: event.clientY,
    };
    moveHeldItemFollower(lastPointerPosition);
});

renderInventory(inventory);
renderHeldSlot(heldSlot);
renderMoney(playerMoney);
