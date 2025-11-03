### Part 1: The Final Data Formatting Goal

Your goal is to manually create a single, clean **`Chemistry Lookup`** sheet and update your **`Advanced Attributes`** sheet. Once this is done, the old `Chemistry Matrix` and `Mii Chemistry Matrix` sheets will be deleted.

#### 1\. `Advanced Attributes` Sheet

This is your master list of all players. It must be updated with your new helper columns.

  * **Action:** Add two new columns (e.g., in `X` and `Y`).
  * **Column `IS_MII` (e.g., Col X):** This column must contain `TRUE` for every Mii player and `FALSE` for every other character (Mario, Yoshi, etc.).
  * **Column `MII_COLOR` (e.g., Col Y):** This column is **only** populated for Miis. It must contain the Mii's color as a text string (e.g., `Black`, `Blue`, `Light Green`).
  * **Player Names (Column A):** All names must be unique and final (e.g., `BlackF`, `BlueM`, `Yoshi (Green)`, `Mario`). These names are the **Primary Key** for your entire system.

#### 2\. `Chemistry Lookup` Sheet (The New Source of Truth)

This is the sheet you will create manually. It will be the *only* source of chemistry data for the entire v3 suite.

  * **Structure:** It must have exactly three columns:
      * **Column A: `Player 1`**
      * **Column B: `Player 2`**
      * **Column C: `Chemistry`**
  * **Data Rules:**
    1.  **Valid Names:** Every name in `Player 1` and `Player 2` **must exactly match** a name in the `Advanced Attributes` `NAME` column. This is the most critical rule. The script will fail to find players if this rule is broken.
    2.  **One Pair, One Rule:** Each pair should only be listed once (e.t., you should have `Mario | Luigi | 100`, not a second entry for `Luigi | Mario | 100`).
    3.  **Values:** The `Chemistry` column should contain the numeric value (`100`, `-100`, etc.).

**Example of Final `Chemistry Lookup` Data:**

| Player 1 | Player 2 | Chemistry |
| :--- | :--- | :--- |
| `Mario` | `Luigi` | 100 |
| `Mario` | `Yoshi (Green)` | -100 |
| `BlackF` | `BlackM` | 100 |
| `BlackF` | `Mario` | 100 |
| `BlueM` | `Mario` | -100 |

Once you have manually created this sheet, the "crucial (breaking) element" is solved.

-----

### Part 2: Player Database v3 Implementation Document

**Architecture:** **Cache-on-Read with Automated Invalidation**

**Goal:** To refactor the Player Database suite to be 100% reliable. All web apps will read from a high-speed `CacheService` cache, which is automatically invalidated by a simple `onEdit` trigger, ensuring data is always fresh.

#### Phase 1: Configuration & Code Demolition

**Goal:** Remove all obsolete code related to the old, failed conversion process and update the config file.

| Task | Action for AI Agent | Source Files Affected |
| :--- | :--- | :--- |
| **1.1: Delete Obsolete Code** | **DELETE** the entire `Conversion.js` script file. It is no longer needed. | `Conversion.js` |
| **1.2: Delete Stale Cache Logic** | **DELETE** the `getLineupChemistryDataFromJSON` function. It reads from the old, stale `'CHEMISTRY_DATA'` property. <br> **DELETE** `getPlayerList` and `getMultiplePlayerChemistry`. They also read from the stale JSON. <br> **DELETE** `checkIfChemistryDataNeedsUpdate` and its complex checksum logic. This is now obsolete. | `Lineups.js`, `Chemistry.js` |
| **1.3: Clean Up `DatabaseMenu.js`** | **DELETE** the entire `'🔧 Chemistry Tools'` sub-menu. <br> **REPLACE** it with a single, simple admin tool: `ui.createMenu('🔧 Admin Tools').addItem('🧹 Clear All Caches', 'clearAllAppCaches')`. | `DatabaseMenu.js` |
| **1.4: Update `DatabaseConfig.js`** | **ADD** the new helper column definitions to `CONFIG.ATTRIBUTES_CONFIG.COLUMNS`. <br> • `IS_MII: 24` (or the correct column number) <br> • `MII_COLOR: 25` (or the correct column number) <br> **UPDATE** `CONFIG.ATTRIBUTES_CONFIG.TOTAL_COLUMNS` to `25` (or the correct total). <br> **UPDATE** `CONFIG.SHEETS.MII_COLOR_CHEMISTRY` to `CHEMISTRY_LOOKUP` (or just remove the Mii sheet entry). | `DatabaseConfig.js` |
| **1.5: Clean HTML Files** | **DELETE** the "Update Banner" and its related functions (`checkForUpdates`, `refreshChemistryData`) from `LineupBuilder.html`. The new system is always in sync. | `LineupBuilder.html` |

