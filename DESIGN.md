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
