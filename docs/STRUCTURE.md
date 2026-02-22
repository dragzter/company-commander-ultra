# Project Structure Guide

## Layout Overview

- **`src/constants/`** – Config and shared definitions: economy, CSS selectors, images, types, items (weapons, armor, throwable, medical, etc.)
- **`src/game/`** – Game logic and UI:
  - **`entities/`** – Domain models: company, soldier (manager, traits, status), levels, effects
  - **`html-templates/`** – Markup: setup, market, partials
  - **`ui/`** – DOM interaction:
    - **`event-configs.ts`** – Selector → callback mappings
    - **`event-handlers/`** – `dom-event-manager.ts` binds configs to the DOM
    - **`screen-manager.ts`** – Renders templates and binds events
    - **`ui-manager.ts`** – Top-level UI flow
- **`src/store/`** – Zustand state and actions
- **`src/services/`** – Stateless helpers: ui, combat, missions
- **`src/utils/`** – Pure helpers: `math.ts` (random, toNum, toFNum), html-utils, name-utils, item-utils
- **`src/style/`** – CSS

## Consolidated Items

- **`utils/math.ts`** – Merged from `random.ts` and `number-utils.ts`; contains getRandomValueFromStringArray, getRandomNumberFromRange, getRandomPortraitImage, toNum, toFNum, clamp, randomInt
- **`game/ui/event-handlers/`** – Moved from `game/event-handlers/`; all UI + DOM binding lives under `game/ui/`

## Data Flow

- **Store** → Templates call `getState()` and bake values into HTML
- **Screen manager** → Picks template, injects into DOM, runs event-configs
- **Event handlers** → Attach listeners; callbacks update store or trigger re-renders
