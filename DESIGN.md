# Inventory System Design Practice

## Purpose

This repo is being used for a small, real web app project that teaches system design through an inventory system. The goal is not just to produce code quickly. The goal is to practice seeing design choices, reasoning through them, and understanding how those choices affect future change.

The working project idea is a tiny inventory web app inspired by an existing Unity inventory system. The app should be small enough to finish, but real enough to require meaningful design decisions around items, stacks, slots, UI, state changes, and reusable core logic.

## Learning Mode

Codex should work in an explanatory, collaborative mode:

- Explain what is happening and why.
- Identify which choices are system design choices.
- Ask understanding checks before giving away conclusions.
- Let Brian reason through options before recommending an answer.
- Prefer small steps over large automated rewrites.
- When coding, keep the implementation simple enough to understand.
- Treat this as practice in becoming more capable, not just getting files changed.

Brian may often want to implement suggested changes himself. Codex should support that by making suggestions, explaining tradeoffs, and reviewing reasoning or code when asked.

## Brian's Current Level

Brian is not a beginner programmer. He has built nontrivial systems in both web/TypeScript and Unity/C#, including:

- A Fourier visualization web app that parses math expressions, samples functions, computes Fourier sine coefficients numerically, and animates the construction of Fourier partial sums.
- A Unity inventory system with ScriptableObject item definitions, inventory entries/stacks, stack limits, cursor-held inventory entries, slot UI, stack splitting, and update events.

Current strengths:

- Comfortable reading and writing real code.
- Thinks carefully about concepts and user understanding.
- Has good instincts around separating item definitions from inventory stacks.
- Understands that reusable systems should not dictate presentation details.
- Wants code to serve understanding, not only functionality.

Current growth edge:

- System design feels blurry: what it is, when it is happening, and how to evaluate design choices.
- Brian wants help naming responsibilities, boundaries, dependencies, and tradeoffs.
- Explanations should not assume he already knows architecture terminology, but also should not talk down to him.

Best support level:

- Explain concepts plainly, using the current code as examples.
- Ask Brian to reason through consequences before presenting final recommendations.
- Use concrete examples over abstract architecture lectures.
- Introduce terminology only when it helps name something already visible.

## Existing Unity Inventory System

The prior Unity project is here:

https://github.com/bslininger/terrain-items-experiment/tree/main/Assets/Scripts

Inventory-related code is mostly in:

- `Assets/Scripts/Inventory/Inventory.cs`
- `Assets/Scripts/Inventory/InventoryPanelController.cs`
- `Assets/Scripts/Inventory/InventoryItemCursorFollower.cs`
- `Assets/InventoryUI/Scripts/InventorySlotUIController.cs`
- `Assets/InventoryUI/Scripts/StackSizeSelectorPanelController.cs`
- `Assets/InventoryUI/Scripts/InventoryInterfaces.cs`
- `Assets/Scripts/Item.cs`
- `Assets/Scripts/WorldInventoryItem.cs`
- `Assets/Scripts/EventManager.cs`
- `Assets/Scripts/UIManager.cs`

High-level read:

- `Item.cs` is an item definition, implemented as a Unity `ScriptableObject`.
- `Inventory.InventoryEntry` represents a stack of a given item in a given quantity.
- `Inventory.cs` owns inventory entries, cursor-held entries, add/stack/swap/split behavior, and slot refresh notifications.
- `InventoryPanelController`, `InventoryItemCursorFollower`, `InventorySlotUIController`, and `StackSizeSelectorPanelController` are Unity UI/presentation/interaction pieces.
- `EventManager` is used as a bridge between inventory state changes and UI refreshes.

Important design observation:

Brian already made a strong design choice by separating item definitions from inventory stacks. The next major design improvement would be separating inventory core rules from Unity UI details. Right now `Inventory.cs` still knows about `InventorySlotUIController`, `RectTransform`, `UIManager`, and cursor follower behavior. That makes it partly reusable inventory logic and partly Unity-specific UI coordinator.

## Early Design Principles

The inventory system should own inventory meaning:

- What items exist in which slots.
- What quantities are present.
- Whether stacks can merge.
- How much was added.
- How much was left over.
- Which slots changed.
- Why an operation succeeded or failed.

The implementer should own presentation:

- How slots look.
- How panels open.
- Where popups appear.
- Which sounds or animations play.
- How changed slots are highlighted.
- How errors are shown to the player.

Working principle:

The inventory model should know inventory rules, not presentation details.

Another way Brian phrased this:

The implementer's responsibility is to translate what the inventory system gives back to the actual visuals of the page or game.

## First System Design Topic

The first major design decision is how to represent items and stacks.

A useful starting model is likely:

- An item definition describes the kind of item.
- An inventory stack describes a quantity of that item.
- A slot contains either a stack or nothing.

This mirrors the stronger part of the Unity design.

Questions to reason through:

