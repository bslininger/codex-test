import { convertCopperToLowestTerms, type ItemDefinition } from "./inventoryModel.js";
import { createItemSprite, createMoneyAmountDisplayElements } from "./viewHelpers.js";

export function createItemTooltip(item: ItemDefinition, quantity: number): HTMLElement {
    const tooltipElement = document.createElement("div");
    tooltipElement.className = "item-tooltip";

    const iconElement = document.createElement("div");
    iconElement.className = "tooltip-icon";
    iconElement.append(createItemSprite(item.id));

    if (quantity > 1) {
        const quantityElement = document.createElement("div");
        quantityElement.className = "tooltip-quantity";
        quantityElement.textContent = String(quantity);
        iconElement.append(quantityElement);
    }

    const detailsElement = document.createElement("div");
    detailsElement.className = "tooltip-details";

    const nameElement = document.createElement("div");
    nameElement.className = "tooltip-name";
    nameElement.textContent = item.name;
    detailsElement.append(nameElement);

    if (item.maxStackSize > 1) {
        const quantityLineElement = document.createElement("div");
        quantityLineElement.className = "tooltip-line";
        quantityLineElement.textContent = `Quantity: ${quantity} / ${item.maxStackSize}`;
        detailsElement.append(quantityLineElement);
    }

    detailsElement.append(createValueElement(item.valueCopper, quantity));
    tooltipElement.append(iconElement, detailsElement);
    return tooltipElement;
}

function createValueElement(valueCopper: number, quantity: number): HTMLElement {
    const valueElement = document.createElement("div");
    valueElement.className = "tooltip-value";

    if (quantity === 1) {
        valueElement.append(createMoneyLine("Value:", valueCopper));
        return valueElement;
    }

    valueElement.append(
        createMoneyLine("Value each:", valueCopper),
        createMoneyLine("Total:", valueCopper * quantity),
    );
    return valueElement;
}

function createMoneyLine(label: string, valueCopper: number): HTMLElement {
    const lineElement = document.createElement("div");
    lineElement.className = "tooltip-money-line";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const moneyElement = document.createElement("span");
    moneyElement.className = "tooltip-money";
    moneyElement.append(...createMoneyAmountDisplayElements(convertCopperToLowestTerms(valueCopper)));

    lineElement.append(labelElement, moneyElement);
    return lineElement;
}
