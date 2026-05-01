import type { Money } from "./inventoryModel.js";

export function getSpritePath(itemId: string): string {
    return `/sprites/${itemId}.png`;
}

export function createItemSprite(itemId: string): HTMLImageElement {
    const imageElement = document.createElement("img");
    imageElement.className = "item-sprite";
    imageElement.src = getSpritePath(itemId);
    imageElement.alt = "";

    imageElement.addEventListener("error", () => {
        imageElement.src = "/sprites/placeholder.png";
        imageElement.classList.add("is-placeholder");
    });

    return imageElement;
}

export function createMoneyAmountDisplayElements(money: Money): HTMLSpanElement[] {
    if (money.gold > 0) {
        return [
            createMoneyAmount("gold", money.gold),
            createMoneyAmount("silver", money.silver),
            createMoneyAmount("copper", money.copper),
        ];
    }
    else if (money.silver > 0) {
        return [createMoneyAmount("silver", money.silver), createMoneyAmount("copper", money.copper)];
    }
    else {
        return [createMoneyAmount("copper", money.copper)];
    }
}

function createMoneyAmount(denomination: keyof Money, amount: number): HTMLSpanElement {
    const amountElement = document.createElement("span");
    amountElement.className = "money-amount";

    const valueElement = document.createElement("span");
    valueElement.textContent = String(amount);

    amountElement.append(valueElement, createMoneySprite(denomination));
    return amountElement;
}

function createMoneySprite(denomination: keyof Money): HTMLImageElement {
    const imageElement = document.createElement("img");
    imageElement.className = "money-sprite";
    imageElement.src = getSpritePath(`money-${denomination}`);
    imageElement.alt = denomination;

    return imageElement;
}