- If there are two stacks of health potions, what gets duplicated?
- If the potion name changes, where should that change happen?
- If two swords can have different durability later, do we need item instances distinct from item definitions?
- Which model is simplest now while still leaving a clean place for likely future changes?

## Hopes For This Work

Brian wants to grow as a person and developer through this process, not only move faster. He is interested in using Codex as a collaborator, tutor, and thinking partner.

The desired experience is:

- Build something real.
- Learn system design by doing.
- Become more capable afterward.
- Keep agency and understanding rather than outsourcing all judgment.
- Practice reasoning about software boundaries and responsibilities.

This project should avoid turning into pure automation. Speed is useful, but the real purpose is learning and design practice.

## Concerns

Project-specific concerns:

- The project should not become too large too quickly.
- The design should start good enough to reduce future mess, without trying to predict every future feature.
- The app should stay understandable.
- Codex should not overbuild or jump too far ahead of Brian's current understanding.

Broader concerns:

- Agentic AI is impressive but also scary.
- Brian is concerned that understanding and knowledge may become less valued in a world focused on speed and automation.
- The preferred answer to that concern is not to reject the tools, but to use them in a way that strengthens judgment, understanding, taste, and responsibility.

Guiding idea:

AI can make execution cheaper, but understanding still matters. In many cases it matters more, because someone has to frame the problem, judge the output, understand consequences, and decide what should exist.

## Continuity Note

If this work resumes in a future Codex session or on another computer, start here. The project is intentionally a system design practice exercise centered on a small inventory web app, informed by Brian's earlier Unity inventory system.

Do not immediately rush into implementation. Start by restoring the learning context, then continue with a small design decision and an understanding check.

## Current Project State

The active project is in `inventory/`. The older `kana/` folder is unrelated.

Current structure:

- `inventory/src/inventoryModel.ts` owns core inventory rules and types.
- `inventory/src/itemDefinitions.ts` owns sample item definitions.
- `inventory/src/inventoryPage.ts` owns the browser page behavior and also contains some controller-like logic.
- `inventory/src/itemTooltip.ts` creates item tooltip elements.
- `inventory/src/viewHelpers.ts` owns shared view helpers such as sprite paths, item sprite elements, and money display elements.
- `inventory/src/inventoryNodeDemo.ts` is a Node demo for exercising model behavior outside the browser.
- `inventory/public/sprites/` contains item and money sprites. Item sprite filenames intentionally match item ids.

Run commands from `inventory/`:

- `npm.cmd run dev`
- `npm.cmd run typecheck`
- `npm.cmd run demo`
- `npm.cmd run build`

The app currently supports:

- Item definitions with `id`, `name`, `maxStackSize`, and `valueCopper`.
- Inventory entries as `itemId` plus `quantity`.
- Inventory slots as `InventoryEntry | null`.
- Adding items with merge-first behavior and overflow reporting.
- Direct slot movement via `moveSlot`, kept in the model even though the current page mostly uses held-slot interaction.
- A separate `HeldSlot`, intentionally outside `Inventory`.
- Held-slot interaction: pick up, place, merge, swap, and no-op cases.
- Ctrl+click to pull one item from a stack into the empty held slot.
- Shift+click to open a quantity chooser and pull a selected amount into the empty held slot.
- Sprite display in slots, with a placeholder fallback for missing item sprites.
- A money system where item values are stored as copper integers, while player money is stored as non-normalized `{ gold, silver, copper }`.
- Selling the held item stack for lowest-terms money added to the player money object.
- Hover tooltips for occupied inventory slots only.

Important design decisions made so far:

- The inventory model owns rules and state transitions, not presentation.
- UI/controller code decides how clicks, Ctrl, Shift, dialogs, hover, and rendering map to model calls.
- Held slot is its own slot-like container, not part of `Inventory`.
- Item sprites are an implicit view convention: `/sprites/${itemId}.png`.
- Money sprites are view assets, not item definitions.
- Item value is stored as `valueCopper`; player money is stored as denominations and is not automatically normalized.
- Tooltip positioning is pure UI behavior and belongs outside the model.

Brian's current collaboration preference:

- Ask one design question at a time.
- Use light hints unless Brian asks for more.
- Let Brian sketch model/result types and rules before Codex suggests final shapes.
- Brian may prefer to implement model changes himself and have Codex review.
- Codex can more freely help with view/CSS/DOM work, which is useful but not the main learning target.
- Continue naming responsibilities and boundaries explicitly, but avoid over-explaining obvious points.

Useful next directions:

- Review and refine tooltip styling/positioning.
- Consider whether `inventoryPage.ts` is starting to mix too much view and controller logic.
- Add purchase/spend-money behavior later, where copper is spent before silver/gold according to the chosen non-normalized money design.
- Add equipment slots, container inventories, or item instance state such as durability/charges when the current model starts needing them.

## Latest Continuity Update

This section supersedes any stale "Current Project State" notes above.

Recent model work:

- `inventory/src/inventoryModel.ts` now includes reusable money spending behavior through `spendMoney`.
- Player money is still stored as non-normalized `{ gold, silver, copper }`.
- Spending uses the lowest denomination first: copper before silver before gold.
- Larger denominations are broken only when needed, and change is returned in lower denominations.
- `getAddItemCapacity` checks how many of an item can fit without mutating inventory.
- `buyItem` is a transactional model operation for purchases:
  - it throws for invalid item ids or invalid quantities,
  - returns `not-enough-money` for expected affordability failure,
  - returns `not-enough-space` for expected inventory capacity failure,
  - mutates money and inventory only after pre-checks pass,
  - throws if post-check invariants fail.
- `inventory/src/inventoryNodeDemo.ts` has been expanded as a lightweight model exercise/demo for spending, capacity, and buying.

Recent view/controller work:

- The old top "held item" panel was removed.
- The held item now appears as a cursor follower, 10px down and right from the cursor.
- The held item follower is allowed to go off the right or bottom of the viewport.
- The held item follower has higher z-index than the tooltip, so if they overlap the held item appears above.
- Temporary purchase buttons were added to the page:
  - `Buy 3 Apples`
  - `Buy 2 Potions`
- These are intentionally temporary test controls, not the final merchant UI.
- `inventory/src/inventoryView.ts` was added and now owns rendering/DOM display responsibilities.
- `inventory/src/inventoryPage.ts` is now mostly page/controller wiring:
  - app state,
  - DOM element lookup,
  - user event handlers,
  - model calls,
  - deciding when to refresh the view.
- The view module does not import `ITEM_DEFINITIONS`; the page/controller passes item definitions in.
- Missing item definitions in the view should fall back gracefully to the raw `itemId` and log `console.warn`.
- Missing sprites are still handled by `createItemSprite`, which falls back to `placeholder.png`.
- `renderInventoryPage` was renamed to `refreshInventoryView` to clarify that the page/controller asks the view to refresh, while the view owns actual rendering.
- The quantity dialog controller state was refactored from a bare `quantityDialogSourceIndex` into a `QuantityDialogMode`.
- Currently the only quantity dialog mode is:
  - `{ kind: "pull-from-slot"; sourceIndex: number }`
- This was done so the same quantity dialog can later support buying from merchant offers.

Current design understanding:

- Model code owns domain rules and state transitions.
- View code owns DOM creation, display text, CSS classes, tooltip/cursor follower positioning, and visual fallbacks.
- Controller/page code is the middleman:
  - it interprets user actions,
  - chooses model operations,
  - updates transient app/controller state,
  - tells the view what state/result to render.
- Some code can be view-ish but remain in the controller temporarily if it is tightly tied to a workflow, such as the quantity chooser input syncing.

Next planned feature:

- Add a merchant screen/panel.
- When a merchant screen is open, both the player's inventory and the merchant's merchandise should be visible.
- Merchant merchandise should behave like a shop catalog, not like a finite slot inventory.
- Merchants have infinite inventory of the items they sell.
- A merchant offer should probably store `itemId` only for now; purchase quantity is chosen during interaction.
- If an offered item's `maxStackSize` is `1`, clicking buys one.
- If `maxStackSize` is greater than `1`, clicking opens the existing quantity chooser.
- The quantity chooser should have min `1` and max equal to the player's current capacity for that item from `getAddItemCapacity`.
- If capacity is `0`, the controller should not open the chooser and should instead show an inventory-full style result.
- The next model/domain file should probably be `inventory/src/merchantModel.ts`.
- Proposed initial merchant model:
  - `MerchantOffer` with `itemId`.
  - `Merchant` with `id`, `name`, and `offers`.
- A later merchant model operation may be `buyMerchantOffer`, which validates that the merchant actually sells the item before delegating to `buyItem`.
- Trying to buy an item a merchant does not sell should be treated as an invalid operation/programmer error, not a normal gameplay result.

Current collaboration preferences:

- Brian wants to write model code himself when practical and have Codex review it.
- Brian also wants to write meaningful controller workflow code when it is design-rich.
- Codex can more freely implement view/CSS/DOM changes, but should still explain the boundary decisions.
- Use hints when Brian asks for hints; do not jump straight to final answers in those moments.
- Ask one design question at a time.
- Prefer leading questions that help Brian figure out the design, especially for model and controller code.
- Be explicit about whether a change is model, view, controller, or app composition/root wiring.
- Treat naming and small clarifying comments as part of understandability, not as cosmetic trivia.
- Brian has his own coding style and may intentionally keep formatting choices that differ from common formatter defaults.
- When reviewing Brian's code, separate correctness/design concerns from optional style polish.
- Avoid automatically rewriting Brian's code into a different style unless the change is necessary or requested.
- Brian is using this project partly to preserve and strengthen human understanding in an AI-heavy coding world.
- The preferred use of Codex is not "delegate everything," but "use the agent as tutor, reviewer, collaborator, and accelerator while keeping agency."