#### Phase 2: Implement the New v3 Caching System

**Goal:** Create a single, fast function to read from your new `Chemistry Lookup` sheet and a trigger to automatically keep it fresh.

| Task | Action for AI Agent | Source Files Affected |
| :--- | :--- | :--- |
| **2.1: Create the New `onEdit` Trigger** | **Action:** Create a new `onEdit(e)` function in a utility file (like `DatabaseMenu.js` or a new `Triggers.js`). <br> • This function **must** check if the edited sheet `e.range.getSheet().getName()` is `config.SHEETS.CHEMISTRY_LOOKUP`. <br> • If it is, and the edit is not in the header row (`e.range.getRow() > 1`), it must **immediately clear the cache**: `CacheService.getScriptCache().remove('chemistryData');` | `DatabaseMenu.js` (or new file) |
| **2.2: Refactor `getAttributeData`** | **Action:** Refactor `getAttributeData()` to use `CacheService` instead of the global `attributeCache` variable. <br> • `var cache = CacheService.getScriptCache();` <br> • `var cached = cache.get('attributeData');` <br> • `if (cached) return JSON.parse(cached);` <br> • If it's a "cache miss," read the sheet, then `cache.put('attributeData', JSON.stringify(result), 21600);` (6-hour cache). | `AttributeComparison.js` |
| **2.3: Create New `getChemistryData`** | **Action:** Create **one** new, central function: `getChemistryData()`. This function will replace *all* old chemistry-reading logic. <br> • It must use the exact same `CacheService` pattern as Task 2.2, but with the key `'chemistryData'`. <br> • On a "cache miss," it must read *directly* from your new, clean `Chemistry Lookup` sheet and build the `matrix` and `players` objects (similar to the old `getChemistryLookupData` logic). | `Lineups.js` (or `Chemistry.js`) |
| **2.4: Create `clearAllAppCaches`** | **Action:** Create the new function for your menu item: `function clearAllAppCaches() { var cache = CacheService.getScriptCache(); cache.remove('chemistryData'); cache.remove('attributeData'); ... }` | `DatabaseMenu.js` |

#### Phase 3: Refactor All Apps to Use New Data

**Goal:** Point all web apps to the new, reliable data functions.

| Task | Action for AI Agent | Source Files Affected |
| :--- | :--- | :--- |
| **3.1: Refactor `AttributeComparison.js`** | **Action:** Refactor `getPlayerAttributes()` and `getPlayerAttributesWithAverages()`. <br> • **Problem:** They use hardcoded indices like `row[1]`, `row[6]`, `row[10]`, `row[22]`, etc.. <br> • **Fix:** Replace *every* index with the corresponding variable from `DatabaseConfig.js`. <br> • **Example:** <br> ` javascript <br> var COLS = getConfig().ATTRIBUTES_CONFIG.COLUMNS; <br> characterClass: row[COLS.CHARACTER_CLASS - 1] // -1 for 0-based index <br> pitchingOverall: row[COLS.PITCHING_OVERALL - 1] <br>  ` | `AttributeComparison.js` |
| **3.2: Refactor `LineupBuilder.html`** | **Action:** In the `<script>` block, find `loadPlayers()`. <br> • **REPLACE** the call to `google.script.run...getLineupChemistryDataFromJSON()` with `google.script.run...getChemistryData()` (your new function from Task 2.3). | `LineupBuilder.html` |
| **3.3: Refactor `PlayerChemistry.html`** | **Action:** In the `<script>` block, find `loadPlayers()`. <br> • **REPLACE** the call to `google.script.run...getPlayerList()` with a new server-side function, e.g., `getChemistryPlayerList()`, which simply calls `getChemistryData()` and returns `data.players`. | `PlayerChemistry.html`, `Chemistry.js` |
| **3.4: Refactor `Chemistry.js`** | **Action:** Create the new `getChemistryPlayerList()` function (for Task 3.3). <br> • **Action:** Create a new `getMultiplePlayerChemistry()` function that calls `getChemistryData()` and uses the returned `matrix` and `thresholds` to build its response. | `Chemistry.js` |