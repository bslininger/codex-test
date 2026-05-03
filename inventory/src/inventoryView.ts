import {
    type AddItemResult,
    type BuyItemResult,
    type HeldSlot,
    type HeldSlotInteractionResult,
    type Inventory,
    type ItemDefinition,
    type Money,
    type PullQuantityResult,
    type SellHeldItemResult,
} from "./inventoryModel.js";
import { createItemTooltip } from "./itemTooltip.js";
import { createItemSprite, createMoneyAmountDisplayElements } from "./viewHelpers.js";

export type InventoryRenderOptions = {
    slotGridElement: HTMLDivElement;
    inventory: Inventory;
    itemDefinitions: Record<string, ItemDefinition>;
    lastChangedSlotIndices: number[];
    onSlotClick: (event: MouseEvent | KeyboardEvent, index: number) => void;
};

let activeTooltip: HTMLElement | null = null;
let heldItemFollower: HTMLElement | null = null;
let lastPointerPosition: { clientX: number; clientY: number } | null = null;

export function renderInventory(options: InventoryRenderOptions): void {
    removeActiveTooltip();

    options.slotGridElement.replaceChildren(
        ...options.inventory.slots.map((slot, index) => {
            const slotElement = document.createElement("div");
            slotElement.className = "slot";

            if (options.lastChangedSlotIndices.includes(index)) {
                slotElement.classList.add("is-changed");
            }

            slotElement.tabIndex = 0;
            slotElement.setAttribute("role", "button");
            slotElement.setAttribute("aria-label", `Slot ${index + 1}`);

            if (!slot) {
                slotElement.classList.add("is-empty");
            } else {
                const itemDefinition = getDisplayItemDefinition(options.itemDefinitions, slot.itemId);
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

                if (itemDefinition) {
                    slotElement.addEventListener("mouseenter", (event) => {
                        showItemTooltip(itemDefinition, slot.quantity, event);
                    });
                    slotElement.addEventListener("mousemove", moveActiveTooltip);
                    slotElement.addEventListener("mouseleave", removeActiveTooltip);
                }
            }

            slotElement.addEventListener("click", (event) => options.onSlotClick(event, index));
            slotElement.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    options.onSlotClick(event, index);
                }
            });

            return slotElement;
        }),
    );
}

export function renderHeldSlot(heldSlotToRender: HeldSlot): void {
    renderHeldItemFollower(heldSlotToRender);
}

export function renderMoney(moneyDisplayElement: HTMLDivElement, money: Money): void {
    moneyDisplayElement.replaceChildren(...createMoneyAmountDisplayElements(money));
}

export function renderAddItemResult(resultOutputElement: HTMLOutputElement, result: AddItemResult): void {
    resultOutputElement.value = [
        `Added: ${result.addedQuantity}`,
        `Left over: ${result.leftoverQuantity}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

export function renderSellHeldItemResult(
    resultOutputElement: HTMLOutputElement,
    itemDefinitions: Record<string, ItemDefinition>,
    result: SellHeldItemResult,
): void {
    const itemDefinition = getDisplayItemDefinition(itemDefinitions, result.itemId);

    resultOutputElement.value = [
        `Sold: ${result.quantity} ${itemDefinition?.name ?? result.itemId}`,
        `Value: ${result.valueCopper} copper`,
    ].join(" | ");
}

export function renderBuyItemResult(
    resultOutputElement: HTMLOutputElement,
    itemDefinitions: Record<string, ItemDefinition>,
    result: BuyItemResult,
): void {
    const itemDefinition = getDisplayItemDefinition(itemDefinitions, result.itemId);
    const itemName = itemDefinition?.name ?? result.itemId;

    if (result.kind === "bought") {
        resultOutputElement.value = [
            `Bought: ${result.quantity} ${itemName}`,
            `Cost: ${result.totalPriceCopper} copper`,
            `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
        ].join(" | ");
        return;
    }

    if (result.kind === "not-enough-money") {
        resultOutputElement.value = [
            `Could not buy ${result.quantity} ${itemName}`,
            `Need: ${result.totalPriceCopper} copper`,
            `Have: ${result.availableCopper} copper`,
        ].join(" | ");
        return;
    }

    resultOutputElement.value = [
        `Could not buy ${result.quantity} ${itemName}`,
        `Inventory space: ${result.availableCapacity}`,
    ].join(" | ");
}

export function renderPullQuantityResult(resultOutputElement: HTMLOutputElement, result: PullQuantityResult): void {
    resultOutputElement.value = [
        `Pulled: ${result.quantity}`,
        result.fullStack ? "Full stack" : "Partial stack",
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

export function renderHeldSlotInteractionResult(
    resultOutputElement: HTMLOutputElement,
    result: HeldSlotInteractionResult,
): void {
    if (result.kind === "no-op") {
        resultOutputElement.value = `Held slot: ${formatHeldSlotNoOpReason(result.reason)}`;
        return;
    }

    if (result.kind === "merged") {
        resultOutputElement.value = [
            `Move: merged ${result.movedQuantity}`,
            `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
        ].join(" | ");
        return;
    }

    resultOutputElement.value = [
        `Held slot: ${formatInteractionKind(result.kind)}`,
        `Changed slots: ${formatChangedSlots(result.changedSlotIndices)}`,
    ].join(" | ");
}

export function moveHeldItemFollowerToPointer(event: MouseEvent): void {
    lastPointerPosition = {
        clientX: event.clientX,
        clientY: event.clientY,
    };
    moveHeldItemFollower(lastPointerPosition);
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

function showItemTooltip(item: ItemDefinition, quantity: number, event: MouseEvent): void {
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

function getDisplayItemDefinition(
    itemDefinitions: Record<string, ItemDefinition>,
    itemId: string,
): ItemDefinition | undefined {
    const itemDefinition = itemDefinitions[itemId];

    if (!itemDefinition) {
        console.warn(`Missing item definition for item id: ${itemId}`);
    }

    return itemDefinition;
}
